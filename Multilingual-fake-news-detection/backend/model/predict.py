"""
Fake News Detector — CLI Inference Script
------------------------------------------
Usage:
    python backend/model/predict.py
    python backend/model/predict.py --text "NASA confirms water on Mars"

Examples:
    >>> predict_text("Breaking: Scientists discover cure for cancer")
    {'prediction': 'REAL', 'confidence': 0.8821}

    >>> predict_text("SHOCKING: Obama admits being secretly born on the moon")
    {'prediction': 'FAKE', 'confidence': 0.9743}
"""

import os
import sys
import argparse
import torch
import torch.nn.functional as F
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast

# ── paths (relative to this file's location) ──────────────────────────────────
_HERE        = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR    = os.path.join(_HERE, "fake_news_model")
TOKENIZER_DIR = os.path.join(_HERE, "tokenizer")

MAX_LENGTH   = 512
LABELS       = {0: "REAL", 1: "FAKE"}

# ── load model + tokenizer ONCE at import time ────────────────────────────────
print("Loading model...", end=" ", flush=True)

if not os.path.isdir(MODEL_DIR):
    sys.exit(f"\n[ERROR] Model directory not found: {MODEL_DIR}\n"
             "Run train_model.py first to generate the model.")
if not os.path.isdir(TOKENIZER_DIR):
    sys.exit(f"\n[ERROR] Tokenizer directory not found: {TOKENIZER_DIR}")

_device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_tokenizer = DistilBertTokenizerFast.from_pretrained(TOKENIZER_DIR)
_model     = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
_model.to(_device)
_model.eval()

print(f"ready  [{_device}]")


# ── core inference function ───────────────────────────────────────────────────
def predict_text(text: str) -> dict:
    """
    Classify a news text as REAL or FAKE.

    Args:
        text: Raw news string (title, body, or both).

    Returns:
        {
            "prediction": "FAKE" | "REAL",
            "confidence": float   # probability of the predicted class (0–1)
        }

    Examples:
        predict_text("Government announces new tax reform bill")
        # → {'prediction': 'REAL', 'confidence': 0.8934}

        predict_text("Aliens take over White House, President missing")
        # → {'prediction': 'FAKE', 'confidence': 0.9812}
    """
    if not text or not text.strip():
        raise ValueError("Input text must not be empty.")

    encoding = _tokenizer(
        text.strip(),
        return_tensors="pt",
        max_length=MAX_LENGTH,
        padding="max_length",
        truncation=True,
    )
    input_ids      = encoding["input_ids"].to(_device)
    attention_mask = encoding["attention_mask"].to(_device)

    with torch.no_grad():
        logits = _model(input_ids=input_ids, attention_mask=attention_mask).logits

    probs      = F.softmax(logits, dim=-1).squeeze()          # [p_real, p_fake]
    pred_idx   = int(torch.argmax(probs).item())
    confidence = float(probs[pred_idx].item())

    return {
        "prediction": LABELS[pred_idx],
        "confidence": round(confidence, 4),
    }


# ── CLI ───────────────────────────────────────────────────────────────────────
def _print_result(result: dict) -> None:
    pred  = result["prediction"]
    conf  = result["confidence"]
    color = "\033[91m" if pred == "FAKE" else "\033[92m"   # red / green
    reset = "\033[0m"
    bar   = "█" * int(conf * 30) + "░" * (30 - int(conf * 30))
    print(f"\n  Prediction : {color}{pred}{reset}")
    print(f"  Confidence : {conf:.4f}  {color}{bar}{reset}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Fake News Detector — quick CLI test of the trained DistilBERT model"
    )
    parser.add_argument(
        "--text", "-t", type=str, default=None,
        help="News text to classify (skips interactive prompt)"
    )
    parser.add_argument(
        "--loop", "-l", action="store_true",
        help="Keep prompting until user types 'quit'"
    )
    args = parser.parse_args()

    print("\n" + "─" * 52)
    print("  Fake News Detector  |  distilbert-multilingual")
    print("─" * 52)

    if args.text:
        # single-shot mode from --text flag
        result = predict_text(args.text)
        print(f"\n  Input      : {args.text[:80]}{'...' if len(args.text) > 80 else ''}")
        _print_result(result)
        return

    # interactive mode
    while True:
        try:
            text = input("\nEnter news text (or 'quit' to exit):\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye.")
            break

        if text.lower() in ("quit", "exit", "q"):
            print("Bye.")
            break
        if not text:
            print("  [!] Please enter some text.")
            continue

        try:
            result = predict_text(text)
            _print_result(result)
        except Exception as exc:
            print(f"  [ERROR] {exc}")

        if not args.loop:
            break    # single interactive run unless --loop


if __name__ == "__main__":
    main()
