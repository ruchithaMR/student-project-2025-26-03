"""
Content Type Detection Service
Identifies whether content is a meme, satire, news, or other type
"""
import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class ContentTypeDetector:
    """Detect content type to avoid misclassifying memes as fake news"""
    
    def __init__(self):
        # Meme/joke indicators
        self.meme_indicators = [
            # Format patterns
            r'everyone should.*that way',
            r'when you.*when they',
            r'nobody.*me:',
            r'me:.*also me:',
            r'pov:',
            r'be like',
            
            # Common meme phrases
            'that moment when',
            'that feeling when',
            'be like',
            'when you realize',
            'plot twist',
            'am i a joke to you',
            'change my mind',
            'this is fine',
            'you vs',
            'expectation.*reality',
            
            # Humor markers
            'lol',
            'lmao',
            'rofl',
            'haha',
        ]
        
        # Satire indicators
        self.satire_indicators = [
            'the onion',
            'babylon bee',
            'hard times',
            'clickhole',
            'satirical',
            'parody',
            'for entertainment purposes',
        ]
        
        # News indicators
        self.news_indicators = [
            r'\d{4}-\d{2}-\d{2}',  # Date format
            r'\d{1,2}/\d{1,2}/\d{4}',  # Date format
            'reuters',
            'associated press',
            'ap news',
            'breaking news',
            'according to',
            'sources say',
            'official statement',
            'reported that',
            'announced that',
            'confirmed that',
        ]
    
    def detect_content_type(self, text: str, ocr_confidence: float = None) -> Dict:
        """
        Detect the type of content
        
        Args:
            text: Extracted text from image or article
            ocr_confidence: OCR confidence score (if from image)
            
        Returns:
            Dict with content type and confidence
        """
        text_lower = text.lower()
        text_length = len(text.split())
        
        # Initialize scores
        meme_score = 0
        satire_score = 0
        news_score = 0
        
        # Check for meme patterns
        for pattern in self.meme_indicators:
            if re.search(pattern, text_lower):
                meme_score += 1
        
        # Check for satire indicators
        for indicator in self.satire_indicators:
            if indicator in text_lower:
                satire_score += 2
        
        # Check for news indicators
        for indicator in self.news_indicators:
            if isinstance(indicator, str):
                if indicator in text_lower:
                    news_score += 1
            else:  # regex pattern
                if re.search(indicator, text_lower):
                    news_score += 1
        
        # Analyze text structure
        # Memes usually have short, punchy text
        if text_length < 30:
            meme_score += 1
        
        # News articles are usually longer
        if text_length > 100:
            news_score += 1
        
        # Check for all caps (common in memes)
        caps_words = sum(1 for word in text.split() if word.isupper() and len(word) > 2)
        if caps_words >= 3:
            meme_score += 2
        
        # Check for image-based text structure
        # Multiple line breaks or scattered text (common in memes)
        line_breaks = text.count('\n')
        if line_breaks >= 2 and text_length < 50:
            meme_score += 1
        
        # Determine content type
        total_score = meme_score + satire_score + news_score
        
        if total_score == 0:
            # Unknown type - could be general text
            content_type = 'unknown'
            confidence = 0.3
            explanation = "Could not determine clear content type"
        elif meme_score > satire_score and meme_score > news_score:
            content_type = 'meme'
            confidence = min(0.9, 0.5 + (meme_score * 0.1))
            explanation = f"Detected meme/joke format (score: {meme_score})"
        elif satire_score > news_score:
            content_type = 'satire'
            confidence = min(0.9, 0.5 + (satire_score * 0.1))
            explanation = f"Detected satirical content (score: {satire_score})"
        else:
            content_type = 'news'
            confidence = min(0.9, 0.5 + (news_score * 0.1))
            explanation = f"Detected news article format (score: {news_score})"
        
        # Additional checks for humor
        humor_markers = self._detect_humor(text_lower)
        if humor_markers:
            if content_type == 'unknown':
                content_type = 'humor'
                confidence = 0.6
            elif content_type != 'meme' and content_type != 'satire':
                # Might be humorous news or commentary
                pass
        
        return {
            'content_type': content_type,
            'confidence': confidence,
            'explanation': explanation,
            'scores': {
                'meme': meme_score,
                'satire': satire_score,
                'news': news_score
            },
            'is_humorous': content_type in ['meme', 'satire', 'humor'],
            'should_fact_check': content_type == 'news',
            'humor_markers': humor_markers
        }
    
    def _detect_humor(self, text_lower: str) -> List[str]:
        """Detect markers of humorous intent"""
        markers = []
        
        # Obvious joke setups
        joke_patterns = [
            (r'everyone should.*that way.*wont', 'joke_structure'),
            (r'how to.*step \d+:', 'joke_list'),
            (r'when.*but.*', 'joke_contrast'),
            (r'me:.*nobody:', 'meme_dialogue'),
        ]
        
        for pattern, marker_type in joke_patterns:
            if re.search(pattern, text_lower):
                markers.append(marker_type)
        
        # Pun or wordplay indicators
        if 'pun' in text_lower or 'joke' in text_lower:
            markers.append('explicit_humor')
        
        return markers
    
    def should_analyze_as_fake_news(self, content_info: Dict) -> bool:
        """
        Determine if content should be analyzed for fake news
        
        Args:
            content_info: Result from detect_content_type()
            
        Returns:
            True if should analyze, False if it's clearly humor/meme
        """
        content_type = content_info['content_type']
        confidence = content_info['confidence']
        
        # Don't analyze clear memes/satire as fake news
        if content_type in ['meme', 'satire', 'humor'] and confidence > 0.6:
            return False
        
        # Analyze everything else
        return True
    
    def get_appropriate_message(self, content_info: Dict) -> Dict:
        """
        Get appropriate user message based on content type
        
        Args:
            content_info: Result from detect_content_type()
            
        Returns:
            Dict with appropriate assessment and recommendations
        """
        content_type = content_info['content_type']
        
        if content_type == 'meme':
            return {
                'assessment': 'HUMOR/MEME DETECTED',
                'message': 'This appears to be a humorous meme or joke, not a factual news claim.',
                'risk_level': 'Info',
                'recommendations': [
                    'This is entertainment content, not factual news',
                    'Enjoy the humor, but don\'t treat it as a factual claim',
                    'Memes are meant for fun, not to spread misinformation'
                ]
            }
        elif content_type == 'satire':
            return {
                'assessment': 'SATIRE/PARODY DETECTED',
                'message': 'This appears to be satirical or parody content.',
                'risk_level': 'Info',
                'recommendations': [
                    'This is satire or parody, not real news',
                    'Be aware that some may mistake satire for real news',
                    'Consider the source before sharing'
                ]
            }
        else:
            return None
