import argparse
import json
import re
from pathlib import Path
from typing import Dict, Tuple

import pandas as pd


LIAR_LABEL_MAP: Dict[str, int] = {
    "pants-fire": 1,
    "false": 1,
    "barely-true": 1,
    "half-true": 0,
    "mostly-true": 0,
    "true": 0,
}


def normalize_whitespace(text: str) -> str:
    """Collapse repeated whitespace and trim boundaries."""
    return re.sub(r"\s+", " ", text).strip()


def combine_text_columns(df: pd.DataFrame, columns: list[str]) -> pd.Series:
    """Combine text columns with a safe fallback to title when text is empty.

    Behavior:
    - If both title and text exist and text is empty, use title.
    - If both exist and both have content, concatenate title + text.
    - If requested columns do not exist, return empty strings.
    """
    available = [col for col in columns if col in df.columns]
    if not available:
        return pd.Series([""] * len(df), index=df.index)

    # Explicit title/text fallback improves handling for FakeNewsNet rows that
    # commonly contain only title.
    if "title" in available and "text" in available:
        title = df["title"].fillna("").astype(str).map(normalize_whitespace)
        text = df["text"].fillna("").astype(str).map(normalize_whitespace)
        merged = pd.Series(index=df.index, dtype=str)

        text_empty = text.str.len() == 0
        title_empty = title.str.len() == 0

        merged[text_empty & (~title_empty)] = title[text_empty & (~title_empty)]
        merged[(~text_empty) & title_empty] = text[(~text_empty) & title_empty]
        merged[(~text_empty) & (~title_empty)] = (title[(~text_empty) & (~title_empty)] + " " + text[(~text_empty) & (~title_empty)]).map(normalize_whitespace)
        merged[text_empty & title_empty] = ""
        return merged.fillna("")

    merged = df[available].fillna("").astype(str).agg(" ".join, axis=1)
    return merged.map(normalize_whitespace)


def ensure_file_exists(path: Path) -> None:
    """Raise a clear error when a required dataset file is missing."""
    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Required file not found: {path}")


def load_isot(data_dir: Path) -> pd.DataFrame:
    """Load ISOT fake/true CSVs into unified schema."""
    fake_path = data_dir / "Fake.csv"
    true_path = data_dir / "True.csv"
    ensure_file_exists(fake_path)
    ensure_file_exists(true_path)

    fake_df = pd.read_csv(fake_path)
    true_df = pd.read_csv(true_path)

    fake_df = pd.DataFrame(
        {
            "text": combine_text_columns(fake_df, ["title", "text"]),
            "label": 1,
            "source": "isot_fake",
        }
    )
    true_df = pd.DataFrame(
        {
            "text": combine_text_columns(true_df, ["title", "text"]),
            "label": 0,
            "source": "isot_true",
        }
    )

    return pd.concat([fake_df, true_df], ignore_index=True)


def load_fakenewsnet(data_dir: Path) -> pd.DataFrame:
    """Load FakeNewsNet gossipcop/politifact files into unified schema."""
    files_and_labels = [
        ("gossipcop_fake.csv", 1, "fakenewsnet_gossipcop_fake"),
        ("gossipcop_real.csv", 0, "fakenewsnet_gossipcop_real"),
        ("politifact_fake.csv", 1, "fakenewsnet_politifact_fake"),
        ("politifact_real.csv", 0, "fakenewsnet_politifact_real"),
    ]

    frames = []
    for filename, label, source in files_and_labels:
        file_path = data_dir / filename
        ensure_file_exists(file_path)
        df = pd.read_csv(file_path)
        text_series = combine_text_columns(df, ["title", "text"])
        frames.append(pd.DataFrame({"text": text_series, "label": label, "source": source}))

    return pd.concat(frames, ignore_index=True)


def load_welfake(data_dir: Path) -> pd.DataFrame:
    """Load WELFake with explicit label-column detection."""
    file_path = data_dir / "WELFake_Dataset.csv"
    ensure_file_exists(file_path)
    df = pd.read_csv(file_path)

    text_series = combine_text_columns(df, ["title", "text"])

    if "label" in df.columns:
        label_col = "label"
    elif "fake" in df.columns:
        label_col = "fake"
    else:
        raise ValueError("No label column found in WELFake dataset")

    return pd.DataFrame(
        {
            "text": text_series,
            "label": pd.to_numeric(df[label_col], errors="coerce"),
            "source": "welfake",
        }
    )


def load_liar(data_dir: Path) -> pd.DataFrame:
    """Load LIAR train/valid/test TSV files and map textual labels to binary."""
    liar_dir = data_dir / "liar_dataset"
    split_files = ["train.tsv", "valid.tsv", "test.tsv"]

    if not liar_dir.exists() or not liar_dir.is_dir():
        raise FileNotFoundError(f"Required directory not found: {liar_dir}")

    columns = [
        "id",
        "label_text",
        "statement",
        "subjects",
        "speaker",
        "speaker_job_title",
        "state_info",
        "party_affiliation",
        "barely_true_counts",
        "false_counts",
        "half_true_counts",
        "mostly_true_counts",
        "pants_on_fire_counts",
        "context",
    ]

    frames = []
    for split in split_files:
        split_path = liar_dir / split
        ensure_file_exists(split_path)
        df = pd.read_csv(
            split_path,
            sep="\t",
            header=None,
            names=columns,
            dtype=str,
        )
        mapped_labels = df["label_text"].map(LIAR_LABEL_MAP)
        frames.append(
            pd.DataFrame(
                {
                    "text": df["statement"].fillna(""),
                    "label": mapped_labels,
                    "source": f"liar_{split.replace('.tsv', '')}",
                }
            )
        )

    return pd.concat(frames, ignore_index=True)


def clean_dataset(df: pd.DataFrame, min_length: int = 50) -> pd.DataFrame:
    """Clean merged dataset with source-aware minimum text lengths.

    Rules:
    - Remove null rows
    - Normalize whitespace
    - Keep labels in {0, 1}
    - Apply min length 10 for LIAR sources, 50 for other sources
    - Remove duplicates on text
    """
    cleaned = df.copy()
    cleaned = cleaned.dropna(subset=["text", "label"])  # remove null rows first

    cleaned["text"] = cleaned["text"].astype(str).map(normalize_whitespace)
    cleaned["label"] = pd.to_numeric(cleaned["label"], errors="coerce")
    cleaned = cleaned.dropna(subset=["label"])
    cleaned["label"] = cleaned["label"].astype(int)

    cleaned = cleaned[cleaned["label"].isin([0, 1])]

    text_len = cleaned["text"].str.len()
    liar_mask = cleaned["source"].astype(str).str.startswith("liar")
    cleaned = cleaned[(liar_mask & (text_len >= 10)) | ((~liar_mask) & (text_len >= min_length))]

    cleaned = cleaned.drop_duplicates(subset=["text"]).reset_index(drop=True)

    return cleaned


def split_dataset(df: pd.DataFrame, seed: int) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Create stratified 70/15/15 split by label."""
    # Stratify manually by splitting each class with fixed proportions.
    train_parts = []
    val_parts = []
    test_parts = []

    for _, group in df.groupby("label", sort=False):
        group = group.sample(frac=1.0, random_state=seed).reset_index(drop=True)
        n = len(group)

        n_train = int(round(n * 0.70))
        n_val = int(round(n * 0.15))
        n_test = n - n_train - n_val

        if n_test < 0:
            n_test = 0
            n_val = n - n_train

        train_parts.append(group.iloc[:n_train])
        val_parts.append(group.iloc[n_train : n_train + n_val])
        test_parts.append(group.iloc[n_train + n_val : n_train + n_val + n_test])

    train_df = pd.concat(train_parts, ignore_index=True).sample(frac=1.0, random_state=seed)
    val_df = pd.concat(val_parts, ignore_index=True).sample(frac=1.0, random_state=seed)
    test_df = pd.concat(test_parts, ignore_index=True).sample(frac=1.0, random_state=seed)

    return train_df.reset_index(drop=True), val_df.reset_index(drop=True), test_df.reset_index(drop=True)


def save_outputs(df: pd.DataFrame, train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame, output_dir: Path):
    """Persist processed datasets and summary statistics to disk."""
    output_dir.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_dir / "full_dataset.csv", index=False)
    train_df.to_csv(output_dir / "train.csv", index=False)
    val_df.to_csv(output_dir / "val.csv", index=False)
    test_df.to_csv(output_dir / "test.csv", index=False)

    text_lengths = df["text"].astype(str).str.len()
    stats = {
        "full_rows": len(df),
        "train_rows": len(train_df),
        "val_rows": len(val_df),
        "test_rows": len(test_df),
        "average_text_length": float(text_lengths.mean()) if len(text_lengths) else 0.0,
        "median_text_length": float(text_lengths.median()) if len(text_lengths) else 0.0,
        "max_text_length": int(text_lengths.max()) if len(text_lengths) else 0,
        "min_text_length": int(text_lengths.min()) if len(text_lengths) else 0,
        "label_distribution": {
            "full": df["label"].value_counts().to_dict(),
            "train": train_df["label"].value_counts().to_dict(),
            "val": val_df["label"].value_counts().to_dict(),
            "test": test_df["label"].value_counts().to_dict(),
        },
        "sources": df["source"].value_counts().to_dict(),
    }

    with open(output_dir / "dataset_stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)


def report_balance(df: pd.DataFrame) -> None:
    """Print label distribution and warn if imbalance exceeds 70/30."""
    total = len(df)
    real_count = int((df["label"] == 0).sum())
    fake_count = int((df["label"] == 1).sum())

    ratio = (real_count / fake_count) if fake_count > 0 else float("inf")
    majority_fraction = max(real_count, fake_count) / total if total > 0 else 0.0

    print("Label distribution after cleaning (before split):")
    print(f"  Total samples: {total}")
    print(f"  REAL (0): {real_count}")
    print(f"  FAKE (1): {fake_count}")
    if fake_count > 0:
        print(f"  Real/Fake ratio: {ratio:.4f}")
    else:
        print("  Real/Fake ratio: inf (no fake samples)")

    if majority_fraction > 0.70:
        print("WARNING: Dataset imbalance exceeds 70/30. Consider rebalancing in a future step.")


def print_dataset_sizes(title: str, sizes: Dict[str, int]) -> None:
    """Print per-source row counts in a consistent debug format."""
    print(title)
    for source_name, count in sizes.items():
        print(f"  {source_name}: {count}")


def main():
    """Load, clean, split, and persist all datasets for model training."""
    parser = argparse.ArgumentParser(description="Prepare and split fake news datasets.")
    parser.add_argument("--data-dir", type=Path, default=Path("backend/data"), help="Path to raw data directory.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("backend/training/processed"),
        help="Path to save cleaned and split datasets.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    args = parser.parse_args()

    if not args.data_dir.exists() or not args.data_dir.is_dir():
        raise FileNotFoundError(f"Data directory not found: {args.data_dir}")

    isot_df = load_isot(args.data_dir)
    fakenewsnet_df = load_fakenewsnet(args.data_dir)
    welfake_df = load_welfake(args.data_dir)
    liar_df = load_liar(args.data_dir)

    before_sizes = {
        "isot": len(isot_df),
        "fakenewsnet": len(fakenewsnet_df),
        "welfake": len(welfake_df),
        "liar": len(liar_df),
    }
    print_dataset_sizes("Dataset sizes before cleaning:", before_sizes)

    merged_df = pd.concat([isot_df, fakenewsnet_df, welfake_df, liar_df], ignore_index=True)
    cleaned_df = clean_dataset(merged_df, min_length=50)

    after_sizes = {str(k): int(v) for k, v in cleaned_df["source"].value_counts().to_dict().items()}
    print_dataset_sizes("Dataset sizes after cleaning (by source):", after_sizes)
    print(f"Final dataset size: {len(cleaned_df)}")

    report_balance(cleaned_df)

    if len(cleaned_df) < 1000:
        raise ValueError("Cleaned dataset is too small. Verify file paths and source schema.")

    train_df, val_df, test_df = split_dataset(cleaned_df, seed=args.seed)
    save_outputs(cleaned_df, train_df, val_df, test_df, args.output_dir)

    print(f"Prepared dataset saved to: {args.output_dir}")
    print(f"Train/Val/Test sizes: {len(train_df)} / {len(val_df)} / {len(test_df)}")


if __name__ == "__main__":
    main()
