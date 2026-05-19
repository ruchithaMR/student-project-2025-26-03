"""
Knowledge-Based Verification Service
Checks claims against factual knowledge bases and scientific principles
"""
import re
from typing import Dict, List, Tuple, Optional
import requests
from datetime import datetime


class KnowledgeVerificationService:
    """
    Service to verify claims against factual knowledge
    Complements ML style detection with domain knowledge
    """
    
    def __init__(self):
        # Medical/Health knowledge base
        self.medical_impossibilities = [
            # Miracle cures that don't exist
            {
                'pattern': r'(coffee|tea|water|juice|food|herb).{0,50}(cure|cures|curing|eliminate|eliminates|eliminating|prevent|prevents|preventing|treat|treats|treating).{0,30}(all|any|every|completely)?.{0,20}(virus|viral|infection|infections|disease|diseases|cancer|covid|flu|coronavirus)',
                'reason': 'No single food/beverage can cure or eliminate viral infections - this violates established medical science',
                'domain': 'medical',
                'severity': 'high'
            },
            {
                'pattern': r'(drink|eat|consume|eating|drinking|consuming).{0,30}(cure|cures|eliminate|eliminates|prevent|prevents|treat|treats).{0,30}(cancer|HIV|AIDS|COVID|coronavirus|viral infection)',
                'reason': 'No food or beverage can cure serious diseases like cancer or viral infections',
                'domain': 'medical',
                'severity': 'high'
            },
            {
                'pattern': r'caffeine.{0,30}block.{0,30}viral replication',
                'reason': 'Caffeine does not block viral replication - scientifically false claim',
                'domain': 'medical',
                'severity': 'high'
            },
            {
                'pattern': r'(pharmaceutical|drug)\s+compan(y|ies).{0,30}(suppress|hide|conceal|hiding|suppressing|concealing).{0,30}(cure|treatment|discovery)',
                'reason': 'Conspiracy theory about pharmaceutical companies suppressing cures',
                'domain': 'medical',
                'severity': 'medium'
            },
            {
                'pattern': r'(hot|warm)\s+water.{0,80}(cure|reverse|eliminate|remove).{0,80}(diabetes|blood\s+sugar).{0,40}(\d+\s*(day|days|week|weeks|month|months)|30\s*days)',
                'reason': 'Drinking hot/warm water cannot cure diabetes in fixed timelines - medically false and dangerous',
                'domain': 'medical',
                'severity': 'high'
            },
            {
                'pattern': r'(diabetes|blood\s+sugar).{0,80}(cure|reverse|gone|eliminate|remove).{0,80}(without|no).{0,30}(medicine|medicines|insulin|treatment|doctor)',
                'reason': 'Claims of curing diabetes without medicine or medical care are unsafe misinformation',
                'domain': 'medical',
                'severity': 'high'
            },
            {
                'pattern': r'(remove|flush|clean).{0,40}(all\s+)?sugar.{0,40}(from|out\s+of).{0,20}(blood|body).{0,40}(naturally|without\s+medicine)',
                'reason': 'No simple drink can remove all sugar from blood naturally; this is medically inaccurate',
                'domain': 'medical',
                'severity': 'high'
            },
            {
                'pattern': r'(doctors?|medical\s+community).{0,60}(don\'t\s+want|won\'t\s+tell|hiding|hide|suppress).{0,60}(cure|truth|treatment)',
                'reason': 'Conspiracy claim that doctors hide cures is a common misinformation pattern',
                'domain': 'medical',
                'severity': 'medium'
            },
            {
                'pattern': r'\d+%\s+of\s+(deaths|casualties)\s+from\s+(vaccine|vaccination)',
                'reason': 'Misinformation about vaccine safety - requires scientific evidence',
                'domain': 'medical',
                'severity': 'high'
            },
            {
                'pattern': r'(vaccine|vaccination|shot)\s+(cause|causes|caused|leads to)\s+(autism|death|disease)',
                'reason': 'Debunked vaccine misinformation',
                'domain': 'medical',
                'severity': 'high'
            }
        ]
        
        # Physics/Science impossibilities
        self.science_impossibilities = [
            {
                'pattern': r'(gravity|evolution|climate change)\s+(is\s+a\s+)?(myth|hoax|fake|conspiracy|lie)',
                'reason': 'Denying established scientific facts',
                'domain': 'science',
                'severity': 'high'
            },
            {
                'pattern': r'5G\s+(cause|spread|transmit)\s+(virus|COVID|coronavirus|disease)',
                'reason': 'Scientifically impossible - 5G radio waves cannot transmit viruses',
                'domain': 'science',
                'severity': 'high'
            },
            {
                'pattern': r'(perpetual motion|free energy|anti-gravity)\s+(machine|device|invention)\s+(discovered|invented|created)',
                'reason': 'Violates fundamental laws of physics',
                'domain': 'science',
                'severity': 'high'
            }
        ]
        
        # Political/Government impossibilities
        self.political_impossibilities = [
            {
                'pattern': r'government\s+(ban|will ban|banning|to ban)\s+all\s+cash',
                'reason': 'Extreme claim requiring official government announcement',
                'domain': 'political',
                'severity': 'medium'
            },
            {
                'pattern': r'(secret|classified)\s+document\s+reveal',
                'reason': 'Unverifiable claim about classified information',
                'domain': 'political',
                'severity': 'medium'
            },
            {
                'pattern': r'mainstream media\s+(silent|hiding|suppressing|covering up)',
                'reason': 'Conspiracy theory pattern about media suppression',
                'domain': 'political',
                'severity': 'medium'
            }
        ]
        
        # Financial/Economic statistics verification (2026 data)
        self.financial_impossibilities = [
            {
                # Pattern 1: "national debt of the United States..."
                'pattern': r'(national\s+debt|debt)\s+(of\s+)?(the\s+)?(us|united states|u\.s\.|usa|american|america).{0,30}(exceeded|surpassed|reached|hit|is|at|has exceeded|has surpassed|has reached).{0,30}\$?\s*(40|41|42|43|44|45|50|60|70|80|90|100)\s*trillion',
                'reason': 'US national debt is approximately $38.5-$38.6 trillion as of early 2026, not $40+ trillion',
                'domain': 'financial',
                'severity': 'high',
                'actual_value': '$38.5-$38.6 trillion (Jan-Feb 2026)'
            },
            {
                # Pattern 2: "US national debt exceeded..."
                'pattern': r'(us|united states|u\.s\.|usa|american|america)\s+(national\s+)?debt.{0,30}(exceeded|surpassed|reached|hit|is|at).{0,30}\$?\s*(40|41|42|43|44|45|50|60|70|80|90|100)\s*trillion',
                'reason': 'US national debt is approximately $38.5-$38.6 trillion as of early 2026, not $40+ trillion',
                'domain': 'financial',
                'severity': 'high',
                'actual_value': '$38.5-$38.6 trillion (Jan-Feb 2026)'
            },
            {
                # Bitcoin price >$100k (current price ~$68k as of March 2026)
                'pattern': r'(bitcoin|btc).{0,100}(price|value|worth|trading|reached|reaches|hit|hits|surged|surpassed|exceeded|exploded|breaking|record).{0,50}\$?\s*,?([1-9][0-9]{2}),?0{3}',
                'reason': 'Bitcoin price claim appears unrealistic - current Bitcoin price is approximately $68,000 (March 2026). Claims of $100,000+ should be verified against real-time market data.',
                'domain': 'financial-crypto',
                'severity': 'high',
                'actual_value': 'Bitcoin: ~$68,000 (March 2026)'
            },
            {
                # Bitcoin extremely high prices >$200k
                'pattern': r'(bitcoin|btc).{0,80}(\$|price|worth|value).{0,30}([2-9][0-9]{2},?0{3}|[1-9]\.[0-9]?\s*million)',
                'reason': 'Bitcoin price claim of $200,000+ is significantly above current market value (~$68k) and requires verification',
                'domain': 'financial-crypto',
                'severity': 'high',
                'actual_value': 'Bitcoin: ~$68,000 (March 2026)'
            },
            {
                # Cryptocurrency market explosion claims
                'pattern': r'(cryptocurrency|crypto|bitcoin|btc|ethereum|eth).{0,50}(market|price).{0,30}(explodes|exploded|explosion|skyrockets|skyrocketing|surges).{0,50}(predict|predicts|prediction|forecast).{0,30}\$?\s*([3-9][0-9]{2},?0{3}|[1-9]\s*million)',
                'reason': 'Sensationalized cryptocurrency predictions with extreme future prices (e.g., $500k, $1M) are speculative and often misleading',
                'domain': 'financial-crypto',
                'severity': 'high'
            },
            {
                # Ethereum extreme prices >$10k
                'pattern': r'(ethereum|eth).{0,80}(price|value|worth|reached|reached|hit).{0,40}\$?\s*([1-9][0-9],?0{3}|[1-9][0-9]{2},?0{3})',
                'reason': 'Ethereum price claim appears unrealistic - verify against current market data (~$3,500 range)',
                'domain': 'financial-crypto',
                'severity': 'medium'
            },
            {
                # Bitcoin crashed to $0 / worthless / dead
                'pattern': r'(bitcoin|btc).{0,80}(crashed|crash|dropped|fell|hit|worth|value|price|trading).{0,40}(\$\s*0|zero|worthless|\$\s*0\.0)',
                'reason': 'Bitcoin cannot crash to exactly $0 while still being traded - this claim is factually impossible',
                'domain': 'financial-crypto',
                'severity': 'high',
                'actual_value': 'Bitcoin: ~$68,000 (March 2026)'
            },
            {
                # All exchanges shut down / closed permanently
                'pattern': r'(all|every).{0,30}(cryptocurrency|crypto).{0,30}(exchange|exchanges).{0,50}(shut\s+down|closed|shutdown|suspended|halted).{0,30}(permanently|forever|completely)',
                'reason': 'Claim that ALL crypto exchanges shut down permanently is extremely implausible and would be global breaking news',
                'domain': 'financial-crypto',
                'severity': 'high'
            },
            {
                # Cryptocurrency declared dead/banned worldwide/worthless
                'pattern': r'(bitcoin|btc|ethereum|eth|cryptocurrency|crypto).{0,50}(declared|officially|confirmed|proven).{0,30}(dead|worthless|banned|illegal|shutdown).{0,30}(worldwide|globally|everywhere|permanently)',
                'reason': 'Global declaration of all cryptocurrency as dead or worthless is factually impossible without major verified news coverage',
                'domain': 'financial-crypto',
                'severity': 'high'
            },
            {
                'pattern': r'(dow jones|dow|djia|s&p 500|s&p|nasdaq).{0,50}(crashed|plunged|dropped|fell).{0,30}(50|60|70|80|90)%',
                'reason': 'Stock market crash of 50%+ would be major global news - extremely unlikely without widespread coverage',
                'domain': 'financial',
                'severity': 'high'
            },
            {
                'pattern': r'unemployment\s+rate.{0,30}(reached|hit|surpassed|exceeded).{0,20}(30|40|50|60|70|80|90)%',
                'reason': 'Unemployment rate claim is unrealistically high - Great Depression peak was ~25%',
                'domain': 'financial',
                'severity': 'high'
            }
        ]
        
        # Sports records and achievements
        self.sports_impossibilities = [
            {
                'pattern': r'(ran|run|running|sprint|dash).{0,30}100.{0,10}meters.{0,30}(in|under|at).{0,15}([0-8]\.[0-9]|9\.[0-5])\s*seconds',
                'reason': 'Human 100m world record is 9.58s (Usain Bolt) - claims significantly below this are impossible',
                'domain': 'sports',
                'severity': 'high',
                'actual_value': 'World record: 9.58s (Bolt, 2009)'
            },
            {
                'pattern': r'(marathon|42\.195|26\.2\s*miles).{0,30}(in|under|finished).{0,20}(one|1|[0-8][0-9])\s*minutes',
                'reason': 'Marathon world record is ~2 hours - claims under 90 minutes are physically impossible',
                'domain': 'sports',
                'severity': 'high',
                'actual_value': 'World record: ~2:00:35 (Kipchoge)'
            },
            {
                'pattern': r'(scored|score).{0,20}(200|[3-9][0-9]{2}|[1-9][0-9]{3}).{0,20}points.{0,20}(in|per|single).{0,10}(game|match)',
                'reason': 'NBA single-game scoring record is 100 points (Wilt Chamberlain) - claims of 200+ are impossible',
                'domain': 'sports',
                'severity': 'high',
                'actual_value': 'NBA record: 100 points (Chamberlain, 1962)'
            },
            {
                'pattern': r'(world cup|olympics|championship).{0,30}won by.{0,30}(100|[1-9][0-9])-0',
                'reason': 'Victory margins of 100-0 in major tournaments are unrealistic',
                'domain': 'sports',
                'severity': 'high'
            }
        ]
        
        # Historical facts (well-established dates and events)
        self.historical_impossibilities = [
            {
                'pattern': r'world war (ii|2|two).{0,30}(started|began|outbreak).{0,30}(194[0-46-9]|19[0-2][0-9]|195[0-9]|19[6-9][0-9])',
                'reason': 'World War II began in 1939 (Europe) or 1937 (Asia) - incorrect dates suggest misinformation',
                'domain': 'historical',
                'severity': 'high',
                'actual_value': 'WWII: 1939-1945 (Europe), 1937-1945 (Asia)'
            },
            {
                'pattern': r'(moon landing|apollo 11|armstrong).{0,50}(196[0-8]|197[0-9]|19[89][0-9]|20[0-9]{2})',
                'reason': 'Apollo 11 moon landing was July 20, 1969 - other dates are incorrect',
                'domain': 'historical',
                'severity': 'high',
                'actual_value': 'Moon landing: July 20, 1969'
            },
            {
                'pattern': r'(berlin wall|wall).{0,30}(fell|fall|collapse).{0,30}(198[0-8]|199[0-9]|20[0-9]{2})',
                'reason': 'Berlin Wall fell on November 9, 1989 - incorrect dates suggest fabrication',
                'domain': 'historical',
                'severity': 'medium',
                'actual_value': 'Berlin Wall fell: November 9, 1989'
            },
            {
                'pattern': r'(america|united states|us|usa).{0,30}independence.{0,30}(177[0-57-9]|178[0-9]|17[0-68][0-9]|18[0-9]{2}|19[0-9]{2})',
                'reason': 'US Declaration of Independence was July 4, 1776 - incorrect dates suggest misinformation',
                'domain': 'historical',
                'severity': 'high',
                'actual_value': 'US Independence: July 4, 1776'
            }
        ]
        
        # Geographic facts (countries, populations, locations)
        self.geographic_impossibilities = [
            {
                'pattern': r'(russia|russian).{0,30}population.{0,30}(exceeds|exceeded|over|more than|surpassed).{0,20}(500|[5-9][0-9]{2})\s*million',
                'reason': 'Russia population is ~143-146 million - claims of 500+ million are false',
                'domain': 'geographic',
                'severity': 'high',
                'actual_value': 'Russia population: ~143-146 million (2026)'
            },
            {
                'pattern': r'(china|chinese).{0,30}population.{0,30}(exceeds|over|more than).{0,20}([2-9]|[1-9][0-9])\s*billion',
                'reason': 'China population is ~1.4 billion - claims significantly higher are incorrect',
                'domain': 'geographic',
                'severity': 'medium',
                'actual_value': 'China population: ~1.4 billion (2026)'
            },
            {
                'pattern': r'(mount everest|everest).{0,30}(height|altitude|elevation).{0,30}(10,?000|1[0-7],?[0-9]{3}|[1-9],?[0-9]{3})\s*(meters|m|feet|ft)',
                'reason': 'Mount Everest is 8,849m (29,032ft) - significantly different values are incorrect',
                'domain': 'geographic',
                'severity': 'medium',
                'actual_value': 'Everest: 8,849m / 29,032ft'
            },
            {
                'pattern': r'(australia|australian).{0,30}(joined|part of).{0,30}(asia|europe|americas|africa)',
                'reason': 'Australia is a continent/country in Oceania, not part of Asia, Europe, Americas, or Africa',
                'domain': 'geographic',
                'severity': 'high',
                'actual_value': 'Australia: Oceania/Australia continent'
            },
            {
                'pattern': r'(new country|new nation|country formed).{0,30}(africa|middle east|europe).{0,30}202[0-6]',
                'reason': 'No major new countries formed 2020-2026 - verify against official UN recognition',
                'domain': 'geographic',
                'severity': 'medium'
            }
        ]
        
        # Technology and physics limits
        self.technology_impossibilities = [
            {
                'pattern': r'(smartphone|phone|mobile).{0,30}battery.{0,30}(lasts|last).{0,30}(one|1)\s*(month|year|decade)',
                'reason': 'Current battery technology cannot power smartphones for months without charging',
                'domain': 'technology',
                'severity': 'high'
            },
            {
                'pattern': r'(internet|wifi|wireless).{0,30}speed.{0,30}(1000|[1-9][0-9]{3,})\s*(terabits|tbps)',
                'reason': 'Commercial internet speeds don\'t reach terabits per second for consumers',
                'domain': 'technology',
                'severity': 'high'
            },
            {
                'pattern': r'(car|vehicle|automobile).{0,30}(speed|traveled|reaching).{0,30}(500|[6-9][0-9]{2}|[1-9][0-9]{3})\s*(mph|kmh|km/h)',
                'reason': 'Land speed records for road-legal cars are much lower - verify claim',
                'domain': 'technology',
                'severity': 'medium',
                'actual_value': 'Road car record: ~305 mph (SSC Tuatara)'
            },
            {
                'pattern': r'(ai|artificial intelligence|computer).{0,30}(became|achieved|demonstrated).{0,30}(consciousness|sentience|self-aware)',
                'reason': 'AI consciousness/sentience is not scientifically verified - extraordinary claim requires evidence',
                'domain': 'technology',
                'severity': 'medium'
            },
            {
                'pattern': r'(consumer|home|personal|retail).{0,30}(quantum computer|quantum).{0,30}(available|released|launched|for purchase|for sale)',
                'reason': 'Quantum computers are not yet available for consumer purchase - still in research/enterprise phase',
                'domain': 'technology',
                'severity': 'high'
            },
            {
                'pattern': r'(quantum computer|quantum).{0,30}(available|released|launched).{0,30}(consumer|home|personal|retail)',
                'reason': 'Quantum computers are not yet available for consumer purchase - still in research/enterprise phase',
                'domain': 'technology',
                'severity': 'high'
            }
        ]
        
        # Combine all knowledge bases
        self.all_impossibilities = (
            self.medical_impossibilities + 
            self.science_impossibilities + 
            self.political_impossibilities +
            self.financial_impossibilities +
            self.sports_impossibilities +
            self.historical_impossibilities +
            self.geographic_impossibilities +
            self.technology_impossibilities
        )
        
        # Common fake news red flags
        self.red_flags = {
            'unverifiable_sources': [
                r'private laboratory',
                r'anonymous source',
                r'insider claims',
                r'secret study',
                r'classified research'
            ],
            'conspiracy_indicators': [
                r'they don\'t want you to know',
                r'doctors?\s+(don\'t|do\s+not|won\'t)\s+want\s+(you|the public)\s+to\s+know',
                r'mainstream media\s+(won\'t|doesn\'t|refuse)',
                r'big pharma',
                r'pharmaceutical\s+compan(y|ies)',
                r'cover[-\s]?up',
                r'deep state'
            ],
            'urgency_manipulation': [
                r'share before (deleted|removed|banned)',
                r'this will be (deleted|censored|taken down)',
                r'act now before',
                r'don\'t let them'
            ]
        }
    
    def verify_claims(self, text: str) -> Dict:
        """
        Check text against knowledge base for impossible or suspicious claims
        
        Args:
            text: News text to verify
            
        Returns:
            Dictionary with verification results
        """
        text_lower = text.lower()
        
        # Find impossible claims
        impossible_claims = []
        for impossibility in self.all_impossibilities:
            matches = re.finditer(impossibility['pattern'], text_lower, re.IGNORECASE)
            for match in matches:
                impossible_claims.append({
                    'claim': match.group(0),
                    'reason': impossibility['reason'],
                    'domain': impossibility['domain'],
                    'severity': impossibility['severity']
                })
        
        # Find red flags
        red_flags_found = []
        for flag_type, patterns in self.red_flags.items():
            for pattern in patterns:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    red_flags_found.append({
                        'type': flag_type,
                        'pattern': pattern.replace('\\', '')
                    })
        
        # Calculate knowledge-based credibility score
        knowledge_score = self._calculate_knowledge_score(
            len(impossible_claims),
            len(red_flags_found),
            len(text)
        )
        
        # Determine if knowledge verification flags as fake
        is_knowledge_fake = self._is_knowledge_fake(impossible_claims, red_flags_found)
        
        return {
            'verified_by_knowledge': True,
            'is_fake_by_knowledge': is_knowledge_fake,
            'knowledge_confidence': knowledge_score,
            'impossible_claims': impossible_claims,
            'red_flags': red_flags_found,
            'knowledge_assessment': self._generate_assessment(
                impossible_claims, 
                red_flags_found, 
                knowledge_score
            )
        }
    
    def _calculate_knowledge_score(
        self, 
        impossible_count: int, 
        red_flags_count: int, 
        text_length: int
    ) -> float:
        """
        Calculate confidence score based on knowledge verification
        
        Returns:
            Float between 0-100 representing confidence it's fake
        """
        score = 0.0
        
        # Impossible claims are strong indicators
        if impossible_count > 0:
            # Give more weight to impossible claims
            score += min(impossible_count * 35, 75)  # Max 75 from impossible claims
        
        # Red flags add to the score
        if red_flags_count > 0:
            score += min(red_flags_count * 12, 30)  # Max 30 from red flags
        
        # Normalize by text length (longer text with same issues = less severe)
        if text_length < 200:
            score *= 1.3  # Short text with issues = more suspicious
        elif text_length < 100:
            score *= 1.5  # Very short text = even more suspicious
        
        return min(score, 100.0)
    
    def _is_knowledge_fake(
        self, 
        impossible_claims: List[Dict], 
        red_flags: List[Dict]
    ) -> bool:
        """
        Determine if knowledge verification flags content as fake
        """
        # High severity impossible claims = definitely fake
        high_severity_count = sum(
            1 for claim in impossible_claims 
            if claim['severity'] == 'high'
        )
        
        if high_severity_count >= 1:
            return True
        
        # Check for medium severity claims (especially financial)
        medium_severity_count = sum(
            1 for claim in impossible_claims 
            if claim['severity'] == 'medium'
        )
        
        # Financial claims (like unrealistic crypto prices) - flag with just 1 occurrence
        financial_medium_claims = sum(
            1 for claim in impossible_claims
            if claim['severity'] == 'medium' and claim['domain'] == 'financial'
        )
        
        if financial_medium_claims >= 1:
            return True
        
        # Multiple medium severity claims = likely fake
        if medium_severity_count >= 2:
            return True
        
        # One medium + multiple red flags = likely fake
        if medium_severity_count >= 1 and len(red_flags) >= 2:
            return True
        
        return False
    
    def _generate_assessment(
        self, 
        impossible_claims: List[Dict], 
        red_flags: List[Dict], 
        score: float
    ) -> str:
        """
        Generate human-readable assessment
        """
        if not impossible_claims and not red_flags:
            return "No factual impossibilities detected by knowledge verification."
        
        parts = []
        
        if impossible_claims:
            parts.append(f"⚠️ KNOWLEDGE VERIFICATION ALERT: Found {len(impossible_claims)} scientifically/factually impossible claim(s)")
            
            for claim in impossible_claims[:3]:  # Show top 3
                parts.append(f"  • {claim['domain'].title()}: {claim['reason']}")
        
        if red_flags:
            parts.append(f"\n🚩 Found {len(red_flags)} misinformation red flag(s)")
        
        if score >= 70:
            parts.append("\n❌ VERDICT: Content contradicts established facts and should be treated as FAKE")
        elif score >= 40:
            parts.append("\n⚠️ VERDICT: Content contains suspicious claims requiring careful verification")
        else:
            parts.append("\n✓ VERDICT: No major factual impossibilities detected")
        
        return "\n".join(parts)
    
    def combine_with_ml_prediction(
        self, 
        ml_prediction: str, 
        ml_confidence: float, 
        knowledge_result: Dict
    ) -> Tuple[str, float, Dict]:
        """
        Combine ML style-based prediction with knowledge verification
        
        Args:
            ml_prediction: Original ML prediction ('Fake' or 'Real')
            ml_confidence: Original ML confidence (0-100)
            knowledge_result: Knowledge verification results
            
        Returns:
            Tuple of (final_prediction, final_confidence, explanation)
        """
        is_knowledge_fake = knowledge_result['is_fake_by_knowledge']
        knowledge_confidence = knowledge_result['knowledge_confidence']
        
        # If knowledge verification strongly flags as fake, override ML
        if is_knowledge_fake and knowledge_confidence >= 70:
            # Knowledge verification found impossible claims
            final_prediction = 'Fake'
            
            # Boost confidence if both agree it's fake
            if ml_prediction == 'Fake':
                final_confidence = min((ml_confidence + knowledge_confidence) / 2 + 10, 100)
            else:
                # Knowledge overrides ML
                final_confidence = knowledge_confidence
            
            explanation = {
                'override': True,
                'reason': 'Knowledge verification detected factual impossibilities',
                'details': knowledge_result['knowledge_assessment'],
                'ml_original': f"{ml_prediction} ({ml_confidence:.1f}%)",
                'knowledge_override': f"Fake ({knowledge_confidence:.1f}%)"
            }
        
        # If knowledge found medium severity issues (40-70% confidence)
        elif is_knowledge_fake and 40 <= knowledge_confidence < 70:
            # Medium confidence knowledge issues
            if ml_prediction == 'Fake':
                # Both suggest fake, combine confidences
                final_prediction = 'Fake'
                final_confidence = min((ml_confidence + knowledge_confidence) / 2 + 5, 100)
            else:
                # ML says Real but knowledge found suspicious patterns
                # Downgrade ML confidence and flag as suspicious
                final_prediction = 'Fake'
                final_confidence = knowledge_confidence
            
            explanation = {
                'override': True if ml_prediction == 'Real' else False,
                'reason': 'Knowledge verification detected suspicious patterns',
                'details': knowledge_result['knowledge_assessment'],
                'ml_original': f"{ml_prediction} ({ml_confidence:.1f}%)",
                'knowledge_influence': f"Adjusted to Fake ({knowledge_confidence:.1f}%)"
            }
        
        # If both ML and knowledge agree it's real
        elif not is_knowledge_fake and ml_prediction == 'Real':
            final_prediction = 'Real'
            final_confidence = ml_confidence
            explanation = {
                'override': False,
                'reason': 'Both ML and knowledge verification indicate content is credible',
                'details': knowledge_result['knowledge_assessment']
            }
        
        # If ML says fake but knowledge doesn't find issues
        elif ml_prediction == 'Fake' and not is_knowledge_fake:
            final_prediction = 'Fake'
            final_confidence = ml_confidence
            explanation = {
                'override': False,
                'reason': 'ML detected fake news patterns in writing style',
                'details': 'No factual impossibilities found, but language patterns suggest misinformation'
            }
        
        else:
            # Default to ML prediction
            final_prediction = ml_prediction
            final_confidence = ml_confidence
            explanation = {
                'override': False,
                'reason': 'Using ML prediction',
                'details': knowledge_result['knowledge_assessment']
            }
        
        return final_prediction, final_confidence, explanation


# Singleton instance
_knowledge_service = None

def get_knowledge_service() -> KnowledgeVerificationService:
    """Get or create singleton knowledge verification service"""
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeVerificationService()
    return _knowledge_service
