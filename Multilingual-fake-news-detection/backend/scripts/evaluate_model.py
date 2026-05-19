import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast, Trainer, TrainingArguments


class NewsDataset(Dataset):
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


def load_test_data(test_path: Path) -> tuple[list[str], list[int]]:
    df = pd.read_csv(test_path)
    if "text" not in df.columns or "label" not in df.columns:
        raise ValueError(f"Test file {test_path} must contain 'text' and 'label' columns.")

    return df["text"].astype(str).tolist(), df["label"].astype(int).tolist()


def main():
    parser = argparse.ArgumentParser(description="Evaluate trained fake news classifier.")
    parser.add_argument("--data-dir", type=Path, default=Path("backend/training/processed"), help="Path containing test.csv.")
    parser.add_argument("--model-dir", type=Path, default=Path("backend/model"), help="Path containing saved model artifacts.")
    args = parser.parse_args()

    model_path = args.model_dir / "fake_news_model"
    tokenizer_path = args.model_dir / "tokenizer"
    test_path = args.data_dir / "test.csv"

    tokenizer = DistilBertTokenizerFast.from_pretrained(tokenizer_path)
    model = DistilBertForSequenceClassification.from_pretrained(model_path)

    test_texts, test_labels = load_test_data(test_path)
    test_dataset = NewsDataset(test_texts, test_labels, tokenizer)

    eval_args = TrainingArguments(output_dir=str(args.model_dir / "evaluation_runs"), report_to="none")
    trainer = Trainer(model=model, args=eval_args)

    predictions = trainer.predict(test_dataset)
    y_true = np.array(test_labels)
    y_pred = np.argmax(predictions.predictions, axis=1)

    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    accuracy = (tp + tn) / max(len(y_true), 1)

    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "confusion_matrix": [[tn, fp], [fn, tp]],
    }

    output_file = args.model_dir / "evaluation_metrics.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(json.dumps(metrics, indent=2))
    print(f"Evaluation metrics saved to: {output_file}")


if __name__ == "__main__":
    main()
