"""
Cloudinary Service for Image Storage
Uploads images to Cloudinary cloud storage
"""
import logging
import os
import socket
import time
from typing import Dict, Optional
import cloudinary
import cloudinary.uploader
from datetime import datetime

logger = logging.getLogger(__name__)

class CloudinaryService:
    def __init__(self):
        """Initialize Cloudinary with credentials from environment"""
        self.cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        self.api_key = os.getenv('CLOUDINARY_API_KEY')
        self.api_secret = os.getenv('CLOUDINARY_API_SECRET')
        self.upload_enabled = os.getenv('CLOUDINARY_UPLOAD_ENABLED', 'True') == 'True'
        self.dns_backoff_seconds = int(os.getenv('CLOUDINARY_DNS_BACKOFF_SECONDS', 180))
        self._dns_backoff_until = 0.0
        self.configured = False
        
        if self.cloud_name and self.api_key and self.api_secret:
            self._configure()
        else:
            logger.warning("Cloudinary not configured - images will be stored locally")

    @staticmethod
    def _is_host_resolvable(host: str) -> bool:
        try:
            socket.getaddrinfo(host, 443)
            return True
        except OSError:
            return False
    
    def _configure(self):
        """Configure Cloudinary with credentials"""
        try:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True
            )
            self.configured = True
            logger.info("☁️  Cloudinary configured successfully")
        except Exception as e:
            logger.error(f"❌ Cloudinary configuration failed: {e}")
            self.configured = False
    
    def upload_image(self, file_path: str, folder: str = "fake_news_detection") -> Optional[Dict]:
        """
        Upload image to Cloudinary
        
        Args:
            file_path: Local path to the image file
            folder: Cloudinary folder to store the image in
            
        Returns:
            Dictionary with upload result or None if failed
        """
        if not self.configured:
            logger.debug("Cloudinary not configured - skipping upload")
            return None

        if not self.upload_enabled:
            logger.info("Cloudinary upload disabled by CLOUDINARY_UPLOAD_ENABLED")
            return {'success': False, 'skipped': True, 'reason': 'disabled'}

        now = time.time()
        if now < self._dns_backoff_until:
            return {
                'success': False,
                'skipped': True,
                'reason': f'dns_backoff_{int(self._dns_backoff_until - now)}s'
            }

        if not self._is_host_resolvable('api.cloudinary.com'):
            self._dns_backoff_until = now + self.dns_backoff_seconds
            logger.warning(
                "Skipping Cloudinary upload for %ss due to DNS resolution failure for api.cloudinary.com",
                self.dns_backoff_seconds,
            )
            return {
                'success': False,
                'skipped': True,
                'reason': 'dns_unreachable'
            }
        
        try:
            # Generate unique public_id with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.basename(file_path).split('.')[0]
            public_id = f"{folder}/{filename}_{timestamp}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_path,
                public_id=public_id,
                folder=folder,
                resource_type="image",
                overwrite=False,
                transformation=[
                    {'width': 1200, 'height': 1200, 'crop': 'limit'},  # Max size
                    {'quality': 'auto:good'}  # Auto quality optimization
                ]
            )
            
            logger.debug(f"Image uploaded to Cloudinary: {result.get('secure_url')}")
            
            return {
                'success': True,
                'url': result.get('secure_url'),
                'public_id': result.get('public_id'),
                'format': result.get('format'),
                'width': result.get('width'),
                'height': result.get('height'),
                'size': result.get('bytes')
            }
            
        except Exception as e:
            error_message = str(e)
            if 'Failed to resolve' in error_message or 'NameResolutionError' in error_message:
                self._dns_backoff_until = time.time() + self.dns_backoff_seconds
                logger.warning(
                    "Cloudinary DNS failure. Backing off uploads for %ss",
                    self.dns_backoff_seconds,
                )
                return {
                    'success': False,
                    'skipped': True,
                    'reason': 'dns_unreachable'
                }

            logger.error(f"Cloudinary upload failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_image(self, public_id: str) -> bool:
        """
        Delete image from Cloudinary
        
        Args:
            public_id: Cloudinary public ID of the image
            
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.configured:
            return False
        
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            logger.error(f"Failed to delete image from Cloudinary: {e}")
            return False
    
    def get_image_url(self, public_id: str, transformation: Optional[Dict] = None) -> Optional[str]:
        """
        Get Cloudinary URL for an image with optional transformations
        
        Args:
            public_id: Cloudinary public ID
            transformation: Optional transformation parameters
            
        Returns:
            Cloudinary URL or None
        """
        if not self.configured:
            return None
        
        try:
            if transformation:
                return cloudinary.CloudinaryImage(public_id).build_url(**transformation)
            return cloudinary.CloudinaryImage(public_id).build_url()
        except Exception as e:
            logger.error(f"Failed to get Cloudinary URL: {e}")
            return None


# Singleton instance
_cloudinary_service = None

def get_cloudinary_service() -> CloudinaryService:
    """Get or create Cloudinary service instance"""
    global _cloudinary_service
    if _cloudinary_service is None:
        _cloudinary_service = CloudinaryService()
    return _cloudinary_service
