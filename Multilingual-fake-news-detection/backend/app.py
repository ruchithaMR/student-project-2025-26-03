"""
Main Flask Application for Fake News Detection System
"""
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import os
import json
import re
import tempfile
import warnings
from urllib.parse import urlparse
from datetime import datetime
from pathlib import Path
import logging
import config
import requests
from bs4 import BeautifulSoup

# Hide repetitive tokenizer warning to keep terminal output clean.
warnings.filterwarnings(
    'ignore',
    message=r'.*clean_up_tokenization_spaces.*',
    category=FutureWarning,
)

# Import modules
from services.verification_service import VerificationService
from services.ocr_service import OCRService
from services.explainable_ai import ExplainableAI
from services.fusion_service import FusionService
from services.openai_verification_service import get_openai_verification_service
from services.translation_service import get_translation_service
from services.mongodb_service import get_mongodb_service
from services.cloudinary_service import get_cloudinary_service
from services.fake_news_service import get_fake_news_service
from utils.text_processor import TextProcessor
from utils.url_scraper import URLScraper

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure logging - Clean and readable
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)

# Reduce noise from other loggers
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logging.getLogger('services.translation_service').setLevel(logging.WARNING)
logging.getLogger('services.explainable_ai').setLevel(logging.WARNING)
logging.getLogger('utils.text_processor').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


def _compact_json(payload, max_len=1200):
    """Serialize payload for readable one-line terminal logs."""
    try:
        serialized = json.dumps(payload, ensure_ascii=False, default=str)
    except Exception:
        serialized = str(payload)

    if len(serialized) <= max_len:
        return serialized
    return f"{serialized[:max_len]}... [truncated]"


def _layer_summary(layer_name, payload):
    """Return short, ordered, one-line summaries for layer logs."""
    if not isinstance(payload, dict):
        return _compact_json(payload, max_len=300)

    name = layer_name.lower()

    if 'layer 1' in name:
        return (
            f"flags={len(payload.get('red_flags', []))} | "
            f"impossible={len(payload.get('impossible_claims', []))} | "
            f"knowledge_confidence={payload.get('knowledge_confidence', 0)}"
        )

    if 'layer 2' in name:
        err = payload.get('error')
        err_short = (str(err)[:110] + '...') if err and len(str(err)) > 110 else err
        provider = payload.get('provider', 'n/a')
        model = payload.get('model', 'n/a')
        prediction = payload.get('prediction', 'n/a')
        confidence = payload.get('confidence', 'n/a')
        fallback_from = payload.get('fallback_from')
        fallback_part = f" | fallback_from={fallback_from}" if fallback_from else ''
        return (
            f"used={payload.get('used')} | available={payload.get('available')} | "
            f"provider={provider} | model={model} | "
            f"prediction={prediction} | confidence={confidence} | "
            f"error={err_short if err_short else 'none'}{fallback_part}"
        )

    if 'layer 3' in name:
        return (
            f"verified={payload.get('verified', False)} | "
            f"claims={len(payload.get('claims_found', []))} | "
            f"inconsistencies={len(payload.get('inconsistencies', []))}"
        )

    if 'fusion' in name:
        return (
            f"prediction={payload.get('prediction')} | "
            f"confidence={payload.get('confidence')} | "
            f"assessment={payload.get('assessment')} | "
            f"override={payload.get('override_applied', False)}"
        )

    if 'ml layer' in name or 'ml' == name.strip():
        return (
            f"prediction={payload.get('prediction')} | "
            f"confidence={payload.get('confidence')}"
        )

    return _compact_json(payload, max_len=300)


def log_prediction_layer(endpoint_name, layer_name, payload):
    """Print per-layer analysis output in terminal during prediction."""
    if not getattr(config, 'LAYER_ANALYSIS_LOGS', True):
        return

    # Keep layer logs in explicit sequence per request: [01], [02], [03]...
    if not hasattr(g, 'layer_log_index'):
        g.layer_log_index = 0
    g.layer_log_index += 1

    summary = _layer_summary(layer_name, payload)
    logger.info(f"\n[{endpoint_name}][{g.layer_log_index:02d}] {layer_name}\n{summary}\n")


def fallback_scrape_url_text(url: str) -> dict:
    """Fallback extraction for pages where the main URLScraper cannot find article text."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        for tag in soup(['script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside']):
            tag.decompose()

        title = ''
        if soup.title and soup.title.get_text(strip=True):
            title = soup.title.get_text(strip=True)

        # Prefer article/main paragraphs; fallback to all paragraphs.
        paragraphs = soup.select('article p, main p')
        if not paragraphs:
            paragraphs = soup.find_all('p')

        text = ' '.join(p.get_text(' ', strip=True) for p in paragraphs if p.get_text(strip=True))
        text = re.sub(r'\s+', ' ', text).strip()

        if len(text) < 50:
            return {'success': False, 'error': 'No article content found (fallback extraction)'}

        source = urlparse(url).netloc.replace('www.', '')
        return {
            'success': True,
            'text': text,
            'title': title,
            'author': '',
            'publish_date': '',
            'source': source,
            'url': url,
            'word_count': len(text.split()),
            'scraped_at': datetime.now().isoformat(),
        }
    except Exception as exc:
        return {'success': False, 'error': f'Fallback scrape failed: {exc}'}


def translate_for_analysis(text: str, language: str, context_label: str):
    """Translate non-English text to English for rule/API analysis layers."""
    translated_result = None
    analysis_text = text

    if language and language != 'en':
        logger.info(f"{context_label}: translating {language} content to English for analysis layers")
        translated_result = translation_service.translate_to_english(text, language)

        if translated_result.get('success') and translated_result.get('translation_needed'):
            analysis_text = translated_result['translated_text']
        else:
            logger.warning(f"{context_label}: translation unavailable, using original text for analysis layers")

    return analysis_text, translated_result


def lightweight_claim_red_flags(text):
    """Rule flags layer is permanently disabled; returns neutral knowledge result."""
    return {
        'verified_by_knowledge': False,
        'is_fake_by_knowledge': False,
        'knowledge_confidence': 0,
        'impossible_claims': [],
        'red_flags': []
    }

# Initialize services
verification_service = VerificationService()
ocr_service = OCRService()
explainable_ai = ExplainableAI()
fusion_service = FusionService()
openai_verification_service = get_openai_verification_service()
translation_service = get_translation_service()
mongodb_service = get_mongodb_service(config.MONGODB_URI)
cloudinary_service = get_cloudinary_service()
fake_news_service = get_fake_news_service()
text_processor = TextProcessor()
url_scraper = URLScraper()

# Helper function to generate tags for predictions
def generate_tags(prediction_type, confidence, is_fake, language, knowledge_flags=0, api_verified=False, impossible_claims=None, text=None):
    """Generate relevant tags for a prediction based on its characteristics"""
    tags = []
    
    # Confidence-based tags
    if confidence >= 90:
        tags.append('Very High Confidence')
    elif confidence >= 80:
        tags.append('High Confidence')
    elif confidence >= 60:
        tags.append('Medium Confidence')
    else:
        tags.append('Low Confidence')
    
    # Prediction type tags
    type_labels = {'text': 'Text Analysis', 'url': 'URL Analysis', 'image': 'Image Analysis'}
    if prediction_type in type_labels:
        tags.append(type_labels[prediction_type])
    
    # Multi-layer detection
    layers_used = 0  # Rule layer disabled
    if knowledge_flags > 0:
        layers_used += 1
    if api_verified:
        layers_used += 1
    
    if layers_used >= 3:
        tags.append('Multi-Layer Detection')
    elif layers_used == 2:
        tags.append('Dual Verification')
    
    # Knowledge base flags
    if knowledge_flags > 0:
        tags.append('Factual Red Flags')
        if impossible_claims:
            # Add specific domain tags based on impossibility patterns
            for claim in impossible_claims[:3]:  # Limit to first 3
                severity = claim.get('severity', 'low')
                if severity == 'high':
                    pattern = claim.get('pattern', '').lower()
                    if 'medical' in pattern or 'cure' in pattern or 'cancer' in pattern:
                        tags.append('Medical Claim')
                    elif 'bitcoin' in pattern or 'crypto' in pattern:
                        tags.append('Cryptocurrency')
                    elif 'stock' in pattern or 'market' in pattern:
                        tags.append('Financial Claim')
                    elif 'temperature' in pattern or 'physics' in pattern:
                        tags.append('Scientific Claim')
    
    # API verification
    if api_verified:
        tags.append('API Verified')
    
    # Content-based tags (if text provided)
    if text:
        text_lower = text.lower()
        if any(term in text_lower for term in ['breaking', 'urgent', 'alert', 'exclusive']):
            tags.append('Breaking News')
        if any(term in text_lower for term in ['government', 'president', 'minister', 'official']):
            tags.append('Political')
        if any(term in text_lower for term in ['covid', 'virus', 'vaccine', 'pandemic']):
            tags.append('Health')
    
    # Language tag (if not English)
    if language and language.upper() != 'EN':
        tags.append(f'Multilingual ({language.upper()})')
    
    # Risk level
    if is_fake:
        if confidence >= 85:
            tags.append('High Risk')
        elif confidence >= 65:
            tags.append('Medium Risk')
    
    return tags[:6]  # Limit to 6 most relevant tags

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Clean request logging
@app.before_request
def log_request():
    # Skip logging for health checks and static files
    if request.path == '/api/health':
        return

    # Reset ordered layer logging index for each incoming request.
    g.layer_log_index = 0
    logger.info(f"\n→ {request.method} {request.path}")

@app.after_request
def log_response(response):
    # Skip logging for health checks
    if request.path == '/api/health':
        return response
    
    # Show clean status
    status_emoji = "✅" if response.status_code < 400 else "❌"
    logger.info(f"{status_emoji} {response.status_code} {request.path}")
    return response

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with service status"""
    # Check MongoDB status
    mongodb_status = 'connected' if mongodb_service and mongodb_service.connected else 'disconnected'
    
    # Check Cloudinary status
    cloudinary_status = 'configured' if cloudinary_service and cloudinary_service.configured else 'not configured'
    openai_status = 'configured' if openai_verification_service and openai_verification_service.configured else 'not configured'
    
    # Get pipeline info
    pipeline_info = {
        'type': 'Rule + OpenAI + API Fusion',
        'local_ml_model': bool(fake_news_service and fake_news_service.available)
    }
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'pipeline': pipeline_info,
            'mongodb': mongodb_status,
            'cloudinary': cloudinary_status,
            'openai': openai_status,
            'ocr': 'available' if ocr_service.tesseract_available else 'unavailable'
        }
    })

@app.route('/api/predict-text', methods=['POST'])
def predict_text():
    """
    Predict whether text is fake or real news
    
    Request body:
    {
        "text": "news content here",
        "verify_claims": true  # optional
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text'].strip()
        user_email = (data.get('user_email') or '').strip().lower()
        
        # Validate input
        if len(text) < 10:
            return jsonify({'error': 'Text too short (minimum 10 characters)'}), 400
        
        if len(text) > 5000:
            return jsonify({'error': 'Text too long (maximum 5000 characters)'}), 400
        
        # Detect language
        language = text_processor.detect_language(text)

        # ML model layer (loaded once at startup)
        ml_prediction = None
        if fake_news_service and fake_news_service.available:
            try:
                ml_prediction = fake_news_service.predict_text(text)
                log_prediction_layer('predict-text', 'ML Layer', ml_prediction)
            except Exception as ml_error:
                logger.warning(f"ML prediction failed in /api/predict-text: {ml_error}")
        
        # Rule flags layer is disabled for this flow; preserve neutral structure for compatibility.
        knowledge_result = lightweight_claim_red_flags(text)

        # LAYER 2: OpenAI multilingual verification
        openai_verification = openai_verification_service.verify_content(
            text=text,
            content_type='text',
            language=language
        )
        log_prediction_layer('predict-text', 'LAYER 2 - LLM', openai_verification)

        # Fusion: compare ML and LLM evidence to finalize the text result.
        fused_result = fusion_service.fuse_predictions(
            knowledge_result=knowledge_result,
            ml_result=ml_prediction or {},
            api_verification={},
            openai_result=openai_verification,
            source_credibility={},
            news_verification={}
        )
        log_prediction_layer('predict-text', 'FUSION', fused_result)
        
        # Generate enhanced AI explanation
        explanation = explainable_ai.explain_prediction(
            text=text,
            prediction=fused_result['prediction'],
            confidence=fused_result['confidence'],
            probabilities={},
            knowledge_verification=knowledge_result
        )
        
        # Determine risk level from prediction and confidence
        # For FAKE news: high confidence = high risk (dangerous misinformation)
        # For REAL news: high confidence = low risk (safe to trust)
        is_fake = fused_result['prediction'] == 'FAKE'
        if is_fake:
            # Fake news: higher confidence = higher risk
            if fused_result['confidence'] >= 85:
                risk_level = 'High'
            elif fused_result['confidence'] >= 65:
                risk_level = 'Medium'
            else:
                risk_level = 'Low'
        else:
            # Real news: higher confidence = lower risk
            if fused_result['confidence'] >= 85:
                risk_level = 'Low'
            elif fused_result['confidence'] >= 65:
                risk_level = 'Medium'
            else:
                risk_level = 'High'
        
        # Build comprehensive response
        response = {
            # Primary results
            'prediction': fused_result['prediction'],
            'confidence': fused_result['confidence'],
            'risk_level': risk_level,
            'assessment': fused_result['assessment'],  # 'Definitely Fake', 'Likely Fake', etc.
            
            # Layer breakdowns
            'knowledge_layer': {
                'is_fake': knowledge_result.get('is_fake_by_knowledge', False),
                'confidence': knowledge_result.get('knowledge_confidence', 0),
                'impossible_claims': knowledge_result.get('impossible_claims', []),
                'red_flags': knowledge_result.get('red_flags', [])
            },
            'openai_layer': openai_verification,
            'ml_prediction': ml_prediction,
            
            # Fusion results
            'fusion_analysis': {
                'fake_score': fused_result.get('fake_score', 0),
                'real_score': fused_result.get('real_score', 0),
                'evidence_count': fused_result.get('evidence_count', 0),
                'override_applied': fused_result.get('override_applied', False)
            },
            
            # Explanations
            'explanation': explanation,
            'fusion_explanation': fused_result.get('explanation', ''),
            'evidence_summary': fused_result.get('evidence_summary', {}),
            
            # Metadata
            'language': language,
            'timestamp': datetime.now().isoformat(),
            'system_version': '3-Layer Hybrid Intelligence v2.0'
        }
        
        response['translation'] = {
            'translation_used_for_ml': bool(language and language != 'en'),
            'language': language
        }
        
        # Save prediction to MongoDB
        try:
            tags = generate_tags(
                prediction_type='text',
                confidence=fused_result['confidence'],
                is_fake=fused_result['prediction'] == 'FAKE',
                language=language,
                knowledge_flags=len(knowledge_result.get('impossible_claims', [])),
                api_verified=False,
                impossible_claims=knowledge_result.get('impossible_claims', []),
                text=text
            )
            mongodb_service.save_prediction({
                'user_email': user_email,
                'prediction_type': 'text',
                'text': text[:500],  # Store first 500 chars
                'prediction': fused_result['prediction'],
                'confidence': fused_result['confidence'],
                'is_fake': fused_result['prediction'] == 'FAKE',
                'language': language,
                'ml_confidence': round(((ml_prediction or {}).get('confidence', 0) * 100) if ((ml_prediction or {}).get('confidence', 0) <= 1) else (ml_prediction or {}).get('confidence', 0), 1),
                'openai_layer': {
                    'used': bool((openai_verification or {}).get('used')),
                    'provider': (openai_verification or {}).get('provider'),
                    'model': (openai_verification or {}).get('model'),
                    'prediction': (openai_verification or {}).get('prediction'),
                    'confidence': (openai_verification or {}).get('confidence'),
                    'reasoning': str((openai_verification or {}).get('reasoning', ''))[:400],
                    'fallback_from': (openai_verification or {}).get('fallback_from'),
                    'error': (openai_verification or {}).get('error')
                },
                'knowledge_flags': len(knowledge_result.get('impossible_claims', [])),
                'api_verified': False,
                'tags': tags
            })
        except Exception as db_error:
            logger.warning(f"Failed to save prediction to database: {db_error}")
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error in predict_text: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml-predict', methods=['POST'])
def ml_predict():
    """
    Direct ML model prediction endpoint.

    Request body:
    {
        "text": "news article text"
    }

    Response:
    {
        "prediction": "FAKE",
        "confidence": 0.89
    }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400

        text = data['text'].strip()
        if len(text) < 10:
            return jsonify({'error': 'Text too short (minimum 10 characters)'}), 400

        if not fake_news_service or not fake_news_service.available:
            return jsonify({'error': 'ML model not available'}), 503

        result = fake_news_service.predict_text(text)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in ml_predict: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml-predict-image', methods=['POST'])
def ml_predict_image():
    """
    Direct ML prediction from an uploaded image using OCR.

    Request: multipart/form-data with file field "image"

    Response:
    {
        "prediction": "FAKE",
        "confidence": 0.89,
        "extracted_text": "..."
    }
    """
    temp_path = None
    try:
        if not fake_news_service or not fake_news_service.available:
            return jsonify({'error': 'ML model not available'}), 503

        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']
        if not image_file or image_file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400

        image_filename = image_file.filename or 'upload.png'
        _, ext = os.path.splitext(image_filename)
        suffix = ext if ext else '.png'

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            image_file.save(temp_file.name)
            temp_path = temp_file.name

        result = fake_news_service.predict_image(temp_path)
        return jsonify(result)

    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 400
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in ml_predict_image: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.route('/api/ml-predict-url', methods=['POST'])
def ml_predict_url():
    """
    Direct ML prediction from an article URL.

    Request body:
    {
        "url": "https://news-site.com/article"
    }

    Response:
    {
        "prediction": "FAKE",
        "confidence": 0.89,
        "article_text_length": 1234
    }
    """
    try:
        if not fake_news_service or not fake_news_service.available:
            return jsonify({'error': 'ML model not available'}), 503

        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400

        url = str(data['url']).strip()
        result = fake_news_service.predict_url(url)
        return jsonify(result)

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in ml_predict_url: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-url', methods=['POST'])
def predict_url():
    """
    Scrape URL and predict if content is fake or real news
    
    Request body:
    {
        "url": "https://example.com/news-article",
        "verify_claims": true  # optional
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400
        
        url = data['url'].strip()
        user_email = (data.get('user_email') or '').strip().lower()
        
        # Validate URL
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Scrape article content
        scrape_result = url_scraper.scrape(url)

        # Robust fallback for sites where the primary extractor misses article text.
        if not scrape_result['success'] or not str(scrape_result.get('text', '')).strip():
            fallback_result = fallback_scrape_url_text(url)
            if fallback_result.get('success'):
                scrape_result = fallback_result
            else:
                primary_error = scrape_result.get('error', 'Unknown scrape error')
                fallback_error = fallback_result.get('error', 'Fallback failed')
                return jsonify({'error': f'{primary_error}; {fallback_error}'}), 400
        
        article_text = scrape_result['text']
        
        # Detect language
        language = text_processor.detect_language(article_text)

        # Layer 1: local ML model. Non-English content is translated inside the ML service.
        ml_prediction = None
        if fake_news_service and fake_news_service.available:
            try:
                ml_prediction = fake_news_service.predict_text(article_text)
                log_prediction_layer('predict-url', 'ML Layer', ml_prediction)
            except Exception as ml_error:
                logger.warning(f"ML prediction failed in /api/predict-url: {ml_error}")
        
        # Rule flags layer is disabled for this flow; preserve neutral structure for compatibility.
        knowledge_result = lightweight_claim_red_flags(article_text)

        # Layer 2: OpenAI gets the original user URL input.
        openai_verification = openai_verification_service.verify_content(
            text=url,
            content_type='url',
            language=language,
            source_url=url
        )
        log_prediction_layer('predict-url', 'LAYER 2 - LLM', openai_verification)
        
        # Fusion: compare ML and OpenAI evidence to finalize the URL result.
        fused_result = fusion_service.fuse_predictions(
            knowledge_result=knowledge_result,
            ml_result=ml_prediction or {},
            api_verification={},
            openai_result=openai_verification,
            source_credibility={},
            news_verification={}
        )

        log_prediction_layer('predict-url', 'FUSION', fused_result)
        
        # Generate enhanced AI explanation
        explanation = explainable_ai.explain_prediction(
            text=article_text,
            prediction=fused_result['prediction'],
            confidence=fused_result['confidence'],
            probabilities={},
            knowledge_verification=knowledge_result
        )
        
        # Determine risk level
        is_fake = fused_result['prediction'] == 'FAKE'
        if is_fake:
            if fused_result['confidence'] >= 85:
                risk_level = 'High'
            elif fused_result['confidence'] >= 65:
                risk_level = 'Medium'
            else:
                risk_level = 'Low'
        else:
            if fused_result['confidence'] >= 85:
                risk_level = 'Low'
            elif fused_result['confidence'] >= 65:
                risk_level = 'Medium'
            else:
                risk_level = 'High'
        
        response = {
            'prediction': fused_result['prediction'],
            'confidence': fused_result['confidence'],
            'risk_level': risk_level,
            'assessment': fused_result.get('assessment', ''),
            'ml_prediction': ml_prediction,
            'language': language,
            'url': url,
            'title': scrape_result.get('title', ''),
            'author': scrape_result.get('author', ''),
            'publish_date': scrape_result.get('publish_date', ''),
            'source': scrape_result.get('source', ''),
            'explanation': explanation,
            'fusion_explanation': fused_result.get('explanation', ''),
            # Layer breakdowns
            'knowledge_layer': {
                'is_fake': knowledge_result.get('is_fake_by_knowledge', False),
                'confidence': knowledge_result.get('knowledge_confidence', 0),
                'impossible_claims': knowledge_result.get('impossible_claims', []),
                'red_flags': knowledge_result.get('red_flags', [])
            },
            'openai_layer': openai_verification,
            'fusion_analysis': {
                'fake_score': fused_result.get('fake_score', 0),
                'real_score': fused_result.get('real_score', 0),
                'evidence_count': fused_result.get('evidence_count', 0)
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Save prediction to MongoDB
        try:
            tags = generate_tags(
                prediction_type='url',
                confidence=fused_result['confidence'],
                is_fake=fused_result['prediction'] == 'FAKE',
                language=language,
                knowledge_flags=len(knowledge_result.get('impossible_claims', [])),
                api_verified=False,
                impossible_claims=knowledge_result.get('impossible_claims', []),
                text=article_text
            )
            mongodb_service.save_prediction({
                'user_email': user_email,
                'prediction_type': 'url',
                'url': url,
                'title': scrape_result.get('title', '')[:200],
                'text': article_text[:500],
                'prediction': fused_result['prediction'],
                'confidence': fused_result['confidence'],
                'is_fake': fused_result['prediction'] == 'FAKE',
                'risk_level': risk_level,
                'language': language,
                'source': scrape_result.get('source', ''),
                'ml_confidence': round(((ml_prediction or {}).get('confidence', 0) * 100) if ((ml_prediction or {}).get('confidence', 0) <= 1) else (ml_prediction or {}).get('confidence', 0), 1),
                'openai_layer': {
                    'used': bool((openai_verification or {}).get('used')),
                    'provider': (openai_verification or {}).get('provider'),
                    'model': (openai_verification or {}).get('model'),
                    'prediction': (openai_verification or {}).get('prediction'),
                    'confidence': (openai_verification or {}).get('confidence'),
                    'reasoning': str((openai_verification or {}).get('reasoning', ''))[:400],
                    'fallback_from': (openai_verification or {}).get('fallback_from'),
                    'error': (openai_verification or {}).get('error')
                },
                'knowledge_flags': len(knowledge_result.get('impossible_claims', [])),
                'api_verified': False,
                'tags': tags
            })
        except Exception as db_error:
            logger.warning(f"Failed to save URL prediction to database: {db_error}")
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error in predict_url: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-image', methods=['POST'])
def predict_image():
    """
    Extract text from uploaded image using OCR and predict with fusion system
    
    Request: multipart/form-data with 'image' file
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        user_email = (request.form.get('user_email') or '').strip().lower()
        
        file_name = file.filename or ''

        if file_name == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
        file_ext = file_name.rsplit('.', 1)[1].lower() if '.' in file_name else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, bmp, tiff'}), 400
        
        # Save uploaded file temporarily
        filename = f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file_name}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Extract text using multi-language OCR
            ocr_result = ocr_service.extract_text(filepath)
            
            if not ocr_result['success']:
                return jsonify({'error': ocr_result['error']}), 400
            
            extracted_text = ocr_result['text']
            
            if len(extracted_text) < 10:
                return jsonify({'error': 'Not enough text extracted from image. Try a clearer image or type the text manually.'}), 400
            
            # Detect language from extracted text
            language = text_processor.detect_language(extracted_text)

            # Direct ML model layer (separate from API verification layer)
            ml_prediction = None
            if fake_news_service and fake_news_service.available:
                try:
                    ml_prediction = fake_news_service.predict_text(extracted_text)
                    log_prediction_layer('predict-image', 'ML Layer', ml_prediction)
                except Exception as ml_error:
                    logger.warning(f"ML prediction failed in /api/predict-image: {ml_error}")
            
            # Rule flags layer is disabled for this flow; preserve neutral structure for compatibility.
            knowledge_result = lightweight_claim_red_flags(extracted_text)

            # LAYER 2: OpenAI multilingual verification
            openai_verification = openai_verification_service.verify_image_content(
                image_path=filepath,
                extracted_text=extracted_text,
                language=language
            )
            log_prediction_layer('predict-image', 'LAYER 2 - LLM', openai_verification)

            # Fusion: compare ML and LLM evidence to finalize the image result.
            fused_result = fusion_service.fuse_predictions(
                knowledge_result=knowledge_result,
                ml_result=ml_prediction or {},
                api_verification={},
                openai_result=openai_verification,
                source_credibility={},
                news_verification={}
            )
            log_prediction_layer('predict-image', 'FUSION', fused_result)
            
            # Generate enhanced AI explanation
            explanation = explainable_ai.explain_prediction(
                text=extracted_text,
                prediction=fused_result['prediction'],
                confidence=fused_result['confidence'],
                probabilities={},
                knowledge_verification=knowledge_result
            )
            
            # Determine risk level
            is_fake = fused_result['prediction'] == 'FAKE'
            if is_fake:
                if fused_result['confidence'] >= 85:
                    risk_level = 'High'
                elif fused_result['confidence'] >= 65:
                    risk_level = 'Medium'
                else:
                    risk_level = 'Low'
            else:
                if fused_result['confidence'] >= 85:
                    risk_level = 'Low'
                elif fused_result['confidence'] >= 65:
                    risk_level = 'Medium'
                else:
                    risk_level = 'High'
            
            # Upload image to Cloudinary
            cloudinary_url = None
            logger.info(f"📤 Uploading image to Cloudinary: {filename}")
            cloudinary_result = cloudinary_service.upload_image(filepath, folder="fake_news_detection/images")
            if cloudinary_result and cloudinary_result.get('success'):
                cloudinary_url = cloudinary_result.get('url')
                logger.info(f"✅ Image uploaded to Cloudinary: {cloudinary_url}")
            elif cloudinary_result and cloudinary_result.get('skipped'):
                logger.warning(
                    "⚠️ Cloudinary upload skipped (%s)",
                    cloudinary_result.get('reason', 'unknown')
                )
            else:
                logger.warning(f"⚠️ Failed to upload image to Cloudinary")
            
            response = {
                'prediction': fused_result['prediction'],
                'confidence': fused_result['confidence'],
                'risk_level': risk_level,
                'assessment': fused_result.get('assessment', ''),
                'ml_prediction': ml_prediction,
                'language': language,
                'extracted_text': extracted_text,
                'ocr_confidence': ocr_result.get('confidence', None),
                'ocr_language': ocr_result.get('detected_language', 'eng'),
                'image_url': cloudinary_url,
                'explanation': explanation,
                'fusion_explanation': fused_result.get('explanation', ''),
                'override_applied': fused_result.get('override_applied', False),
                # Layer breakdowns
                'knowledge_layer': {
                    'is_fake': knowledge_result.get('is_fake_by_knowledge', False),
                    'confidence': knowledge_result.get('knowledge_confidence', 0),
                    'impossible_claims': knowledge_result.get('impossible_claims', []),
                    'red_flags': knowledge_result.get('red_flags', [])
                },
                'openai_layer': openai_verification,
                'fusion_analysis': {
                    'fake_score': fused_result.get('fake_score', 0),
                    'real_score': fused_result.get('real_score', 0),
                    'evidence_count': fused_result.get('evidence_count', 0),
                    'override_applied': fused_result.get('override_applied', False)
                },
                'timestamp': datetime.now().isoformat()
            }
            
            # Save prediction to MongoDB
            try:
                logger.info(f"💾 Saving image prediction to MongoDB...")
                tags = generate_tags(
                    prediction_type='image',
                    confidence=fused_result['confidence'],
                    is_fake=fused_result['prediction'] == 'FAKE',
                    language=language,
                    knowledge_flags=len(knowledge_result.get('impossible_claims', [])),
                    api_verified=False,
                    impossible_claims=knowledge_result.get('impossible_claims', []),
                    text=extracted_text
                )
                save_data = {
                    'user_email': user_email,
                    'prediction_type': 'image',
                    'extracted_text': extracted_text[:500],
                    'prediction': fused_result['prediction'],
                    'confidence': fused_result['confidence'],
                    'is_fake': fused_result['prediction'] == 'FAKE',
                    'risk_level': risk_level,
                    'language': language,
                    'image_url': cloudinary_url,
                    'ocr_confidence': ocr_result.get('confidence'),
                    'ocr_language': ocr_result.get('detected_language', 'eng'),
                    'ml_confidence': round(((ml_prediction or {}).get('confidence', 0) * 100) if ((ml_prediction or {}).get('confidence', 0) <= 1) else (ml_prediction or {}).get('confidence', 0), 1),
                    'openai_layer': {
                        'used': bool((openai_verification or {}).get('used')),
                        'provider': (openai_verification or {}).get('provider'),
                        'model': (openai_verification or {}).get('model'),
                        'prediction': (openai_verification or {}).get('prediction'),
                        'confidence': (openai_verification or {}).get('confidence'),
                        'reasoning': str((openai_verification or {}).get('reasoning', ''))[:400],
                        'fallback_from': (openai_verification or {}).get('fallback_from'),
                        'error': (openai_verification or {}).get('error')
                    },
                    'knowledge_flags': len(knowledge_result.get('impossible_claims', [])),
                    'api_verified': False,
                    'source_credibility': 0,
                    'override_applied': fused_result.get('override_applied', False),
                    'filename': filename,
                    'timestamp': datetime.now().isoformat(),
                    'tags': tags
                }
                mongodb_service.save_prediction(save_data)
                logger.info(f"✅ Image prediction saved to MongoDB")
            except Exception as db_error:
                logger.error(f"❌ Failed to save image prediction to database: {db_error}")
            
            return jsonify(response)
        
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        logger.error(f"Error in predict_image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-claim', methods=['POST'])
def verify_claim():
    """
    Verify specific financial/crypto claims in real-time
    
    Request body:
    {
        "text": "Bitcoin is trading at $50,000",
        "claim_type": "crypto_price"  # or "financial_stat", "news_event"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text'].strip()
        user_email = (data.get('user_email') or '').strip().lower()
        claim_type = data.get('claim_type', 'auto')
        language = text_processor.detect_language(text)
        text_for_analysis, _ = translate_for_analysis(text, language, 'verify-claim')
        
        # Verify claims and apply lightweight red-flag checks
        verification_result = verification_service.verify_claims(text_for_analysis, claim_type)
        knowledge_result = lightweight_claim_red_flags(text_for_analysis)

        has_api_inconsistency = bool(verification_result.get('inconsistencies'))
        has_rule_flags = bool(knowledge_result.get('is_fake_by_knowledge'))
        prediction_label = 'FAKE' if (has_api_inconsistency or has_rule_flags) else 'REAL'
        prediction_confidence = 82 if (has_api_inconsistency or has_rule_flags) else 68
        
        response = {
            'prediction': prediction_label,
            'confidence': prediction_confidence,
            'knowledge_layer': knowledge_result,
            'verification': verification_result,
            'timestamp': datetime.now().isoformat()
        }
        
        # Save to MongoDB
        try:
            mongodb_service.save_prediction({
                'user_email': user_email,
                'prediction_type': 'claim',
                'text': text[:500],
                'claim_type': claim_type,
                'prediction': prediction_label,
                'confidence': prediction_confidence,
                'is_fake': prediction_label == 'FAKE',
                'verification': verification_result,
                'knowledge_flags': len(knowledge_result.get('impossible_claims', []))
            })
        except Exception as db_error:
            logger.warning(f"Failed to save claim prediction to database: {db_error}")
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error in verify_claim: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/source-credibility', methods=['POST'])
def check_source_credibility():
    """
    Check credibility of a news source
    
    Request body:
    {
        "url": "https://example.com"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400
        
        url = data['url'].strip()
        
        # Check source credibility
        credibility_result = verification_service.check_source_credibility(url)
        
        return jsonify(credibility_result)
    
    except Exception as e:
        logger.error(f"Error in check_source_credibility: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Get prediction history from database
    Query params: limit (default 50), type (text/url/image/claim)
    """
    try:
        limit = int(request.args.get('limit', 50))
        prediction_type = request.args.get('type')
        user_email = (request.args.get('user_email') or '').strip().lower()

        predictions = mongodb_service.get_recent_predictions(
            limit=limit,
            prediction_type=prediction_type,
            user_email=user_email or None,
        )
        
        return jsonify({
            'success': True,
            'count': len(predictions),
            'predictions': predictions
        })
    except Exception as e:
        logger.error(f"History fetch error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """
    Get analytics data
    Query params: days (default 30)
    """
    try:
        days = int(request.args.get('days', 30))
        user_email = (request.args.get('user_email') or '').strip().lower()
        analytics = mongodb_service.get_analytics(days=days, user_email=user_email or None)
        
        return jsonify({
            'success': True,
            'analytics': analytics
        })
    except Exception as e:
        logger.error(f"Analytics fetch error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Get overall database statistics
    """
    try:
        user_email = (request.args.get('user_email') or '').strip().lower()
        stats = mongodb_service.get_stats(user_email=user_email or None)
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        logger.error(f"Stats fetch error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profile', methods=['GET'])
def get_profile():
    """
    Get profile details for the current user.
    """
    try:
        requested_email = (request.args.get('user_email') or '').strip().lower()
        profile_id = requested_email or 'default'

        profile = mongodb_service.get_user_profile(profile_id=profile_id)
        return jsonify({
            'success': True,
            'profile': profile
        })
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/profile', methods=['POST'])
def save_profile():
    """
    Save profile details for the current user.
    """
    try:
        data = request.get_json() or {}
        requested_email = (data.get('user_email') or '').strip().lower()
        profile_id = requested_email or 'default'

        profile_payload = {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'organization': data.get('organization', ''),
            'role': data.get('role', ''),
            'bio': data.get('bio', ''),
        }

        saved = mongodb_service.save_user_profile(profile_payload, profile_id=profile_id)
        if not saved:
            return jsonify({'error': 'Failed to save profile'}), 500

        profile = mongodb_service.get_user_profile(profile_id=profile_id)
        return jsonify({
            'success': True,
            'message': 'Profile saved successfully',
            'profile': profile,
        })
    except Exception as e:
        logger.error(f"Profile save error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/change-password', methods=['POST'])
def change_password():
    """
    Change password for the current user and store bcrypt hash in MongoDB.
    """
    try:
        data = request.get_json() or {}
        requested_email = (data.get('user_email') or '').strip().lower()
        current_password = str(data.get('current_password') or '')
        new_password = str(data.get('new_password') or '')

        if not requested_email:
            return jsonify({'error': 'User email is required'}), 400

        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password are required'}), 400

        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters long'}), 400

        result = mongodb_service.change_user_password(
            profile_id=requested_email,
            current_password=current_password,
            new_password=new_password,
        )

        if not result.get('success'):
            return jsonify({'error': result.get('reason', 'Failed to change password')}), 400

        return jsonify({
            'success': True,
            'message': 'Password updated successfully',
        })
    except Exception as e:
        logger.error(f"Password change error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete-account', methods=['POST'])
def delete_account():
    """
    Permanently delete user account profile and user-scoped predictions.
    """
    try:
        data = request.get_json() or {}
        requested_email = (data.get('user_email') or '').strip().lower()

        if not requested_email:
            return jsonify({'error': 'User email is required'}), 400

        result = mongodb_service.delete_user_account(profile_id=requested_email)
        if not result.get('success'):
            return jsonify({'error': result.get('reason', 'Failed to delete account')}), 400

        return jsonify({
            'success': True,
            'message': 'Account deleted successfully',
            'profile_deleted': result.get('profile_deleted', 0),
            'predictions_deleted': result.get('predictions_deleted', 0),
        })
    except Exception as e:
        logger.error(f"Delete account error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/model-metrics', methods=['GET'])
def get_model_metrics():
    """
    Get current ML model metrics from the saved training artifact.
    """
    try:
        metrics_path = Path(__file__).parent / 'model' / 'training_metrics.json'
        if not metrics_path.exists():
            return jsonify({
                'success': False,
                'available': False,
                'error': 'training_metrics.json not found'
            }), 404

        with metrics_path.open('r', encoding='utf-8') as f:
            payload = json.load(f)

        return jsonify({
            'success': True,
            'available': True,
            'source': str(metrics_path),
            'metrics': payload
        })
    except Exception as e:
        logger.error(f"Model metrics fetch error: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large (max 16MB)'}), 413

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Start Flask server (minimize werkzeug output)
    import sys
    cli = sys.modules['flask.cli']
    if hasattr(cli, 'show_server_banner'):
        setattr(cli, 'show_server_banner', lambda *x: None)

    # Keep startup single-run by default (no duplicate init logs from reloader).
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    use_reloader = os.getenv('FLASK_USE_RELOADER', '0') == '1'
    is_reloader_child = os.environ.get('WERKZEUG_RUN_MAIN') == 'true'

    # Print startup banner only once when reloader is enabled.
    if (not use_reloader) or is_reloader_child:
        print("\n" + "="*60)
        print("  FAKE NEWS DETECTION API - Starting Server")
        print("="*60)

        print("💾 MongoDB Atlas:", "✅ Connected" if mongodb_service.connected else "⚠️  Not configured (running without database)")
        print("☁️  Cloudinary:", "✅ Configured" if cloudinary_service.configured else "⚠️  Not configured (images stored locally)")

        print("="*60)
        print("🚀 Server ready at http://localhost:5000")
        print("📡 API endpoint: http://localhost:5000/api")
        print("📊 Health check: http://localhost:5000/api/health")
        print("="*60 + "\n")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=debug_mode,
        use_reloader=use_reloader,
    )
