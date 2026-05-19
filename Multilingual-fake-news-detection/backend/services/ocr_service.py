"""
OCR Service using Tesseract
Extracts text from images
"""
import pytesseract
from PIL import Image
import cv2
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        # Set Tesseract path for Windows
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        try:
            # Try to get Tesseract version to check if it's installed
            pytesseract.get_tesseract_version()
            self.tesseract_available = True
            logger.debug("Tesseract OCR is available")
        except Exception as e:
            self.tesseract_available = False
            logger.warning(f"Tesseract OCR not available: {str(e)}")
    
    def extract_text(self, image_path: str, preprocess: bool = True) -> dict:
        """
        Extract text from image using OCR
        
        Args:
            image_path: Path to image file
            preprocess: Whether to preprocess image for better OCR results
            
        Returns:
            Dict with extracted text and confidence
        """
        if not self.tesseract_available:
            return {
                'success': False,
                'error': 'Tesseract OCR not installed. Install from: https://github.com/tesseract-ocr/tesseract',
                'text': ''
            }
        
        try:
            # Load image
            image = cv2.imread(image_path)
            
            if image is None:
                return {
                    'success': False,
                    'error': 'Failed to load image',
                    'text': ''
                }
            
            # Preprocess image if requested
            if preprocess:
                image = self._preprocess_image(image)
            
            # Convert to PIL Image
            if len(image.shape) == 3:
                # Convert BGR to RGB
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(image)
            
            # Extract text with OCR - Try multiple languages and PSM modes
            # Support Indian languages: Kannada, Hindi, Tamil, Telugu, Malayalam, English
            # PSM 3: Fully automatic page segmentation (good for memes with mixed layouts)
            # PSM 6: Assume uniform block of text (good for single text blocks)
            # PSM 11: Sparse text (good for text scattered across image)
            
            best_text = ""
            best_confidence = 0
            best_language = "eng"
            
            # Try multiple languages - Indian languages + English
            languages = ['eng', 'kan', 'hin', 'tam', 'tel', 'mal', 'eng+kan', 'eng+hin']
            
            for lang in languages:
                for psm in [3, 6, 11]:
                    try:
                        text = pytesseract.image_to_string(
                            pil_image,
                            lang=lang,
                            config=f'--psm {psm} --oem 3'
                        )
                        
                        # Get confidence for this attempt
                        data = pytesseract.image_to_data(pil_image, lang=lang, config=f'--psm {psm} --oem 3', output_type=pytesseract.Output.DICT)
                        confidences = [int(conf) for conf in data['conf'] if conf != '-1']
                        avg_conf = sum(confidences) / len(confidences) if confidences else 0
                        
                        # Keep the result with best confidence and most text
                        text_clean = text.strip()
                        if text_clean and avg_conf > best_confidence and len(text_clean) > 20:
                            best_text = text_clean
                            best_confidence = avg_conf
                            best_language = lang
                    except Exception as e:
                        # Language pack might not be installed - continue with next
                        logger.debug(f"OCR failed for language {lang}, PSM {psm}: {str(e)}")
                        continue
            
            text = best_text
            avg_confidence = best_confidence
            
            # Clean extracted text
            text = text.strip()
            
            if not text:
                return {
                    'success': False,
                    'error': 'No text detected in image',
                    'text': ''
                }
            
            logger.info(f"✅ OCR extracted {len(text)} chars using {best_language} with {avg_confidence:.1f}% confidence")
            
            return {
                'success': True,
                'text': text,
                'confidence': round(avg_confidence, 2),
                'word_count': len(text.split()),
                'detected_language': best_language
            }
            
        except Exception as e:
            logger.error(f"Error during OCR extraction: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'text': ''
            }
    
    def _preprocess_image(self, image):
        """
        Preprocess image for better OCR results
        Handles colored backgrounds and stylized text common in memes
        
        Args:
            image: OpenCV image (numpy array)
            
        Returns:
            Preprocessed image
        """
        # Scale up image - Tesseract works better on larger text (min 300 DPI)
        height, width = image.shape[:2]
        if height < 1000:
            scale_factor = 1000 / height
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply bilateral filter to preserve edges while smoothing
        smooth = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Aggressive contrast enhancement using CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        contrast = clahe.apply(smooth)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(contrast, h=10)
        
        # Try Otsu's thresholding for better binary conversion
        _, thresh_otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Adaptive thresholding with larger block size for memes
        adaptive_thresh = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            21,  # Increased block size for large text
            10   # Increased constant for better separation
        )
        
        # Check if image has dark background (mean < 127)
        # If so, also try inverted thresholding
        mean_val = np.mean(denoised)
        if mean_val < 127:
            _, thresh_inv = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            candidates = [thresh_otsu, thresh_inv, adaptive_thresh]
        else:
            candidates = [thresh_otsu, adaptive_thresh]
        
        # Choose the binarization with best contrast (highest std dev)
        std_devs = [np.std(img) for img in candidates]
        processed = candidates[np.argmax(std_devs)]
        
        # Morphological operations to clean up and connect text
        kernel = np.ones((2, 2), np.uint8)
        processed = cv2.morphologyEx(processed, cv2.MORPH_CLOSE, kernel)
        processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
        
        return processed
    
    def extract_text_from_multiple_images(self, image_paths: list) -> list:
        """
        Extract text from multiple images
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            List of extraction results
        """
        results = []
        
        for image_path in image_paths:
            result = self.extract_text(image_path)
            results.append({
                'image_path': image_path,
                **result
            })
        
        return results
