# Backend services initialization
from .verification_service import VerificationService
from .ocr_service import OCRService
from .fake_news_service import get_fake_news_service

__all__ = ['VerificationService', 'OCRService', 'get_fake_news_service']
