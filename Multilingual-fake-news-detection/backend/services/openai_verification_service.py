"""
LLM Verification Service.
Supports Gemini, OpenAI, and Ollama behind the existing verification interface.
Cloud providers can fall back to local Ollama automatically.
"""
import json
import logging
import base64
from pathlib import Path
from typing import Dict, Optional

import requests

import config

logger = logging.getLogger(__name__)


class OpenAIVerificationService:
    """Provider-aware multilingual verification layer."""

    def __init__(self):
        self.openai_api_key = config.OPENAI_API_KEY
        self.openai_model = getattr(config, 'OPENAI_MODEL', 'gpt-4o-mini')
        self.gemini_api_key = getattr(config, 'GEMINI_API_KEY', '')
        self.gemini_model = getattr(config, 'GEMINI_MODEL', 'gemini-2.0-flash')
        self.ollama_base_url = getattr(config, 'OLLAMA_BASE_URL', 'http://localhost:11434').rstrip('/')
        self.ollama_model = getattr(config, 'OLLAMA_MODEL', 'qwen2.5:3b')
        self.ollama_vision_model = getattr(config, 'OLLAMA_VISION_MODEL', 'gemma3:1b')
        self.provider = self._resolve_provider()
        self.model = self._resolve_model(self.provider)
        self.timeout_seconds = int(getattr(config, 'OPENAI_TIMEOUT_SECONDS', 20))

    @staticmethod
    def _normalize_gemini_model(model_name: str) -> str:
        """Accept model slugs, `models/...` names, or display names."""
        normalized = str(model_name or '').strip()
        if not normalized:
            return 'gemini-2.0-flash'
        if normalized.startswith('models/'):
            normalized = normalized.split('/', 1)[1]
        if ' ' in normalized and not normalized.startswith('gemini-'):
            normalized = normalized.lower().replace(' ', '-')
        return normalized

    def _resolve_provider(self) -> str:
        configured = getattr(config, 'LLM_PROVIDER', 'auto')
        if configured in ('gemini', 'openai', 'ollama'):
            return configured
        if self.gemini_api_key:
            return 'gemini'
        if self.openai_api_key:
            return 'openai'
        return 'ollama'

    def _resolve_model(self, provider: str) -> str:
        if provider == 'gemini':
            return self._normalize_gemini_model(self.gemini_model)
        if provider == 'openai':
            return self.openai_model
        if provider == 'ollama-vision':
            return self.ollama_vision_model
        return self.ollama_model

    def _provider_display_name(self, provider: Optional[str] = None) -> str:
        active_provider = provider or self.provider
        return {
            'gemini': 'Gemini',
            'openai': 'OpenAI',
            'ollama': 'Ollama'
        }.get(active_provider, active_provider)

    def _ollama_configured(self) -> bool:
        return bool(self.ollama_base_url and self.ollama_model)

    @property
    def configured(self) -> bool:
        if self.provider == 'gemini':
            return bool(self.gemini_api_key)
        if self.provider == 'openai':
            return bool(self.openai_api_key)
        return self._ollama_configured()

    def verify_content(
        self,
        text: str,
        content_type: str = 'text',
        language: str = 'auto',
        source_url: Optional[str] = None
    ) -> Dict:
        """Get multilingual credibility assessment from the active LLM provider."""
        if not self.configured:
            return {
                'used': False,
                'available': False,
                'error': self._configuration_error(self.provider)
            }

        if not text or len(text.strip()) < 10:
            return {
                'used': False,
                'available': True,
                'error': 'Insufficient text for LLM verification'
            }

        prompt_context = {
            'content_type': content_type,
            'language_hint': language,
            'source_url': source_url or ''
        }

        try:
            return self._verify_with_provider(self.provider, prompt_context, text, fallback_from=None)
        except Exception as exc:
            try:
                return self._fallback_to_ollama(exc, prompt_context, text)
            except Exception as final_exc:
                logger.warning('%s verification failed: %s', self._provider_display_name(), final_exc)
                return {
                    'used': False,
                    'available': True,
                    'error': str(final_exc)
                }

    def verify_image_content(
        self,
        image_path: str,
        extracted_text: str = '',
        language: str = 'auto'
    ) -> Dict:
        """Run image verification directly through an Ollama vision model."""
        image_file = Path(image_path)
        if not image_file.exists() or not image_file.is_file():
            return {
                'used': False,
                'available': False,
                'error': f'Image file not found: {image_path}'
            }

        prompt_context = {
            'content_type': 'image',
            'language_hint': language,
            'source_url': '',
            'ocr_text': (extracted_text or '')[:2000]
        }

        try:
            return self._verify_with_provider('ollama-vision', prompt_context, str(image_file), fallback_from=None)
        except Exception as exc:
            logger.warning('Ollama vision verification failed; falling back to text verification: %s', exc)
            return self.verify_content(
                text=extracted_text,
                content_type='image',
                language=language
            )

    def _verify_with_provider(
        self,
        provider: str,
        prompt_context: Dict,
        text: str,
        fallback_from: Optional[str]
    ) -> Dict:
        if provider == 'gemini':
            content = self._call_gemini(prompt_context, text)
        elif provider == 'openai':
            content = self._call_openai(prompt_context, text)
        elif provider == 'ollama-vision':
            content = self._call_ollama_vision(prompt_context, text)
        else:
            content = self._call_ollama(prompt_context, text)

        parsed = self._safe_parse_json(content)
        verdict = str(parsed.get('verdict', '')).strip().lower()
        if verdict not in ('real', 'fake'):
            raise RuntimeError(f'{self._provider_display_name(provider)} response missing valid verdict')

        confidence = self._clamp_confidence(parsed.get('confidence', 50))
        result = {
            'used': True,
            'available': True,
            'prediction': 'Real' if verdict == 'real' else 'Fake',
            'confidence': confidence,
            'reasoning': str(parsed.get('reasoning', ''))[:400],
            'signals': parsed.get('signals', []) if isinstance(parsed.get('signals', []), list) else [],
            'language': prompt_context.get('language_hint', 'auto'),
            'model': self._resolve_model(provider),
            'provider': 'ollama' if provider == 'ollama-vision' else provider
        }
        if fallback_from:
            result['fallback_from'] = fallback_from
        return result

    def _fallback_to_ollama(self, original_exc: Exception, prompt_context: Dict, text: str) -> Dict:
        if self.provider == 'ollama' or not self._ollama_configured():
            raise original_exc

        logger.warning('%s verification failed; trying Ollama fallback: %s', self._provider_display_name(), original_exc)

        try:
            return self._verify_with_provider('ollama', prompt_context, text, fallback_from=self.provider)
        except Exception as fallback_exc:
            raise RuntimeError(f'{original_exc}; Ollama fallback failed: {fallback_exc}') from fallback_exc

    def _configuration_error(self, provider: str) -> str:
        if provider == 'gemini':
            return 'GEMINI_API_KEY is not configured'
        if provider == 'openai':
            return 'OPENAI_API_KEY is not configured'
        return 'Ollama is selected but OLLAMA_BASE_URL or OLLAMA_MODEL is not configured'

    def _system_prompt(self) -> str:
        return (
            'You are a multilingual fake-news verification assistant. '
            'Input may be English, Hindi, Telugu, Kannada, Tamil, Malayalam, or mixed language. '
            'Analyze directly in the original language. '
            'Return ONLY valid JSON with keys: verdict, confidence, reasoning, signals. '
            'verdict must be either "Real" or "Fake". '
            'confidence must be a number from 0 to 100. '
            'signals must be a short string array of key factors.'
        )

    def _user_prompt(self, prompt_context: Dict, text: str) -> str:
        return (
            f'Context: {json.dumps(prompt_context, ensure_ascii=True)}\n\n'
            f'News content:\n{text[:6000]}'
        )

    def _image_user_prompt(self, prompt_context: Dict) -> str:
        ocr_text = prompt_context.get('ocr_text', '')
        return (
            f'Context: {json.dumps({k: v for k, v in prompt_context.items() if k != "ocr_text"}, ensure_ascii=True)}\n\n'
            'Inspect the attached image directly. Determine whether it looks like legitimate news content or fake/manipulated/misleading content. '
            'Use visible logos, layout, typography, screenshots, captions, and embedded text. '
            'OCR extracted text is provided as a secondary hint only and may contain errors.\n\n'
            f'OCR text hint:\n{ocr_text[:2000]}'
        )

    def _call_openai(self, prompt_context: Dict, text: str) -> str:
        messages = [
            {
                'role': 'system',
                'content': self._system_prompt()
            },
            {
                'role': 'user',
                'content': self._user_prompt(prompt_context, text)
            }
        ]

        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {self.openai_api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': self.openai_model,
                'messages': messages,
                'temperature': 0.1,
                'max_tokens': 250
            },
            timeout=self.timeout_seconds
        )

        if response.status_code != 200:
            raise RuntimeError(f'OpenAI API error {response.status_code}: {response.text[:200]}')

        payload = response.json()
        return payload['choices'][0]['message']['content']

    def _call_gemini(self, prompt_context: Dict, text: str) -> str:
        response = requests.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/{self._normalize_gemini_model(self.gemini_model)}:generateContent',
            params={'key': self.gemini_api_key},
            headers={'Content-Type': 'application/json'},
            json={
                'system_instruction': {
                    'parts': [{'text': self._system_prompt()}]
                },
                'contents': [
                    {
                        'parts': [
                            {
                                'text': self._user_prompt(prompt_context, text)
                            }
                        ]
                    }
                ],
                'generationConfig': {
                    'temperature': 0.1,
                    'responseMimeType': 'application/json'
                }
            },
            timeout=self.timeout_seconds
        )

        if response.status_code != 200:
            raise RuntimeError(f'Gemini API error {response.status_code}: {response.text[:200]}')

        payload = response.json()
        candidates = payload.get('candidates', [])
        if not candidates:
            raise RuntimeError('Gemini response missing candidates')

        parts = candidates[0].get('content', {}).get('parts', [])
        if not parts or 'text' not in parts[0]:
            raise RuntimeError('Gemini response missing text content')

        return parts[0]['text']

    def _call_ollama(self, prompt_context: Dict, text: str) -> str:
        response = requests.post(
            f'{self.ollama_base_url}/api/chat',
            headers={'Content-Type': 'application/json'},
            json={
                'model': self.ollama_model,
                'messages': [
                    {
                        'role': 'system',
                        'content': self._system_prompt()
                    },
                    {
                        'role': 'user',
                        'content': self._user_prompt(prompt_context, text)
                    }
                ],
                'stream': False,
                'format': 'json',
                'options': {
                    'temperature': 0.1
                }
            },
            timeout=self.timeout_seconds
        )

        if response.status_code != 200:
            raise RuntimeError(f'Ollama API error {response.status_code}: {response.text[:200]}')

        payload = response.json()
        message = payload.get('message', {})
        content = message.get('content', '')
        if not content:
            raise RuntimeError('Ollama response missing message content')

        return content

    def _call_ollama_vision(self, prompt_context: Dict, image_path: str) -> str:
        with open(image_path, 'rb') as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('ascii')

        response = requests.post(
            f'{self.ollama_base_url}/api/chat',
            headers={'Content-Type': 'application/json'},
            json={
                'model': self.ollama_vision_model,
                'messages': [
                    {
                        'role': 'system',
                        'content': self._system_prompt()
                    },
                    {
                        'role': 'user',
                        'content': self._image_user_prompt(prompt_context),
                        'images': [encoded_image]
                    }
                ],
                'stream': False,
                'format': 'json',
                'options': {
                    'temperature': 0.1
                }
            },
            timeout=self.timeout_seconds
        )

        if response.status_code != 200:
            raise RuntimeError(f'Ollama vision API error {response.status_code}: {response.text[:200]}')

        payload = response.json()
        message = payload.get('message', {})
        content = message.get('content', '')
        if not content:
            raise RuntimeError('Ollama vision response missing message content')

        return content

    def _safe_parse_json(self, content: str) -> Dict:
        """Parse JSON response, including fenced JSON fallback."""
        try:
            return json.loads(content)
        except Exception:
            cleaned = content.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.strip('`')
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:].strip()
            return json.loads(cleaned)

    def _clamp_confidence(self, value) -> float:
        try:
            numeric = float(value)
            return round(max(0.0, min(100.0, numeric)), 1)
        except Exception:
            return 50.0


_openai_verification_service = None


def get_openai_verification_service() -> OpenAIVerificationService:
    """Get singleton OpenAI verification service."""
    global _openai_verification_service
    if _openai_verification_service is None:
        _openai_verification_service = OpenAIVerificationService()
    return _openai_verification_service
