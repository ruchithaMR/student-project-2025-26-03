"""
Reusable fake news ML service.
Loads model/tokenizer once and exposes predict_text for inference.
"""

import logging
import os
import re
import socket
import time
from pathlib import Path
from typing import Dict

import pytesseract
import requests
import torch
import torch.nn.functional as F
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator
from langdetect import detect
from langdetect.lang_detect_exception import LangDetectException
from PIL import Image
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast

logger = logging.getLogger(__name__)


class FakeNewsService:
    def __init__(self):
        service_dir = Path(__file__).resolve().parent
        backend_dir = service_dir.parent

        self.model_dir = backend_dir / 'model' / 'fake_news_model'
        self.tokenizer_dir = backend_dir / 'model' / 'tokenizer'
        self.max_length = 512
        self.label_map = {0: 'REAL', 1: 'FAKE'}

        self.available = False
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.tokenizer = None
        self.model = None
        self._translation_backoff_until = 0.0
        self._translation_backoff_seconds = int(os.getenv('TRANSLATION_DNS_BACKOFF_SECONDS', 180))

        self._load_model_once()

    @staticmethod
    def _is_host_resolvable(host: str) -> bool:
        try:
            socket.getaddrinfo(host, 443)
            return True
        except OSError:
            return False

    @staticmethod
    def _normalize_whitespace(text: str) -> str:
        return re.sub(r'\s+', ' ', (text or '')).strip()

    @staticmethod
    def _extract_with_bs4(url: str, timeout: int = 15) -> str:
        resp = requests.get(url, timeout=timeout, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        for tag in soup(['script', 'style', 'noscript', 'header', 'footer', 'nav']):
            tag.decompose()

        # Prefer article-like containers if available, else fallback to body text.
        candidates = soup.select('article p')
        if candidates:
            raw_text = ' '.join(p.get_text(' ', strip=True) for p in candidates)
        else:
            raw_text = soup.get_text(' ', strip=True)

        return re.sub(r'\s+', ' ', raw_text).strip()

    def _load_model_once(self) -> None:
        if not self.model_dir.exists() or not self.tokenizer_dir.exists():
            logger.warning(
                'FakeNewsService disabled: model/tokenizer not found at %s and %s',
                self.model_dir,
                self.tokenizer_dir,
            )
            return

        try:
            self.tokenizer = DistilBertTokenizerFast.from_pretrained(str(self.tokenizer_dir))
            self.model = DistilBertForSequenceClassification.from_pretrained(str(self.model_dir))
            self.model.to(self.device)
            self.model.eval()
            self.available = True
            logger.info('FakeNewsService loaded on %s', self.device)
        except Exception as exc:
            self.available = False
            logger.exception('Failed to load FakeNewsService model: %s', exc)

    def _to_english_for_ml(self, text: str) -> str:
        """
        Convert any non-English input to English before sending it to the ML model.
        Falls back to original text if detection/translation fails.
        """
        cleaned = self._normalize_whitespace(text)
        if not cleaned:
            return cleaned

        try:
            language = detect(cleaned)
        except LangDetectException:
            # If language cannot be detected reliably, use original text.
            return cleaned
        except Exception as exc:
            logger.warning('Language detection failed: %s', exc)
            return cleaned

        if language == 'en':
            return cleaned

        now = time.time()
        if now < self._translation_backoff_until:
            return cleaned

        if not self._is_host_resolvable('translate.google.com'):
            self._translation_backoff_until = now + self._translation_backoff_seconds
            logger.warning(
                'Skipping translation for %ss due to DNS resolution failure for translate.google.com',
                self._translation_backoff_seconds,
            )
            return cleaned

        try:
            translated = GoogleTranslator(source='auto', target='en').translate(cleaned)
            translated = self._normalize_whitespace(translated)
            if translated:
                logger.info('ML input translated from %s to English', language)
                return translated
        except Exception as exc:
            self._translation_backoff_until = time.time() + self._translation_backoff_seconds
            logger.warning(
                'Translation to English failed for ML input. Using original text for %ss. Error: %s',
                self._translation_backoff_seconds,
                exc,
            )

        return cleaned

    def predict_text(self, text: str) -> Dict:
        """
        Predict whether the given text is FAKE or REAL.

        Returns:
        {
            'prediction': 'FAKE' | 'REAL',
            'confidence': float
        }
        """
        if not isinstance(text, str) or not text.strip():
            raise ValueError('Input text must be a non-empty string')

        if not self.available or self.model is None or self.tokenizer is None:
            raise RuntimeError('Fake news model is not available')

        ml_text = self._to_english_for_ml(text.strip())

        encoded = self.tokenizer(
            ml_text,
            return_tensors='pt',
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
        )

        input_ids = encoded['input_ids'].to(self.device)
        attention_mask = encoded['attention_mask'].to(self.device)

        with torch.no_grad():
            logits = self.model(input_ids=input_ids, attention_mask=attention_mask).logits

        probs = F.softmax(logits, dim=-1).squeeze(0)
        pred_idx = int(torch.argmax(probs).item())
        confidence = float(probs[pred_idx].item())
        real_prob = float(probs[0].item())
        fake_prob = float(probs[1].item())

        return {
            'prediction': self.label_map.get(pred_idx, 'REAL'),
            'confidence': round(confidence, 4),
            'probabilities': {
                # Keep title-case keys for existing frontend cards.
                'Real': round(real_prob * 100, 1),
                'Fake': round(fake_prob * 100, 1),
                # Include uppercase aliases for backward compatibility.
                'REAL': round(real_prob * 100, 1),
                'FAKE': round(fake_prob * 100, 1),
            }
        }

    def predict_image(self, image_path: str) -> Dict:
        """
        Run OCR on image, then classify extracted text as FAKE/REAL.

        Returns:
        {
            'prediction': 'FAKE' | 'REAL',
            'confidence': float,
            'extracted_text': str
        }
        """
        path = Path(image_path)
        if not path.exists() or not path.is_file():
            raise FileNotFoundError(f'Image not found: {image_path}')

        try:
            with Image.open(path) as img:
                raw_text = pytesseract.image_to_string(img)
        except Exception as exc:
            raise RuntimeError(f'Failed OCR on image: {exc}') from exc

        extracted_text = self._normalize_whitespace(raw_text)
        if len(extracted_text) < 10:
            raise ValueError('Could not extract enough text from image')

        result = self.predict_text(extracted_text)
        result['extracted_text'] = extracted_text
        return result

    def predict_url(self, url: str) -> Dict:
        """
        Scrape article text from URL, then classify as FAKE/REAL.

        Returns:
        {
            'prediction': 'FAKE' | 'REAL',
            'confidence': float,
            'article_text_length': int
        }
        """
        if not isinstance(url, str) or not url.strip():
            raise ValueError('URL must be a non-empty string')

        cleaned_url = url.strip()
        if not cleaned_url.startswith(('http://', 'https://')):
            raise ValueError('Invalid URL format')

        article_text = ''

        # Primary extractor: newspaper3k
        try:
            from newspaper import Article  # Lazy import to keep fallback working if optional deps are missing.
            article = Article(cleaned_url)
            article.download()
            article.parse()
            article_text = self._normalize_whitespace(article.text)
        except Exception as exc:
            logger.warning('newspaper3k extraction failed for %s: %s', cleaned_url, exc)

        # Fallback extractor: requests + BeautifulSoup
        if len(article_text) < 50:
            article_text = self._extract_with_bs4(cleaned_url)
            article_text = self._normalize_whitespace(article_text)

        if len(article_text) < 50:
            raise ValueError('Could not extract enough article text from URL')

        result = self.predict_text(article_text)
        result['article_text_length'] = len(article_text)
        return result


_fake_news_service = FakeNewsService()


def get_fake_news_service() -> FakeNewsService:
    return _fake_news_service
