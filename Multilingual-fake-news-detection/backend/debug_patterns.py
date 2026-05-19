"""
Debug Knowledge Patterns - Test why patterns aren't matching
"""
import sys
import os
import re
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.knowledge_verification_service import get_knowledge_service

# Test cases that are failing
test_cases = [
    {
        "name": "Bitcoin $150k",
        "text": "Financial analysts report that Bitcoin has reached an unprecedented milestone, with the cryptocurrency's price surging to $150,000 per coin.",
        "expected_domain": "financial"
    },
    {
        "name": "100m in 7.5 seconds",
        "text": "Olympic athlete breaks world record by running 100 meters in just 7.5 seconds at the Tokyo championship.",
        "expected_domain": "sports"
    },
    {
        "name": "Russia 600M population",
        "text": "Recent census data shows Russia's population has exceeded 600 million people this year.",
        "expected_domain": "geographic"
    },
    {
        "name": "Consumer quantum computers",
        "text": "Tech company announces consumer quantum computers now available for purchase at local electronics stores.",
        "expected_domain": "technology"
    }
]

knowledge_service = get_knowledge_service()

print("=" * 80)
print("DEBUGGING KNOWLEDGE PATTERN MATCHING")
print("=" * 80)

for test in test_cases:
    print(f"\n{'─' * 80}")
    print(f"TEST: {test['name']}")
    print(f"{'─' * 80}")
    print(f"Text: {test['text']}")
    print(f"Expected Domain: {test['expected_domain']}")
    
    # Test with knowledge service
    result = knowledge_service.verify_claims(test['text'])
    
    if result['impossible_claims']:
        print(f"\n✅ MATCHED!")
        for claim in result['impossible_claims']:
            print(f"  Domain: {claim['domain']}")
            print(f"  Claim: {claim['claim']}")
            print(f"  Reason: {claim['reason']}")
    else:
        print(f"\n❌ NO MATCH - Manually testing patterns...")
        
        # Manually test each pattern in the expected domain
        text_lower = test['text'].lower()
        
        if test['expected_domain'] == 'sports':
            patterns = knowledge_service.sports_impossibilities
        elif test['expected_domain'] == 'geographic':
            patterns = knowledge_service.geographic_impossibilities
        elif test['expected_domain'] == 'technology':
            patterns = knowledge_service.technology_impossibilities
        elif test['expected_domain'] == 'financial':
            patterns = knowledge_service.financial_impossibilities
        else:
            patterns = []
        
        print(f"\n  Testing {len(patterns)} {test['expected_domain']} patterns...")
        
        for i, pattern_dict in enumerate(patterns, 1):
            pattern = pattern_dict['pattern']
            try:
                match = re.search(pattern, text_lower, re.IGNORECASE)
                if match:
                    print(f"\n  ✓ Pattern {i} MATCHES!")
                    print(f"    Pattern: {pattern[:80]}...")
                    print(f"    Match: {match.group(0)}")
                    print(f"    Reason: {pattern_dict['reason']}")
                    break
            except re.error as e:
                print(f"  ✗ Pattern {i} ERROR: {e}")
        else:
            print(f"\n  ✗ No patterns matched")
            print(f"\n  Text (lowercase): {text_lower}")
            print(f"\n  First pattern: {patterns[0]['pattern'][:200]}" if patterns else "  No patterns!")

print("\n" + "=" * 80)
