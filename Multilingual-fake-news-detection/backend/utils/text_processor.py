"""
Text Processing Utilities
Handles text preprocessing, cleaning, and language detection
"""
import re
import string
from typing import Optional
import logging
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# Set seed for consistent language detection results
DetectorFactory.seed = 0

logger = logging.getLogger(__name__)

class TextProcessor:
    def __init__(self):
        self.stop_words_en = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but'}
        
    def preprocess(self, text: str, remove_stopwords: bool = False) -> str:
        """
        Preprocess text for ML model
        
        Args:
            text: Raw text string
            remove_stopwords: Whether to remove stop words
            
        Returns:
            Cleaned text
        """
        try:
            # Convert to lowercase
            text = text.lower()
            
            # Remove URLs
            text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
            
            # Remove email addresses
            text = re.sub(r'\S+@\S+', '', text)
            
            # Remove mentions and hashtags (social media)
            text = re.sub(r'@\w+|#\w+', '', text)
            
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text)
            
            # Remove leading/trailing whitespace
            text = text.strip()
            
            # Optional: Remove stopwords
            if remove_stopwords:
                words = text.split()
                text = ' '.join([word for word in words if word not in self.stop_words_en])
            
            return text
            
        except Exception as e:
            logger.error(f"Error preprocessing text: {str(e)}")
            return text
    
    def detect_language(self, text: str) -> str:
        """
        Detect language of text using langdetect library
        Supports 55+ languages with high accuracy
        
        Args:
            text: Text to analyze
            
        Returns:
            Language code (ISO 639-1 format: 'en', 'es', 'hi', 'zh-cn', etc.)
        """
        try:
            # Remove URLs and special characters that might confuse detection
            clean_text = re.sub(r'http\S+|www\S+|https\S+', '', text)
            clean_text = re.sub(r'[^\w\s]', ' ', clean_text)
            clean_text = clean_text.strip()
            
            # Need at least some text for detection
            if len(clean_text) < 3:
                return 'en'  # Default to English for very short text
            
            # Detect language using langdetect
            lang_code = detect(clean_text)
            
            # Map common language codes to readable names for logging
            lang_names = {
                'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
                'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ar': 'Arabic',
                'hi': 'Hindi', 'bn': 'Bengali', 'ta': 'Tamil', 'te': 'Telugu',
                'mr': 'Marathi', 'gu': 'Gujarati', 'kn': 'Kannada', 'ml': 'Malayalam',
                'pa': 'Punjabi', 'ur': 'Urdu', 'zh-cn': 'Chinese (Simplified)',
                'zh-tw': 'Chinese (Traditional)', 'ja': 'Japanese', 'ko': 'Korean'
            }
            
            lang_name = lang_names.get(lang_code, lang_code.upper())
            logger.info(f"Detected language: {lang_name} ({lang_code})")
            
            return lang_code
            
        except LangDetectException as e:
            logger.warning(f"Language detection failed: {str(e)} - defaulting to English")
            return 'en'
        except Exception as e:
            logger.error(f"Error detecting language: {str(e)}")
            return 'en'  # Default to English on error
    
    def extract_keywords(self, text: str, top_n: int = 10) -> list:
        """
        Extract top keywords from text (simple frequency-based)
        
        Args:
            text: Text to analyze
            top_n: Number of top keywords to return
            
        Returns:
            List of keywords
        """
        try:
            # Clean text
            text = text.lower()
            text = re.sub(r'[^\w\s]', '', text)
            
            # Split into words
            words = text.split()
            
            # Count frequencies
            word_freq = {}
            for word in words:
                if len(word) > 3 and word not in self.stop_words_en:
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            # Sort by frequency
            sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            
            # Return top N
            return [word for word, freq in sorted_words[:top_n]]
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []
    
    def clean_html_text(self, text: str) -> str:
        """
        Clean HTML artifacts from scraped text
        
        Args:
            text: Text with HTML artifacts
            
        Returns:
            Cleaned text
        """
        try:
            # Remove HTML tags
            text = re.sub(r'<[^>]+>', '', text)
            
            # Remove HTML entities
            text = re.sub(r'&\w+;', ' ', text)
            
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error cleaning HTML text: {str(e)}")
            return text
    
    def truncate_text(self, text: str, max_length: int = 512) -> str:
        """
        Truncate text to maximum length (for model input)
        
        Args:
            text: Text to truncate
            max_length: Maximum number of words
            
        Returns:
            Truncated text
        """
        words = text.split()
        if len(words) > max_length:
            return ' '.join(words[:max_length])
        return text
    
    def validate_input(self, text: str) -> dict:
        """
        Validate input text
        
        Args:
            text: Text to validate
            
        Returns:
            Dict with validation results
        """
        if not text or not text.strip():
            return {
                'valid': False,
                'error': 'Text is empty'
            }
        
        word_count = len(text.split())
        
        if word_count < 5:
            return {
                'valid': False,
                'error': 'Text too short (minimum 5 words)'
            }
        
        if len(text) > 10000:
            return {
                'valid': False,
                'error': 'Text too long (maximum 10000 characters)'
            }
        
        return {
            'valid': True,
            'word_count': word_count,
            'char_count': len(text)
        }
