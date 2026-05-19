"""
Debug regex pattern for US debt verification
"""
import re

text = "The national debt of the United States has exceeded $40 trillion this year."
text_lower = text.lower()

print("\n" + "="*80)
print("REGEX PATTERN DEBUGGING")
print("="*80)
print(f"\nOriginal Text: {text}")
print(f"Lowercase Text: {text_lower}")
print("-"*80)

patterns = [
    # Pattern 1: "national debt of the United States..."
    r'(national\s+debt|debt)\s+(of\s+)?(the\s+)?(us|united states|u\.s\.|usa|american|america).{0,30}(exceeded|surpassed|reached|hit|is|at|has exceeded|has surpassed|has reached).{0,30}\$?\s*(40|41|42|43|44|45|50|60|70|80|90|100)\s*trillion',
    
    # Pattern 2: "US national debt exceeded..."
    r'(us|united states|u\.s\.|usa|american|america)\s+(national\s+)?debt.{0,30}(exceeded|surpassed|reached|hit|is|at).{0,30}\$?\s*(40|41|42|43|44|45|50|60|70|80|90|100)\s*trillion',
    
    # Simpler pattern
    r'debt.{0,50}exceeded.{0,50}\$?\s*40\s*trillion',
]

for i, pattern in enumerate(patterns, 1):
    print(f"\nPattern {i}:")
    print(f"  {pattern}")
    matches = list(re.finditer(pattern, text_lower, re.IGNORECASE))
    if matches:
        print(f"  ✓ MATCHED!")
        for match in matches:
            print(f"    Match: '{match.group(0)}'")
            print(f"    Groups: {match.groups()}")
    else:
        print(f"  ✗ NO MATCH")

print("\n" + "="*80)
