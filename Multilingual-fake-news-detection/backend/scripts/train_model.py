import argparse
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from transformers import (
    DistilBertForSequenceClassification,
    DistilBertTokenizerFast,
    EvalPrediction,
    Trainer,
    TrainingArguments,
)


MODEL_NAME = "distilbert-base-multilingual-cased"


class NewsDataset(Dataset):
    """Torch dataset backed by tokenizer outputs and integer labels."""

    def __init__(self, texts: list[str], labels: list[int], tokenizer: DistilBertTokenizerFast, max_length: int = 512):
        self.encodings = tokenizer(
            texts,
            max_length=max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx: int):
        item = {key: value[idx] for key, value in self.encodings.items()}
        item["labels"] = self.labels[idx]
        return item


def load_split(split_path: Path) -> tuple[list[str], list[int]]:
    """Load a prepared CSV split and return texts and labels."""
    if not split_path.exists() or not split_path.is_file():
        raise FileNotFoundError(f"Split file not found: {split_path}")

    df = pd.read_csv(split_path)
    if "text" not in df.columns or "label" not in df.columns:
        raise ValueError(f"Split file {split_path} must contain 'text' and 'label' columns.")

    texts = df["text"].astype(str).tolist()
    labels = df["label"].astype(int).tolist()
    return texts, labels


def compute_metrics(eval_pred: EvalPrediction) -> dict[str, float]:
    """Compute binary classification metrics for fake-news detection."""
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=1)

    labels = np.asarray(labels)
    preds = np.asarray(preds)

    tp = int(np.sum((labels == 1) & (preds == 1)))
    tn = int(np.sum((labels == 0) & (preds == 0)))
    fp = int(np.sum((labels == 0) & (preds == 1)))
    fn = int(np.sum((labels == 1) & (preds == 0)))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    acc = (tp + tn) / max(len(labels), 1)

    return {
        "accuracy": float(acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
    }


def get_training_runtime_config() -> tuple[str, bool, bool, int]:
    """Infer device-aware Trainer settings for CPU/CUDA execution."""
    use_cuda = torch.cuda.is_available()
    use_fp16 = use_cuda
    use_bf16 = False

    device_name = torch.cuda.get_device_name(0) if use_cuda else "cpu"
    dataloader_workers = 0 if os.name == "nt" else min(4, os.cpu_count() or 1)
    return device_name, use_fp16, use_bf16, dataloader_workers


def main():
    parser = argparse.ArgumentParser(description="Train DistilBERT fake news classifier.")
    parser.add_argument("--data-dir", type=Path, default=Path("backend/training/processed"), help="Path to split CSV files.")
    parser.add_argument("--model-dir", type=Path, default=Path("backend/model"), help="Path to save trained model and tokenizer.")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--dataloader-workers", type=int, default=None, help="Number of dataloader worker processes. Defaults to auto-detect.")
    args = parser.parse_args()

    if not args.data_dir.exists() or not args.data_dir.is_dir():
        raise FileNotFoundError(f"Data directory not found: {args.data_dir}")

    args.model_dir.mkdir(parents=True, exist_ok=True)

    train_texts, train_labels = load_split(args.data_dir / "train.csv")
    val_texts, val_labels = load_split(args.data_dir / "val.csv")
    test_texts, test_labels = load_split(args.data_dir / "test.csv")

    device_name, use_fp16, use_bf16, auto_workers = get_training_runtime_config()
    dataloader_workers = args.dataloader_workers if args.dataloader_workers is not None else auto_workers

    print(f"Training device: {device_name}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    print(f"fp16 enabled: {use_fp16}")
    print(f"bf16 enabled: {use_bf16}")
    print(f"Dataloader workers: {dataloader_workers}")

    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)
    model = DistilBertForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)

    train_dataset = NewsDataset(train_texts, train_labels, tokenizer)
    val_dataset = NewsDataset(val_texts, val_labels, tokenizer)
    test_dataset = NewsDataset(test_texts, test_labels, tokenizer)

    run_output_dir = args.model_dir / "training_runs"
    run_output_dir.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(run_output_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="steps",
        logging_steps=100,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        report_to="none",
        seed=args.seed,
        fp16=use_fp16,
        bf16=use_bf16,
        dataloader_num_workers=dataloader_workers,
        dataloader_pin_memory=torch.cuda.is_available(),
        save_total_limit=2,
        auto_find_batch_size=torch.cuda.is_available(),
        gradient_checkpointing=torch.cuda.is_available(),
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
    )

    train_result = trainer.train()
    val_metrics = trainer.evaluate(eval_dataset=val_dataset)
    test_metrics = trainer.evaluate(eval_dataset=test_dataset, metric_key_prefix="test")

    model_dir = args.model_dir / "fake_news_model"
    tokenizer_dir = args.model_dir / "tokenizer"
    model_dir.mkdir(parents=True, exist_ok=True)
    tokenizer_dir.mkdir(parents=True, exist_ok=True)

    model.save_pretrained(model_dir)
    tokenizer.save_pretrained(tokenizer_dir)

    metrics = {
        "model_name": MODEL_NAME,
        "num_labels": 2,
        "device": device_name,
        "training_config": {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "weight_decay": args.weight_decay,
            "max_length": 512,
            "padding": "max_length",
            "truncation": True,
            "fp16": use_fp16,
            "bf16": use_bf16,
            "dataloader_workers": dataloader_workers,
        },
        "train_metrics": train_result.metrics,
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
    }

    with open(args.model_dir / "training_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Model saved to: {model_dir}")
    print(f"Tokenizer saved to: {tokenizer_dir}")
    print(f"Training metrics saved to: {args.model_dir / 'training_metrics.json'}")


if __name__ == "__main__":
    main()
