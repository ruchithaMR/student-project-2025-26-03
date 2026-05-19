"""
Intelligent Fusion Service
Combines ML, rule checks, OpenAI verification, and optional real-time API checks.
Uses weighted voting and confidence calibration for final decisions.
"""
import logging
from typing import Dict, List
from enum import Enum

logger = logging.getLogger(__name__)


class EvidenceType(Enum):
    """Types of evidence from verification layers"""
    ML_MODEL = "ml_model"
    KNOWLEDGE_FACT = "knowledge_fact"
    KNOWLEDGE_RED_FLAG = "knowledge_red_flag"
    REALTIME_API = "realtime_api"
    OPENAI_LLM = "openai_llm"
    SOURCE_CREDIBILITY = "source_credibility"


class EvidenceWeight:
    """Weights for different types of evidence"""
    # High severity violations override everything
    KNOWLEDGE_HIGH_SEVERITY = 1.0
    REALTIME_API_VERIFIED = 0.9    # Strong evidence from APIs
    ML_HIGH_CONFIDENCE = 0.7       # Local classifier baseline signal
    ML_MEDIUM_CONFIDENCE = 0.55
    ML_LOW_CONFIDENCE = 0.4
    OPENAI_HIGH_CONFIDENCE = 0.75  # High-confidence multilingual LLM judgment
    KNOWLEDGE_MEDIUM_SEVERITY = 0.7  # Significant but not definitive
    OPENAI_MEDIUM_CONFIDENCE = 0.55
    SOURCE_UNRELIABLE = 0.5        # Known unreliable source
    OPENAI_LOW_CONFIDENCE = 0.35
    KNOWLEDGE_RED_FLAG = 0.45      # Conspiracy/manipulation cues without hard impossibility
    KNOWLEDGE_LOW_SEVERITY = 0.3   # Advisory only


class FusionService:
    """
    Intelligent service that combines multiple verification layers
    Uses Bayesian-inspired weighting and threshold logic
    """
    
    def __init__(self):
        self.confidence_thresholds = {
            'definite_fake': 85,
            'likely_fake': 65,
            'suspicious': 45,
            'uncertain': 30,
            'likely_real': 15,
            'definite_real': 5
        }
        
    def fuse_predictions(
        self,
        knowledge_result: Dict,
        ml_result: Dict = None,
        api_verification: Dict = None,
        openai_result: Dict = None,
        source_credibility: Dict = None,
        news_verification: Dict = None
    ) -> Dict:
        """
        Combine all verification layers into final prediction
        
        Args:
            knowledge_result: Knowledge base verification results
            ml_result: Local ML prediction result (optional)
            api_verification: Real-time API verification (optional)
            openai_result: OpenAI multilingual verification results (optional)
            source_credibility: Source credibility check (optional)
            
        Returns:
            Dict with fused prediction, confidence, and explanation
        """
        try:
            # Collect all evidence
            evidence = self._collect_evidence(
                knowledge_result, ml_result, api_verification, openai_result,
                source_credibility, news_verification
            )
            
            # Calculate weighted confidence scores
            fake_score = 0.0
            real_score = 0.0
            
            for item in evidence:
                if item['conclusion'] == 'fake':
                    fake_score += item['weight'] * item['confidence']
                elif item['conclusion'] == 'real':
                    real_score += item['weight'] * item['confidence']
            
            # Normalize scores
            total_weight = sum(item['weight'] for item in evidence)
            if total_weight > 0:
                fake_score = (fake_score / total_weight) * 100
                real_score = (real_score / total_weight) * 100
            
            # Determine final prediction
            final_prediction = 'FAKE' if fake_score > real_score else 'REAL'
            final_confidence = max(fake_score, real_score)
            
            # Check for high-priority overrides
            override_info = self._check_overrides(evidence)
            if override_info['should_override']:
                final_prediction = override_info['prediction']
                final_confidence = override_info['confidence']
            
            # Generate assessment level
            assessment = self._assess_confidence(final_confidence, final_prediction)
            
            # Build explanation
            explanation = self._build_explanation(
                evidence, final_prediction, final_confidence, override_info
            )
            
            return {
                'prediction': final_prediction,
                'confidence': round(final_confidence, 1),
                'assessment': assessment,
                'fake_score': round(fake_score, 1),
                'real_score': round(real_score, 1),
                'evidence_count': len(evidence),
                'override_applied': override_info['should_override'],
                'explanation': explanation,
                'evidence_summary': self._summarize_evidence(evidence)
            }
            
        except Exception as e:
            logger.error(f"Error in fusion service: {str(e)}")
            # Generic fallback
            return {
                'prediction': 'UNKNOWN',
                'confidence': 50,
                'assessment': 'uncertain',
                'error': str(e)
            }
    
    def _collect_evidence(
        self,
        knowledge_result: Dict,
        ml_result: Dict,
        api_verification: Dict,
        openai_result: Dict,
        source_credibility: Dict,
        news_verification: Dict = None
    ) -> List[Dict]:
        """Collect and weight evidence from all sources"""
        evidence = []

        # 0. Local ML prediction
        if ml_result and ml_result.get('prediction'):
            ml_prediction = str(ml_result.get('prediction', 'REAL')).upper()
            ml_conf = float(ml_result.get('confidence', 0))
            if ml_conf > 1:
                ml_conf = ml_conf / 100.0
            ml_conf = max(0.0, min(1.0, ml_conf))

            if ml_conf >= 0.85:
                ml_weight = EvidenceWeight.ML_HIGH_CONFIDENCE
            elif ml_conf >= 0.70:
                ml_weight = EvidenceWeight.ML_MEDIUM_CONFIDENCE
            else:
                ml_weight = EvidenceWeight.ML_LOW_CONFIDENCE

            evidence.append({
                'type': EvidenceType.ML_MODEL,
                'conclusion': 'fake' if ml_prediction == 'FAKE' else 'real',
                'confidence': ml_conf,
                'weight': ml_weight,
                'details': f"Local ML Check: {ml_prediction} ({ml_conf * 100:.1f}%)"
            })

        # 1. Knowledge Base Verification
        if knowledge_result and (knowledge_result.get('verified') or knowledge_result.get('verified_by_knowledge')):
            impossible_claims = knowledge_result.get('impossible_claims', [])
            red_flags = knowledge_result.get('red_flags', [])

            for claim in impossible_claims:
                severity = claim.get('severity', 'low')

                # Weight based on severity
                if severity == 'high':
                    weight = EvidenceWeight.KNOWLEDGE_HIGH_SEVERITY
                    conf = 0.95
                elif severity == 'medium':
                    weight = EvidenceWeight.KNOWLEDGE_MEDIUM_SEVERITY
                    conf = 0.75
                else:
                    weight = EvidenceWeight.KNOWLEDGE_LOW_SEVERITY
                    conf = 0.50

                evidence.append({
                    'type': EvidenceType.KNOWLEDGE_FACT,
                    'conclusion': 'fake',
                    'confidence': conf,
                    'weight': weight,
                    'details': f"Factual Impossibility ({severity}): {claim.get('reason', 'Unknown')[:80]}"
                })

            # Add weaker fake evidence for red-flag patterns even without hard impossibilities.
            for red_flag in red_flags[:3]:
                flag_type = red_flag.get('type', 'unknown')
                evidence.append({
                    'type': EvidenceType.KNOWLEDGE_RED_FLAG,
                    'conclusion': 'fake',
                    'confidence': 0.65,
                    'weight': EvidenceWeight.KNOWLEDGE_RED_FLAG,
                    'details': f"Misinformation Red Flag: {flag_type.replace('_', ' ')}"
                })
        
        # 2. Real-Time API Verification
        if api_verification:
            inconsistencies = api_verification.get('inconsistencies', [])
            
            for inconsistency in inconsistencies:
                evidence.append({
                    'type': EvidenceType.REALTIME_API,
                    'conclusion': 'fake',
                    'confidence': 0.90,
                    'weight': EvidenceWeight.REALTIME_API_VERIFIED,
                    'details': f"Real-Time Verification: {inconsistency.get('issue', 'Data mismatch')[:80]}"
                })

        # 3. OpenAI Multilingual Verification
        if openai_result and openai_result.get('used') and openai_result.get('prediction'):
            llm_prediction = openai_result.get('prediction', 'Real')
            llm_conf = float(openai_result.get('confidence', 50))

            if llm_conf >= 85:
                llm_weight = EvidenceWeight.OPENAI_HIGH_CONFIDENCE
            elif llm_conf >= 70:
                llm_weight = EvidenceWeight.OPENAI_MEDIUM_CONFIDENCE
            else:
                llm_weight = EvidenceWeight.OPENAI_LOW_CONFIDENCE

            evidence.append({
                'type': EvidenceType.OPENAI_LLM,
                'conclusion': 'fake' if str(llm_prediction).lower() == 'fake' else 'real',
                'confidence': llm_conf / 100,
                'weight': llm_weight,
                'details': f"OpenAI Multilingual Check: {llm_prediction} ({llm_conf:.1f}%)"
            })
        
        # 4. Source Credibility
        if source_credibility:
            status = source_credibility.get('status', 'unknown')
            credibility_score = source_credibility.get('credibility_score', 50)
            
            if status == 'satire':
                # Satirical/parody news (The Onion, Babylon Bee, etc.) - intentionally fake
                evidence.append({
                    'type': EvidenceType.SOURCE_CREDIBILITY,
                    'conclusion': 'fake',
                    'confidence': 0.85,
                    'weight': 0.75,  # High weight - satire is intentionally fake
                    'details': f"Source: {source_credibility.get('message', 'Satirical/parody site')}"
                })
            elif status == 'unreliable':
                evidence.append({
                    'type': EvidenceType.SOURCE_CREDIBILITY,
                    'conclusion': 'fake',
                    'confidence': 0.70,
                    'weight': EvidenceWeight.SOURCE_UNRELIABLE,
                    'details': f"Source: {source_credibility.get('message', 'Unreliable source')}"
                })
            elif status == 'trusted':
                evidence.append({
                    'type': EvidenceType.SOURCE_CREDIBILITY,
                    'conclusion': 'real',
                    'confidence': min(0.92, credibility_score / 100),  # Scale credibility score to 0-1
                    'weight': 0.85,
                    'details': f"Source: {source_credibility.get('message', 'Trusted source')}"
                })

        # 5. News Cross-Check (NewsAPI result)
        # If claim looks like a financial/crypto/major event AND no trusted source found, flag suspicious.
        if news_verification and news_verification.get('newsapi_enabled'):
            found = news_verification.get('found_in_trusted_sources', False)
            trusted_count = news_verification.get('trusted_sources_count', 0)
            total_articles = news_verification.get('total_articles_found', 0)
            headline = (news_verification.get('headline') or '').lower()
            # Only push fake evidence when the claim makes a concrete verifiable real-world assertion
            financial_keywords = ['bitcoin', 'btc', 'ethereum', 'crypto', 'stock', 'crash', 'exchange',
                                   'dollar', 'economy', 'market', 'gdp', 'president', 'government',
                                   'election', 'war', 'attack', 'killed', 'died', 'died', 'arrested']
            is_verifiable_claim = any(kw in headline for kw in financial_keywords)
            if is_verifiable_claim and not found and total_articles == 0:
                evidence.append({
                    'type': EvidenceType.KNOWLEDGE_RED_FLAG,
                    'conclusion': 'fake',
                    'confidence': 0.60,
                    'weight': 0.40,
                    'details': 'News Cross-Check: Claim not found in any trusted news source (potential fabrication)'
                })

        return evidence
    
    def _check_overrides(self, evidence: List[Dict]) -> Dict:
        """
        Check if high-priority evidence should force an override
        
        Returns:
            Dict with override decision and reasoning
        """
        # Check for high-severity knowledge violations
        high_severity_knowledge = [
            e for e in evidence
            if e['type'] == EvidenceType.KNOWLEDGE_FACT and e['weight'] >= 0.9
        ]

        # Check for knowledge red-flag patterns
        knowledge_red_flags = [
            e for e in evidence
            if e['type'] == EvidenceType.KNOWLEDGE_RED_FLAG
        ]

        # Check for API inconsistencies
        api_inconsistencies = [
            e for e in evidence
            if e['type'] == EvidenceType.REALTIME_API
        ]

        if len(high_severity_knowledge) >= 1:
            return {
                'should_override': True,
                'prediction': 'FAKE',
                'confidence': 80,
                'reason': f'High-severity factual impossibilities detected ({len(high_severity_knowledge)})',
                'override_type': 'knowledge_high_severity'
            }

        if len(api_inconsistencies) >= 1:
            avg_conf = sum(e['confidence'] for e in api_inconsistencies) / len(api_inconsistencies)
            return {
                'should_override': True,
                'prediction': 'FAKE',
                'confidence': min(avg_conf * 100, 85),
                'reason': f'Real-time data contradicts claims ({len(api_inconsistencies)} inconsistencies)',
                'override_type': 'api_verification'
            }

        if len(knowledge_red_flags) >= 2:
            return {
                'should_override': True,
                'prediction': 'FAKE',
                'confidence': 72,
                'reason': f'Multiple misinformation red flags detected ({len(knowledge_red_flags)})',
                'override_type': 'knowledge_red_flags'
            }

        trusted_source = any(
            e['type'] == EvidenceType.SOURCE_CREDIBILITY and e['conclusion'] == 'real'
            for e in evidence
        )
        satirical_source = any(
            e['type'] == EvidenceType.SOURCE_CREDIBILITY and
            e['conclusion'] == 'fake' and
            (
                'satirical' in e.get('details', '').lower() or
                'parody' in e.get('details', '').lower()
            )
            for e in evidence
        )
        no_knowledge_issues = not any(
            e['type'] == EvidenceType.KNOWLEDGE_FACT
            for e in evidence
        )
        no_api_issues = not any(
            e['type'] == EvidenceType.REALTIME_API
            for e in evidence
        )

        if trusted_source and no_knowledge_issues and no_api_issues and not satirical_source:
            return {
                'should_override': True,
                'prediction': 'REAL',
                'confidence': 88,
                'reason': 'Trusted news source with no factual impossibilities or API contradictions detected',
                'override_type': 'trusted_source_no_red_flags'
            }
        
        return {
            'should_override': False,
            'prediction': 'UNKNOWN',
            'reason': 'No override conditions met'
        }
    
    def _assess_confidence(self, confidence: float, prediction: str) -> str:
        """Convert numeric confidence to human-readable assessment"""
        prediction_normalized = str(prediction).strip().upper()
        if prediction_normalized == 'FAKE':
            if confidence >= self.confidence_thresholds['definite_fake']:
                return 'Definitely Fake'
            elif confidence >= self.confidence_thresholds['likely_fake']:
                return 'Likely Fake'
            elif confidence >= self.confidence_thresholds['suspicious']:
                return 'Suspicious'
            else:
                return 'Uncertain'
        else:  # Real
            if confidence >= 95:
                return 'Definitely Real'
            elif confidence >= 85:
                return 'Likely Real'
            elif confidence >= 70:
                return 'Appears Real'
            else:
                return 'Uncertain'
    
    def _build_explanation(
        self, 
        evidence: List[Dict],
        prediction: str,
        confidence: float,
        override_info: Dict
    ) -> str:
        """Build human-readable explanation of the decision"""
        lines = []
        
        # Overall verdict
        lines.append(f"Final Assessment: {prediction} ({confidence:.1f}% confidence)")
        lines.append("")
        
        # Override notice
        if override_info['should_override']:
            lines.append(f"⚠️ OVERRIDE: {override_info['reason']}")
            lines.append("")
        
        # Evidence breakdown
        lines.append("Evidence Considered:")
        
        # Group by type
        by_type = {}
        for e in evidence:
            type_name = e['type'].value
            if type_name not in by_type:
                by_type[type_name] = []
            by_type[type_name].append(e)
        
        for type_name, items in by_type.items():
            lines.append(f"\n{type_name.upper().replace('_', ' ')}:")
            for item in items:
                icon = '❌' if item['conclusion'] == 'fake' else '✓'
                lines.append(f"  {icon} {item['details']}")
        
        return "\n".join(lines)
    
    def _summarize_evidence(self, evidence: List[Dict]) -> Dict:
        """Create structured summary of evidence"""
        summary = {
            'total_items': len(evidence),
            'fake_indicators': sum(1 for e in evidence if e['conclusion'] == 'fake'),
            'real_indicators': sum(1 for e in evidence if e['conclusion'] == 'real'),
            'high_weight_items': sum(1 for e in evidence if e['weight'] >= 0.7),
            'by_type': {}
        }
        
        # Count by type
        for e in evidence:
            type_name = e['type'].value
            if type_name not in summary['by_type']:
                summary['by_type'][type_name] = {'count': 0, 'avg_weight': 0}
            summary['by_type'][type_name]['count'] += 1
        
        # Calculate average weights
        for type_name in summary['by_type']:
            items = [e for e in evidence if e['type'].value == type_name]
            summary['by_type'][type_name]['avg_weight'] = sum(e['weight'] for e in items) / len(items)
        
        return summary


# Singleton instance
_fusion_service = None

def get_fusion_service() -> FusionService:
    """Get singleton instance of FusionService"""
    global _fusion_service
    if _fusion_service is None:
        _fusion_service = FusionService()
    return _fusion_service
