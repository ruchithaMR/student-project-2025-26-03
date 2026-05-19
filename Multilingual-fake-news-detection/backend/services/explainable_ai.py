"""
Explainable AI Service
Provides detailed explanations for fake news predictions
Uses keyword analysis and linguistic patterns
"""
import re
import logging
from typing import Dict, List, Tuple
import numpy as np

logger = logging.getLogger(__name__)

class ExplainableAI:
    """Generate human-readable explanations for fake news predictions"""
    
    def __init__(self):
        # Keywords that indicate fake news
        self.fake_indicators = {
            'sensational': ['shocking', 'unbelievable', 'miracle', 'secret', 'truth revealed', 'what they dont want you to know'],
            'emotional': ['outrage', 'devastating', 'heartbreaking', 'terrifying', 'amazing', 'incredible'],
            'clickbait': ['you wont believe', 'this one trick', 'doctors hate', 'what happened next', 'will shock you'],
            'conspiracy': ['cover up', 'hidden agenda', 'they dont want', 'wake up', 'sheeple', 'illuminati'],
            'urgency': ['urgent', 'breaking', 'just in', 'last chance', 'act now', 'before its too late'],
            'exaggeration': ['all', 'everyone', 'never' 'always', 'completely', 'totally', 'absolutely destroyed'],
            'health_misinfo': ['cure cancer', 'miracle cure', 'doctors shocked', 'big pharma', 'natural remedy cures'],
            'financial_scams': ['get rich quick', 'earn $$$', 'make money fast', 'guaranteed profit', 'bitcoin millionaire overnight']
        }
        
        # Keywords that indicate real news
        self.real_indicators = {
            'attribution': ['according to', 'sources say', 'official statement', 'spokesperson', 'research shows'],
            'factual_lang': ['reported', 'announced', 'confirmed', 'stated', 'data shows', 'study finds'],
            'neutral_tone': ['however', 'meanwhile', 'additionally', 'furthermore', 'in contrast'],
            'specific_details': ['percentage', 'statistics', 'date', 'location', 'official', 'expert']
        }
        
        # Grammar/structure issues often in fake news
        self.grammar_patterns = {
            'excessive_caps': r'[A-Z]{4,}',  # Multiple capital letters
            'excessive_punct': r'[!?]{2,}',  # Multiple exclamation/question marks
            'poor_spacing': r'\s{3,}',  # Excessive spacing
        }
    
    def explain_prediction(
        self,
        text: str,
        prediction: str,
        confidence: float,
        probabilities: Dict[str, float],
        knowledge_verification: Dict = None
    ) -> Dict:
        """
        Generate comprehensive explanation for a prediction
        
        Args:
            text: Input text that was analyzed
            prediction: Model prediction (Real/Fake)
            confidence: Confidence score (0-100)
            probabilities: Probability distribution
            knowledge_verification: Knowledge-based verification results
            
        Returns:
            Dictionary with detailed explanation
        """
        logger.info(f"Generating explanation for {prediction} prediction...")
        prediction_label = str(prediction or '').strip().upper()
        is_fake_prediction = prediction_label == 'FAKE'
        
        text_lower = text.lower()
        
        # Find indicators
        fake_signals = self._find_indicators(text_lower, self.fake_indicators)
        real_signals = self._find_indicators(text_lower, self.real_indicators)
        grammar_issues = self._check_grammar(text)
        
        # Generate explanation based on prediction
        if is_fake_prediction:
            explanation = self._explain_fake_news(
                text, fake_signals, grammar_issues, confidence, knowledge_verification
            )
        else:
            explanation = self._explain_real_news(
                text, real_signals, fake_signals, confidence, knowledge_verification
            )
        
        # Add key phrases
        key_phrases = self._extract_key_phrases(text, prediction)
        
        # Generate overall assessment (now includes knowledge verification)
        assessment = self._generate_assessment(
            prediction_label, confidence, fake_signals, real_signals, knowledge_verification
        )
        
        return {
            'prediction': prediction_label,
            'confidence': confidence,
            'assessment': assessment,
            'explanation': explanation,
            'key_phrases': key_phrases,
            'indicators': {
                'fake_signals': fake_signals,
                'real_signals': real_signals,
                'grammar_issues': grammar_issues
            },
            'recommendations': self._get_recommendations(prediction_label, confidence, knowledge_verification)
        }
    
    def _find_indicators(self, text: str, indicator_dict: Dict[str, List[str]]) -> Dict[str, List[str]]:
        """Find which indicators are present in text"""
        found = {}
        for category, keywords in indicator_dict.items():
            matches = [kw for kw in keywords if kw in text]
            if matches:
                found[category] = matches
        return found
    
    def _check_grammar(self, text: str) -> List[str]:
        """Check for grammar/structure issues"""
        issues = []
        
        if re.search(self.grammar_patterns['excessive_caps'], text):
            issues.append("Excessive use of capital letters (often used for emphasis in fake news)")
        
        if re.search(self.grammar_patterns['excessive_punct'], text):
            issues.append("Multiple exclamation/question marks (sensationalism indicator)")
        
        if re.search(self.grammar_patterns['poor_spacing'], text):
            issues.append("Inconsistent spacing (poor formatting)")
        
        return issues
    
    def _explain_fake_news(
        self,
        text: str,
        fake_signals: Dict,
        grammar_issues: List[str],
        confidence: float,
        knowledge_verification: Dict = None
    ) -> str:
        """Generate explanation for fake news prediction"""
        parts = []
        
        parts.append(f"This content was classified as **FAKE NEWS** with {confidence:.1f}% confidence.")
        
        # Knowledge verification results (priority)
        if knowledge_verification and knowledge_verification.get('impossible_claims_found', 0) > 0:
            parts.append("\n🚨 **FACTUAL IMPOSSIBILITIES DETECTED:**")
            details = knowledge_verification.get('details', [])
            for claim in details:
                parts.append(f"- **{claim['domain'].title()} Violation**: {claim['reason']}")
            parts.append("\n⚠️ Content contradicts established scientific/factual knowledge.")
        
        if fake_signals:
            parts.append("\n**Style-based fake news indicators:**")
            for category, matches in fake_signals.items():
                cat_name = category.replace('_', ' ').title()
                parts.append(f"- **{cat_name}**: Contains phrases like '{matches[0]}' which are commonly used in misinformation")
        
        if grammar_issues:
            parts.append("\n**Suspicious formatting:**")
            for issue in grammar_issues:
                parts.append(f"- {issue}")
        
        if confidence > 90:
            parts.append("\n⚠️ **HIGH CONFIDENCE**: Multiple strong indicators of fake news detected. Exercise extreme caution.")
        elif confidence > 70:
            parts.append("\n⚠️ **MODERATE CONFIDENCE**: Several fake news patterns detected. Verify from trusted sources.")
        else:
            parts.append("\n⚠️ **LOW CONFIDENCE**: Some concerning elements present but verification recommended.")
        
        return "\n".join(parts)
    
    def _explain_real_news(
        self,
        text: str, 
        real_signals: Dict,
        fake_signals: Dict,
        confidence: float,
        knowledge_verification: Dict = None
    ) -> str:
        """Generate explanation for real news prediction"""
        parts = []
        
        parts.append(f"This content was classified as **REAL NEWS** with {confidence:.1f}% confidence.")
        
        # Knowledge verification warning (even if ML says Real)
        if knowledge_verification and knowledge_verification.get('impossible_claims_found', 0) > 0:
            parts.append("\n⚠️ **KNOWLEDGE VERIFICATION WARNING:**")
            parts.append("While the writing style appears legitimate, factual impossibilities were detected:")
            details = knowledge_verification.get('details', [])
            for claim in details:
                parts.append(f"- {claim['reason']}")
            parts.append("\n🔍 **RECOMMENDATION**: Verify factual claims despite credible writing style.")
        
        if real_signals:
            parts.append("\n**Why this appears to be legitimate:**")
            for category, matches in real_signals.items():
                cat_name = category.replace('_', ' ').title()
                parts.append(f"- **{cat_name}**: Uses phrases like '{matches[0]}' typical of credible journalism")
        
        if fake_signals:
            parts.append("\n**⚠️ Note**: Some sensational language detected, but overall structure suggests legitimate content.")
        
        if confidence > 90:
            parts.append("\n✅ **HIGH CONFIDENCE**: Strong indicators of credible reporting.")
        elif confidence > 70:
            parts.append("\n✅ **MODERATE CONFIDENCE**: Generally appears legitimate but cross-reference recommended.")
        else:
            parts.append("\n✅ **LOW CONFIDENCE**: Mixed signals present. Independent verification advised.")
        
        return "\n".join(parts)
    
    def _extract_key_phrases(self, text: str, prediction: str) -> List[str]:
        """Extract important phrases from the text"""
        # Simple extraction - first find sentences with indicators
        sentences = [s.strip() for s in re.split(r'[.!?]', text) if len(s.strip()) > 20]
        
        text_lower = text.lower()
        key_phrases = []
        
        prediction_label = str(prediction or '').strip().upper()
        if prediction_label == "FAKE":
            # Find sentences with fake indicators
            for category, keywords in self.fake_indicators.items():
                for sent in sentences[:5]:  # Check first 5 sentences
                    for kw in keywords:
                        if kw in sent.lower() and sent not in key_phrases:
                            key_phrases.append(sent[:150] + "..." if len(sent) > 150 else sent)
                            break
                    if len(key_phrases) >= 3:
                        break
                if len(key_phrases) >= 3:
                    break
        
        return key_phrases[:3]  # Return top 3
    
    def _generate_assessment(
        self,
        prediction: str,
        confidence: float,
        fake_signals: Dict,
        real_signals: Dict,
        knowledge_verification: Dict = None
    ) -> str:
        """Generate overall risk assessment"""
        # Check knowledge verification first
        has_impossibilities = (knowledge_verification and 
                               knowledge_verification.get('impossible_claims_found', 0) > 0)
        
        prediction_label = str(prediction or '').strip().upper()
        if prediction_label == "FAKE":
            if has_impossibilities:
                return "CRITICAL RISK: Contains scientifically/factually impossible claims. Confirmed misinformation."
            elif confidence > 90:
                return "CRITICAL RISK: Highly likely to be misinformation. Contains multiple deceptive elements."
            elif confidence > 75:
                return "HIGH RISK: Strong indicators of fake news. Verify before sharing."
            else:
                return "MODERATE RISK: Suspicious content detected. Cross-check with reliable sources."
        else:
            if has_impossibilities:
                return "HIGH RISK: Credible writing style BUT contains factual impossibilities. Sophisticated misinformation."
            elif confidence > 90:
                return "LOW RISK: Content appears credible with typical journalistic patterns."
            elif confidence > 75:
                return "LOW-MODERATE RISK: Generally legitimate but contains some informal elements."
            else:
                return "MODERATE RISK: Mixed signals. Recommend verifying key claims independently."
    
    def _get_recommendations(self, prediction: str, confidence: float, knowledge_verification: Dict = None) -> List[str]:
        """Get actionable recommendations for users"""
        recommendations = []
        
        has_impossibilities = (knowledge_verification and 
                               knowledge_verification.get('impossible_claims_found', 0) > 0)
        
        prediction_label = str(prediction or '').strip().upper()
        if prediction_label == "FAKE":
            if has_impossibilities:
                recommendations.append("❌ CONFIRMED MISINFORMATION: Content contradicts established facts")
                recommendations.append("🚫 Do NOT share - contains scientifically/factually impossible claims")
                recommendations.append("📢 Report to fact-checking organizations and social media platforms")
            else:
                recommendations.append("🔍 Cross-check claims with reputable news sources (AP, Reuters, BBC)")
                recommendations.append("🔗 Verify source credibility and author credentials")
                recommendations.append("🚫 Do NOT share until verified from multiple trustworthy sources")
            
            if confidence > 90:
                recommendations.append("⚠️ Report to social media platforms as potential misinformation")
            
        else:
            if has_impossibilities:
                recommendations.append("⚠️ WARNING: Despite credible style, content contains factual errors")
                recommendations.append("🔬 Verify scientific/factual claims with domain experts")
                recommendations.append("❌ Do NOT trust based on writing style alone")
            else:
                recommendations.append("✅ Content appears legitimate, but always good to verify major claims")
                recommendations.append("🔗 Check the original source for full context")
                recommendations.append("📊 Look for supporting evidence and cited sources")
        
        return recommendations


if __name__ == "__main__":
    # Test the explainer
    logging.basicConfig(level=logging.INFO)
    
    explainer = ExplainableAI()
    
    # Test fake news
    fake_text = "SHOCKING! Bitcoin has crashed to $0 and all cryptocurrency exchanges have shut down permanently. Investors have lost everything overnight. You won't believe what happened next!"
    
    result = explainer.explain_prediction(
        text=fake_text,
        prediction="Fake",
        confidence=95.3,
        probabilities={"Real": 4.7, "Fake": 95.3}
    )
    
    print("\n" + "=" * 60)
    print("EXPLANATION TEST")
    print("=" * 60)
    print(result['explanation'])
    print("\nRecommendations:")
    for rec in result['recommendations']:
        print(f"  {rec}")
