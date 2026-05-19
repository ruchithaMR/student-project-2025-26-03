"""
Translation Service for Multilingual Support
Translates non-English text to English for knowledge pattern matching
"""
import logging
from deep_translator import GoogleTranslator
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        """Initialize translation service"""
        self.translator = GoogleTranslator(source='auto', target='en')
        self.supported_languages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'zh-CN', 'zh-TW',
            'ja', 'ko', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa',
            'ur', 'ne', 'si', 'th', 'vi', 'id', 'ms', 'tl', 'tr', 'pl', 'uk',
            'cs', 'sk', 'bg', 'ro', 'hu', 'fi', 'sv', 'da', 'no', 'nl', 'el'
        ]
        logger.debug("Translation service initialized")
    
    def translate_to_english(self, text: str, source_lang: Optional[str] = None) -> Dict:
        """
        Translate text to English for pattern matching
        
        Args:
            text: Text to translate
            source_lang: Source language code (optional, auto-detects if None)
        
        Returns:
            Dict with translated_text, original_text, source_language, success
        """
        try:
            # If text is already English, return as-is
            if source_lang and source_lang.lower() in ['en', 'english']:
                return {
                    'translated_text': text,
                    'original_text': text,
                    'source_language': 'en',
                    'success': True,
                    'translation_needed': False
                }
            
            # Attempt translation
            logger.info(f"Translating text from {source_lang or 'auto'} to English")
            
            # Update source language if specified
            if source_lang:
                self.translator.source = source_lang
            else:
                self.translator.source = 'auto'
            
            translated = self.translator.translate(text)
            
            # Check if translation succeeded
            if translated and translated != text:
                logger.info(f"Translation successful: {text[:50]}... -> {translated[:50]}...")
                return {
                    'translated_text': translated,
                    'original_text': text,
                    'source_language': source_lang or 'auto',
                    'success': True,
                    'translation_needed': True
                }
            else:
                # Translation returned same text (might be English or unsupported)
                logger.info("Text unchanged after translation (likely English)")
                return {
                    'translated_text': text,
                    'original_text': text,
                    'source_language': source_lang or 'en',
                    'success': True,
                    'translation_needed': False
                }
        
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            # Return original text if translation fails
            return {
                'translated_text': text,
                'original_text': text,
                'source_language': source_lang or 'unknown',
                'success': False,
                'translation_needed': False,
                'error': str(e)
            }
    
    def translate_batch(self, texts: list, source_lang: Optional[str] = None) -> list:
        """
        Translate multiple texts to English
        
        Args:
            texts: List of texts to translate
            source_lang: Source language code (optional)
        
        Returns:
            List of translation results
        """
        results = []
        for text in texts:
            result = self.translate_to_english(text, source_lang)
            results.append(result)
        return results
    
    def is_supported_language(self, lang_code: str) -> bool:
        """
        Check if language is supported for translation
        
        Args:
            lang_code: Language code (e.g., 'es', 'hi', 'zh-CN')
        
        Returns:
            True if supported, False otherwise
        """
        return lang_code.lower() in self.supported_languages


# Singleton instance
_translation_service = None

def get_translation_service():
    """Get or create translation service singleton"""
    global _translation_service
    if _translation_service is None:
        _translation_service = TranslationService()
    return _translation_service
