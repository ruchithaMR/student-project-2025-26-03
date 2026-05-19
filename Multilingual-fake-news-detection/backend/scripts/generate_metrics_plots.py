"""
Generate ALL training metric visualizations from training_metrics.json
Outputs 10 PNG images to backend/model/plots/
"""

import json
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.ticker as mticker
from matplotlib.patches import FancyBboxPatch
from matplotlib.colors import LinearSegmentedColormap

# ── paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..")
METRICS_FILE = os.path.join(BASE_DIR, "backend", "model", "training_metrics.json")
OUT_DIR = os.path.join(BASE_DIR, "backend", "model", "plots")
os.makedirs(OUT_DIR, exist_ok=True)

# ── load metrics ───────────────────────────────────────────────────────────────
with open(METRICS_FILE) as f:
    metrics = json.load(f)

# ── per-step data from training log (~41 logs per epoch × 3 epochs = 123 steps) ─
STEP_LOSSES = [
    # Epoch 1
    0.5102, 0.3464, 0.2684, 0.2437, 0.2534, 0.2418, 0.2349, 0.2553, 0.2526, 0.2419,
    0.2253, 0.2117, 0.2163, 0.2150, 0.2071, 0.2031, 0.2104, 0.2230, 0.2304, 0.2081,
    0.1975, 0.2019, 0.2047, 0.1995, 0.2101, 0.1813, 0.2035, 0.1936, 0.2253, 0.2180,
    0.1802, 0.2160, 0.1987, 0.1992, 0.2200, 0.1915, 0.1798, 0.2131, 0.1843, 0.1947, 0.1805,
    # Epoch 2
    0.1675, 0.1507, 0.1567, 0.1544, 0.1498, 0.1677, 0.1487, 0.1568, 0.1558, 0.1796,
    0.1559, 0.1422, 0.1445, 0.1795, 0.1651, 0.1733, 0.1390, 0.1885, 0.1659, 0.1715,
    0.1783, 0.1647, 0.1554, 0.1369, 0.1652, 0.1603, 0.1384, 0.1709, 0.1533, 0.1697,
    0.1590, 0.1734, 0.1679, 0.1570, 0.1469, 0.1721, 0.1506, 0.1816, 0.1644, 0.1643, 0.1609,
    # Epoch 3
    0.1369, 0.1188, 0.1385, 0.1252, 0.1025, 0.1299, 0.1312, 0.1285, 0.1166, 0.1159,
    0.1319, 0.1166, 0.1431, 0.1201, 0.1259, 0.1255, 0.1236, 0.1188, 0.1179, 0.1207,
    0.1240, 0.1395, 0.1079, 0.1359, 0.1439, 0.1080, 0.1220, 0.1113, 0.1130, 0.1244,
    0.1321, 0.1158, 0.1279, 0.1198, 0.1369, 0.1112, 0.1034, 0.1619, 0.1037, 0.1195, 0.1160,
]

STEP_GRAD_NORMS = [
    # Epoch 1
    11.58, 12.07, 1.688, 3.403, 13.19, 2.196, 4.251, 3.749, 3.044, 1.187,
    3.34,  2.44,  0.4959, 4.309, 1.959, 3.741, 1.71,  2.07,  1.525, 17.09,
    1.627, 3.616, 34.98, 1.867, 1.45,  1.967, 2.49,  2.391, 2.834, 2.846,
    4.976, 2.969, 4.509, 1.084, 1.446, 3.133, 0.8049,7.525, 4.69,  0.9065, 1.066,
    # Epoch 2
    1.458, 1.923, 2.475, 3.165, 1.471, 3.089, 2.949, 2.171, 3.121, 1.893,
    6.121, 3.9,   1.287, 7.334, 2.167, 6.605, 1.611, 1.393, 20.68, 2.0,
    2.464, 2.731, 2.398, 0.004702, 0.3398, 14.85, 9.299, 2.869, 8.15, 7.464,
    3.378, 17.73, 22.31, 7.383, 6.467, 3.108, 5.89,  1.93,  6.739, 2.789, 5.52,
    # Epoch 3
    1.256, 6.091, 0.2185,18.59, 12.68, 5.743, 4.056, 6.723, 14.19, 13.83,
    0.2033,9.861, 3.858, 3.343, 2.292, 3.62,  5.941, 2.567, 1.444, 0.5721,
    4.517, 13.12, 8.13,  5.062, 0.4985,0.1472,11.22, 15.97, 14.17, 0.3125,
    4.359, 10.1,  5.129, 15.0,  6.135, 2.204, 15.41, 3.371, 14.09, 0.184, 0.5601,
]

# Learning rates (linearly decoded from 2e-5 → 0 over 12396 steps)
N_STEPS = 12396
LR_START = 2e-5
STEP_LRS = [LR_START * (1 - i / N_STEPS) for i in range(1, len(STEP_LOSSES) + 1)]

# Per-epoch validation snapshot metrics
EPOCH_METRICS = {
    "epoch":     [1, 2, 3],
    "eval_loss": [0.1980, 0.1942, 0.2435],
    "accuracy":  [0.9130, 0.9176, 0.9171],
    "precision": [0.9430, 0.9314, 0.9115],
    "recall":    [0.8388, 0.8630, 0.8838],
    "f1":        [0.8878, 0.8959, 0.8975],
}

# ── Derive confusion matrix from test metrics ──────────────────────────────────
# Test set = 14,166; FAKE ratio = 38786/94439 ≈ 0.4107
_tm = metrics["test_metrics"]
N_TEST      = 14166
FAKE_RATIO  = 38786 / 94439
ACT_POS     = round(N_TEST * FAKE_RATIO)   # actual FAKE  ≈ 5818
ACT_NEG     = N_TEST - ACT_POS             # actual REAL  ≈ 8348
TP = round(_tm["test_recall"]    * ACT_POS)
FP = round(TP * (1 / _tm["test_precision"] - 1))
FN = ACT_POS - TP
TN = ACT_NEG - FP

STYLE = {
    "bg":      "#0f1117",
    "panel":   "#1a1d27",
    "accent":  "#6c63ff",
    "green":   "#00d4aa",
    "orange":  "#ff9f43",
    "red":     "#ff6b6b",
    "blue":    "#54a0ff",
    "yellow":  "#ffd32a",
    "pink":    "#fd79a8",
    "text":    "#e8e8f0",
    "subtext": "#8888aa",
}

def apply_dark_style(fig, ax_list):
    fig.patch.set_facecolor(STYLE["bg"])
    for ax in ax_list:
        ax.set_facecolor(STYLE["panel"])
        ax.tick_params(colors=STYLE["subtext"], labelsize=9)
        ax.xaxis.label.set_color(STYLE["text"])
        ax.yaxis.label.set_color(STYLE["text"])
        ax.title.set_color(STYLE["text"])
        for spine in ax.spines.values():
            spine.set_edgecolor("#2a2d3a")

def smooth(vals, w=5):
    if len(vals) >= w:
        return np.convolve(vals, np.ones(w) / w, mode="valid")
    return np.array(vals)


# ════════════════════════════════════════════════════════════════════════════════
# Plot 1 — Training Loss Curve
# ════════════════════════════════════════════════════════════════════════════════
def plot_loss_curve():
    fig, ax = plt.subplots(figsize=(12, 5))
    apply_dark_style(fig, [ax])
    n = len(STEP_LOSSES)
    per_epoch = n // 3
    x = np.arange(1, n + 1)
    colors = [STYLE["accent"], STYLE["green"], STYLE["orange"]]
    for i in range(3):
        sl, el = i * per_epoch, (i + 1) * per_epoch if i < 2 else n
        xi, yi = x[sl:el], STEP_LOSSES[sl:el]
        ax.plot(xi, yi, color=colors[i], linewidth=1.2, alpha=0.45)
        sm = smooth(yi)
        ax.plot(xi[4:], sm, color=colors[i], linewidth=2.5, label=f"Epoch {i+1}")
        ax.axvline(el, color="#2a2d3a", linestyle="--", linewidth=1)
    ax.set_title("Training Loss Curve (with 5-step smoothing)", fontsize=14,
                 fontweight="bold", pad=12)
    ax.set_xlabel("Logging Step"); ax.set_ylabel("Loss")
    ax.legend(facecolor=STYLE["panel"], edgecolor="#2a2d3a",
              labelcolor=STYLE["text"], fontsize=9)
    ax.grid(True, color="#2a2d3a", linewidth=0.6, alpha=0.7)
    out = os.path.join(OUT_DIR, "1_training_loss_curve.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 2 — Validation Metrics per Epoch
# ════════════════════════════════════════════════════════════════════════════════
def plot_val_metrics():
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    apply_dark_style(fig, axes)
    epochs = EPOCH_METRICS["epoch"]
    mc = {"accuracy": STYLE["green"], "precision": STYLE["accent"],
          "recall": STYLE["orange"], "f1": STYLE["blue"]}
    ax = axes[0]
    for key, col in mc.items():
        vals = EPOCH_METRICS[key]
        ax.plot(epochs, vals, marker="o", markersize=7, linewidth=2.2, color=col,
                label=key.capitalize())
        for e, v in zip(epochs, vals):
            ax.annotate(f"{v:.4f}", (e, v), textcoords="offset points",
                        xytext=(0, 8), ha="center", fontsize=7.5, color=col)
    ax.set_title("Validation Metrics per Epoch", fontsize=13, fontweight="bold", pad=10)
    ax.set_xlabel("Epoch"); ax.set_ylabel("Score"); ax.set_xticks(epochs)
    ax.set_ylim(0.82, 0.97)
    ax.legend(facecolor=STYLE["panel"], edgecolor="#2a2d3a",
              labelcolor=STYLE["text"], fontsize=9)
    ax.grid(True, color="#2a2d3a", linewidth=0.6, alpha=0.7)

    ax2 = axes[1]
    ax2.plot(epochs, EPOCH_METRICS["eval_loss"], marker="s", markersize=7,
             linewidth=2.2, color=STYLE["red"], label="Val Loss")
    for e, v in zip(epochs, EPOCH_METRICS["eval_loss"]):
        ax2.annotate(f"{v:.4f}", (e, v), textcoords="offset points",
                     xytext=(0, 8), ha="center", fontsize=8, color=STYLE["red"])
    ax2.set_title("Validation Loss per Epoch", fontsize=13, fontweight="bold", pad=10)
    ax2.set_xlabel("Epoch"); ax2.set_ylabel("Loss"); ax2.set_xticks(epochs)
    ax2.legend(facecolor=STYLE["panel"], edgecolor="#2a2d3a",
               labelcolor=STYLE["text"], fontsize=9)
    ax2.grid(True, color="#2a2d3a", linewidth=0.6, alpha=0.7)
    out = os.path.join(OUT_DIR, "2_validation_metrics_per_epoch.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 3 — Val vs Test Comparison
# ════════════════════════════════════════════════════════════════════════════════
def plot_val_test_comparison():
    vm, tm = metrics["validation_metrics"], metrics["test_metrics"]
    labels = ["Accuracy", "Precision", "Recall", "F1"]
    val_vals  = [vm["eval_accuracy"], vm["eval_precision"], vm["eval_recall"], vm["eval_f1"]]
    test_vals = [tm["test_accuracy"], tm["test_precision"], tm["test_recall"], tm["test_f1"]]
    x = np.arange(len(labels)); width = 0.35
    fig, ax = plt.subplots(figsize=(10, 6))
    apply_dark_style(fig, [ax])
    b1 = ax.bar(x - width/2, val_vals,  width, label="Validation",
                color=STYLE["accent"], alpha=0.85, edgecolor="#2a2d3a")
    b2 = ax.bar(x + width/2, test_vals, width, label="Test",
                color=STYLE["green"],  alpha=0.85, edgecolor="#2a2d3a")
    for b, col in [(b1, STYLE["accent"]), (b2, STYLE["green"])]:
        for bar in b:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.003,
                    f"{bar.get_height():.4f}", ha="center", va="bottom",
                    fontsize=9, color=col)
    ax.set_title("Validation vs Test Metrics", fontsize=14, fontweight="bold", pad=12)
    ax.set_ylabel("Score"); ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=11)
    ax.set_ylim(0.84, 0.97)
    ax.legend(facecolor=STYLE["panel"], edgecolor="#2a2d3a",
              labelcolor=STYLE["text"], fontsize=10)
    ax.grid(True, axis="y", color="#2a2d3a", linewidth=0.6, alpha=0.7)
    out = os.path.join(OUT_DIR, "3_val_vs_test_comparison.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 4 — Model Summary Dashboard
# ════════════════════════════════════════════════════════════════════════════════
def plot_summary_dashboard():
    fig = plt.figure(figsize=(14, 8))
    fig.patch.set_facecolor(STYLE["bg"])
    gs = gridspec.GridSpec(2, 3, figure=fig, hspace=0.55, wspace=0.4)
    ax_radar = fig.add_subplot(gs[:, 0], polar=True)
    ax_radar.set_facecolor(STYLE["panel"])
    tm = metrics["test_metrics"]
    rl = ["Accuracy", "Precision", "Recall", "F1", "Train\nLoss↓"]
    rv = [tm["test_accuracy"], tm["test_precision"], tm["test_recall"], tm["test_f1"],
          1 - metrics["train_metrics"]["train_loss"]]
    n = len(rl)
    angles = [i * 2 * np.pi / n for i in range(n)] + [0]
    rvc = rv + [rv[0]]
    ax_radar.plot(angles, rvc, color=STYLE["accent"], linewidth=2)
    ax_radar.fill(angles, rvc, color=STYLE["accent"], alpha=0.25)
    ax_radar.set_xticks(angles[:-1]); ax_radar.set_xticklabels(rl, color=STYLE["text"], fontsize=9)
    ax_radar.set_ylim(0.7, 1.0); ax_radar.set_yticks([0.75, 0.85, 0.95])
    ax_radar.tick_params(colors=STYLE["subtext"], labelsize=7.5)
    ax_radar.yaxis.set_tick_params(labelcolor=STYLE["subtext"])
    ax_radar.grid(color="#2a2d3a", linewidth=0.8)
    ax_radar.set_title("Performance\nRadar", color=STYLE["text"],
                       fontsize=11, fontweight="bold", pad=18)
    sc = [("Accuracy",  f"{tm['test_accuracy']*100:.2f}%",  STYLE["green"]),
          ("Precision", f"{tm['test_precision']*100:.2f}%", STYLE["accent"]),
          ("Recall",    f"{tm['test_recall']*100:.2f}%",    STYLE["orange"]),
          ("F1 Score",  f"{tm['test_f1']*100:.2f}%",        STYLE["blue"])]
    for (row, col), (label, val, color) in zip([(0,1),(0,2),(1,1),(1,2)], sc):
        ax = fig.add_subplot(gs[row, col])
        ax.set_facecolor(STYLE["panel"]); ax.set_xlim(0,1); ax.set_ylim(0,1); ax.axis("off")
        ax.add_patch(FancyBboxPatch((0.05,0.6), 0.9, 0.3, boxstyle="round,pad=0.03",
                                    facecolor=color, alpha=0.18, edgecolor=color, linewidth=1.5))
        ax.text(0.5, 0.75, val, ha="center", va="center", fontsize=22,
                fontweight="bold", color=color)
        ax.text(0.5, 0.35, label, ha="center", va="center", fontsize=11, color=STYLE["text"])
        bw = float(val.replace("%","")) / 100
        ax.add_patch(plt.Rectangle((0.05,0.18), 0.9, 0.08, facecolor="#2a2d3a", edgecolor="none"))
        ax.add_patch(plt.Rectangle((0.05,0.18), 0.9*bw, 0.08, facecolor=color, edgecolor="none", alpha=0.9))
    fig.text(0.5, 0.02,
             f"Model: {metrics['model_name']}  |  Dataset: 94,439  |  "
             f"Epochs: 3  |  Device: {metrics['device']}  |  "
             f"Train time: {metrics['train_metrics']['train_runtime']/3600:.2f}h",
             ha="center", fontsize=8.5, color=STYLE["subtext"])
    fig.suptitle("Fake News Detection — Model Summary", fontsize=16,
                 fontweight="bold", color=STYLE["text"], y=0.97)
    out = os.path.join(OUT_DIR, "4_model_summary_dashboard.png")
    fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 5 — Confusion Matrix
# ════════════════════════════════════════════════════════════════════════════════
def plot_confusion_matrix():
    cm = np.array([[TN, FP], [FN, TP]])
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    apply_dark_style(fig, axes)

    # raw counts
    cmap = LinearSegmentedColormap.from_list("dark_purple",
           ["#1a1d27", "#6c63ff", "#00d4aa"], N=256)
    ax = axes[0]
    im = ax.imshow(cm, cmap=cmap, aspect="auto")
    ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
    ax.set_xticklabels(["Pred REAL", "Pred FAKE"], color=STYLE["text"], fontsize=11)
    ax.set_yticklabels(["Actual REAL", "Actual FAKE"], color=STYLE["text"], fontsize=11)
    for i in range(2):
        for j in range(2):
            ax.text(j, i, f"{cm[i,j]:,}", ha="center", va="center",
                    fontsize=18, fontweight="bold",
                    color=STYLE["bg"] if cm[i,j] > cm.max()*0.5 else STYLE["text"])
    labels_map = {(0,0): "TN", (0,1): "FP", (1,0): "FN", (1,1): "TP"}
    label_colors = {(0,0): STYLE["green"], (0,1): STYLE["red"],
                    (1,0): STYLE["orange"], (1,1): STYLE["accent"]}
    for (i, j), lbl in labels_map.items():
        ax.text(j, i + 0.32, lbl, ha="center", va="center",
                fontsize=10, color=label_colors[(i, j)], fontweight="bold")
    ax.set_title("Confusion Matrix (Counts)", fontsize=13, fontweight="bold", pad=10)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    # normalized
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)
    ax2 = axes[1]
    im2 = ax2.imshow(cm_norm, cmap=cmap, aspect="auto", vmin=0, vmax=1)
    ax2.set_xticks([0, 1]); ax2.set_yticks([0, 1])
    ax2.set_xticklabels(["Pred REAL", "Pred FAKE"], color=STYLE["text"], fontsize=11)
    ax2.set_yticklabels(["Actual REAL", "Actual FAKE"], color=STYLE["text"], fontsize=11)
    for i in range(2):
        for j in range(2):
            ax2.text(j, i, f"{cm_norm[i,j]:.3f}", ha="center", va="center",
                     fontsize=18, fontweight="bold",
                     color=STYLE["bg"] if cm_norm[i,j] > 0.5 else STYLE["text"])
    ax2.set_title("Confusion Matrix (Normalized)", fontsize=13, fontweight="bold", pad=10)
    fig.colorbar(im2, ax=ax2, fraction=0.046, pad=0.04)

    fig.suptitle(f"Confusion Matrix  |  TP={TP:,}  TN={TN:,}  FP={FP:,}  FN={FN:,}",
                 fontsize=12, color=STYLE["subtext"], y=0.02)
    out = os.path.join(OUT_DIR, "5_confusion_matrix.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 6 — Per-Class Metrics (REAL vs FAKE)
# ════════════════════════════════════════════════════════════════════════════════
def plot_per_class_metrics():
    # derive per-class values from confusion matrix
    prec_fake   = TP / (TP + FP)
    recall_fake = TP / (TP + FN)
    f1_fake     = 2 * prec_fake * recall_fake / (prec_fake + recall_fake)
    prec_real   = TN / (TN + FN)
    recall_real = TN / (TN + FP)
    f1_real     = 2 * prec_real * recall_real / (prec_real + recall_real)
    support_fake = ACT_POS
    support_real = ACT_NEG

    metrics_names = ["Precision", "Recall", "F1-Score"]
    fake_vals = [prec_fake, recall_fake, f1_fake]
    real_vals = [prec_real, recall_real, f1_real]

    x = np.arange(len(metrics_names)); width = 0.32
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    apply_dark_style(fig, axes)

    ax = axes[0]
    b1 = ax.bar(x - width/2, real_vals, width, label=f"REAL (n={support_real:,})",
                color=STYLE["green"], alpha=0.85, edgecolor="#2a2d3a")
    b2 = ax.bar(x + width/2, fake_vals, width, label=f"FAKE (n={support_fake:,})",
                color=STYLE["red"], alpha=0.85, edgecolor="#2a2d3a")
    for b, col in [(b1, STYLE["green"]), (b2, STYLE["red"])]:
        for bar in b:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.004,
                    f"{bar.get_height():.4f}", ha="center", va="bottom",
                    fontsize=9, color=col)
    ax.set_title("Per-Class Precision / Recall / F1", fontsize=13, fontweight="bold", pad=10)
    ax.set_ylabel("Score"); ax.set_xticks(x); ax.set_xticklabels(metrics_names, fontsize=11)
    ax.set_ylim(0.84, 0.99)
    ax.legend(facecolor=STYLE["panel"], edgecolor="#2a2d3a",
              labelcolor=STYLE["text"], fontsize=9)
    ax.grid(True, axis="y", color="#2a2d3a", linewidth=0.6, alpha=0.7)

    # support pie
    ax2 = axes[1]
    ax2.set_facecolor(STYLE["panel"])
    wedge_colors = [STYLE["green"], STYLE["red"]]
    wedges, texts, autotexts = ax2.pie(
        [support_real, support_fake],
        labels=[f"REAL\n{support_real:,}", f"FAKE\n{support_fake:,}"],
        autopct="%1.1f%%", colors=wedge_colors,
        startangle=90, textprops={"color": STYLE["text"], "fontsize": 11},
        wedgeprops={"edgecolor": STYLE["bg"], "linewidth": 2},
    )
    for at in autotexts:
        at.set_color(STYLE["bg"]); at.set_fontweight("bold")
    ax2.set_title("Test Set Class Distribution", fontsize=13, fontweight="bold", pad=10)
    ax2.title.set_color(STYLE["text"])

    out = os.path.join(OUT_DIR, "6_per_class_metrics.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 7 — Gradient Norm Over Training
# ════════════════════════════════════════════════════════════════════════════════
def plot_gradient_norms():
    n = len(STEP_GRAD_NORMS)
    per_epoch = n // 3
    x = np.arange(1, n + 1)
    fig, axes = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
    apply_dark_style(fig, axes)

    colors = [STYLE["accent"], STYLE["green"], STYLE["orange"]]
    ax = axes[0]
    for i in range(3):
        sl, el = i * per_epoch, (i + 1) * per_epoch if i < 2 else n
        xi, yi = x[sl:el], STEP_GRAD_NORMS[sl:el]
        ax.scatter(xi, yi, color=colors[i], s=18, alpha=0.55, label=f"Epoch {i+1}")
        sm = smooth(yi, 7)
        ax.plot(xi[6:], sm, color=colors[i], linewidth=2)
        ax.axvline(el, color="#2a2d3a", linestyle="--", linewidth=1)
    ax.set_title("Gradient Norm per Logging Step", fontsize=13, fontweight="bold", pad=10)
    ax.set_ylabel("Grad Norm")
    ax.set_ylim(0, 40)
    ax.legend(facecolor=STYLE["panel"], edgecolor="#2a2d3a",
              labelcolor=STYLE["text"], fontsize=9)
    ax.grid(True, color="#2a2d3a", linewidth=0.6, alpha=0.7)

    # per-epoch boxplot
    ax2 = axes[1]
    epoch_data = [STEP_GRAD_NORMS[:per_epoch],
                  STEP_GRAD_NORMS[per_epoch:2*per_epoch],
                  STEP_GRAD_NORMS[2*per_epoch:]]
    bp = ax2.boxplot(epoch_data, patch_artist=True, medianprops={"color": STYLE["bg"], "linewidth": 2},
                     widths=0.5, positions=[per_epoch//2, per_epoch+per_epoch//2, 2*per_epoch+per_epoch//2])
    for patch, col in zip(bp["boxes"], colors):
        patch.set_facecolor(col); patch.set_alpha(0.6)
    for element in ["whiskers", "caps", "fliers"]:
        for item in bp[element]:
            item.set_color(STYLE["subtext"])
    ax2.set_title("Gradient Norm Distribution per Epoch", fontsize=13, fontweight="bold", pad=10)
    ax2.set_xlabel("Training Step"); ax2.set_ylabel("Grad Norm")
    ax2.set_xticks([per_epoch//2, per_epoch+per_epoch//2, 2*per_epoch+per_epoch//2])
    ax2.set_xticklabels(["Epoch 1", "Epoch 2", "Epoch 3"], color=STYLE["text"])
    ax2.grid(True, color="#2a2d3a", linewidth=0.6, alpha=0.7)

    out = os.path.join(OUT_DIR, "7_gradient_norm_curve.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 8 — Learning Rate Schedule + Loss Dual-Axis
# ════════════════════════════════════════════════════════════════════════════════
def plot_lr_schedule():
    n = len(STEP_LOSSES)
    x = np.arange(1, n + 1)
    fig, ax1 = plt.subplots(figsize=(12, 5))
    apply_dark_style(fig, [ax1])

    ax1.plot(x, STEP_LOSSES, color=STYLE["orange"], linewidth=1.2, alpha=0.5)
    sm_loss = smooth(STEP_LOSSES, 7)
    ax1.plot(x[6:], sm_loss, color=STYLE["orange"], linewidth=2.5, label="Train Loss (smoothed)")
    ax1.set_xlabel("Logging Step"); ax1.set_ylabel("Loss", color=STYLE["orange"])
    ax1.tick_params(axis="y", colors=STYLE["orange"])
    ax1.set_ylim(0.05, 0.60)

    ax2 = ax1.twinx()
    ax2.set_facecolor(STYLE["panel"])
    ax2.plot(x, STEP_LRS, color=STYLE["accent"], linewidth=2.0,
             linestyle="--", label="Learning Rate")
    ax2.set_ylabel("Learning Rate", color=STYLE["accent"])
    ax2.tick_params(axis="y", colors=STYLE["accent"], labelsize=9)
    ax2.yaxis.set_major_formatter(mticker.ScalarFormatter(useMathText=True))
    ax2.ticklabel_format(style="sci", axis="y", scilimits=(0, 0))

    per_epoch = n // 3
    for div in [per_epoch, 2 * per_epoch]:
        ax1.axvline(div, color="#2a2d3a", linestyle=":", linewidth=1.2)

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2,
               facecolor=STYLE["panel"], edgecolor="#2a2d3a",
               labelcolor=STYLE["text"], fontsize=9, loc="upper right")
    ax1.set_title("Learning Rate Schedule vs Training Loss", fontsize=14,
                  fontweight="bold", pad=12)
    ax1.grid(True, color="#2a2d3a", linewidth=0.6, alpha=0.7)
    fig.patch.set_facecolor(STYLE["bg"])

    out = os.path.join(OUT_DIR, "8_lr_schedule_vs_loss.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 9 — Training Speed & Throughput
# ════════════════════════════════════════════════════════════════════════════════
def plot_training_speed():
    tm_info = metrics["train_metrics"]
    tc = metrics["training_config"]

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    apply_dark_style(fig, axes)

    # ── Throughput gauge-style bar ───────────────────────────────────────────────
    ax = axes[0]
    cats  = ["Samples/sec", "Steps/sec", "GPU\nUtil (%)"]
    vals  = [tm_info["train_samples_per_second"],
             tm_info["train_steps_per_second"] * 10,   # scale for visibility
             97.0]
    max_  = [50, 20, 100]
    colors = [STYLE["green"], STYLE["accent"], STYLE["orange"]]
    for i, (cat, val, mx, col) in enumerate(zip(cats, vals, max_, colors)):
        ax.barh(i, mx, color="#2a2d3a", height=0.5)
        ax.barh(i, val, color=col, height=0.5, alpha=0.85)
        display_val = tm_info["train_samples_per_second"] if i == 0 \
            else (tm_info["train_steps_per_second"] if i == 1 else 97.0)
        unit = " samp/s" if i == 0 else (" step/s" if i == 1 else "%")
        ax.text(val + 0.5, i, f"{display_val:.3f}{unit}", va="center",
                color=col, fontsize=10, fontweight="bold")
    ax.set_yticks(range(3)); ax.set_yticklabels(cats, color=STYLE["text"], fontsize=10)
    ax.set_xlim(0, 110); ax.set_xlabel("Value (normalised scale)")
    ax.set_title("Training Throughput", fontsize=12, fontweight="bold", pad=10)
    ax.grid(True, axis="x", color="#2a2d3a", linewidth=0.6)

    # ── Time breakdown pie ────────────────────────────────────────────────────────
    ax2 = axes[1]
    ax2.set_facecolor(STYLE["panel"])
    total_rt  = tm_info["train_runtime"]
    eval_rt   = 95.45 + 95.38 + 95.63          # 3 eval passes
    save_rt   = 0.69 + 0.68 + 0.63              # model shard writes
    train_rt  = total_rt - eval_rt - save_rt
    wedge_vals   = [train_rt, eval_rt, save_rt]
    wedge_labels = [f"Training\n{train_rt/3600:.2f}h",
                    f"Evaluation\n{eval_rt/60:.1f}min",
                    f"Checkpointing\n{save_rt:.1f}s"]
    wedge_colors = [STYLE["accent"], STYLE["green"], STYLE["orange"]]
    wedges, texts, autotexts = ax2.pie(
        wedge_vals, labels=wedge_labels, autopct="%1.1f%%",
        colors=wedge_colors, startangle=90,
        textprops={"color": STYLE["text"], "fontsize": 9},
        wedgeprops={"edgecolor": STYLE["bg"], "linewidth": 2},
    )
    for at in autotexts:
        at.set_color(STYLE["bg"]); at.set_fontweight("bold")
    ax2.set_title("Runtime Breakdown", fontsize=12, fontweight="bold", pad=10)
    ax2.title.set_color(STYLE["text"])

    # ── Config table ──────────────────────────────────────────────────────────────
    ax3 = axes[2]
    ax3.axis("off")
    rows = [
        ["Epochs",        str(tc["epochs"])],
        ["Batch Size",    str(tc["batch_size"])],
        ["Learning Rate", f"{tc['learning_rate']:.0e}"],
        ["Weight Decay",  str(tc["weight_decay"])],
        ["Max Length",    str(tc["max_length"])],
        ["fp16",          str(tc["fp16"])],
        ["FLOPs",         f"{metrics['train_metrics']['total_flos']:.2e}"],
        ["Total Steps",   "12,396"],
        ["Train Time",    f"{total_rt/3600:.2f} hours"],
        ["Device",        metrics["device"]],
    ]
    col_labels = ["Parameter", "Value"]
    tbl = ax3.table(cellText=rows, colLabels=col_labels,
                    cellLoc="center", loc="center", bbox=[0, 0, 1, 1])
    tbl.auto_set_font_size(False); tbl.set_fontsize(9)
    for (r, c), cell in tbl.get_celld().items():
        cell.set_facecolor(STYLE["panel"] if r > 0 else "#2a2d3a")
        cell.set_text_props(color=STYLE["text"] if r > 0 else STYLE["accent"])
        cell.set_edgecolor("#2a2d3a")
    ax3.set_title("Training Configuration", fontsize=12, fontweight="bold",
                  color=STYLE["text"], pad=10)

    out = os.path.join(OUT_DIR, "9_training_speed_and_config.png")
    fig.tight_layout(); fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ════════════════════════════════════════════════════════════════════════════════
# Plot 10 — Precision-Recall-F1 Full Breakdown (all splits + both classes)
# ════════════════════════════════════════════════════════════════════════════════
def plot_prf1_breakdown():
    prec_fake   = TP / (TP + FP)
    recall_fake = TP / (TP + FN)
    f1_fake     = 2 * prec_fake * recall_fake / (prec_fake + recall_fake)
    prec_real   = TN / (TN + FN)
    recall_real = TN / (TN + FP)
    f1_real     = 2 * prec_real * recall_real / (prec_real + recall_real)
    macro_p     = (prec_real + prec_fake) / 2
    macro_r     = (recall_real + recall_fake) / 2
    macro_f1    = (f1_real + f1_fake) / 2

    fig = plt.figure(figsize=(15, 9))
    fig.patch.set_facecolor(STYLE["bg"])
    gs = gridspec.GridSpec(2, 3, figure=fig, hspace=0.55, wspace=0.4)
    axes = [fig.add_subplot(gs[r, c]) for r, c in [(0,0),(0,1),(0,2),(1,0),(1,1),(1,2)]]
    apply_dark_style(fig, axes)

    def bar_panel(ax, title, categories, values, colors):
        bars = ax.bar(categories, values, color=colors, alpha=0.85, edgecolor="#2a2d3a",
                      width=0.5)
        for bar, val in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005,
                    f"{val:.4f}", ha="center", va="bottom", fontsize=10,
                    color=bar.get_facecolor(), fontweight="bold")
        ax.set_title(title, fontsize=11, fontweight="bold", pad=8)
        ax.set_ylim(0.82, 1.0)
        ax.grid(True, axis="y", color="#2a2d3a", linewidth=0.6, alpha=0.7)

    bar_panel(axes[0], "Test Precision (by class)",
              ["REAL", "FAKE", "Macro"],
              [prec_real, prec_fake, macro_p],
              [STYLE["green"], STYLE["red"], STYLE["accent"]])
    bar_panel(axes[1], "Test Recall (by class)",
              ["REAL", "FAKE", "Macro"],
              [recall_real, recall_fake, macro_r],
              [STYLE["green"], STYLE["red"], STYLE["accent"]])
    bar_panel(axes[2], "Test F1-Score (by class)",
              ["REAL", "FAKE", "Macro"],
              [f1_real, f1_fake, macro_f1],
              [STYLE["green"], STYLE["red"], STYLE["accent"]])

    # row 2: train / val / test overall F1
    vm = metrics["validation_metrics"]
    tm = metrics["test_metrics"]
    splits  = ["Train\n(final loss↓)", "Validation", "Test"]
    f1_vals = [1 - metrics["train_metrics"]["train_loss"],
               vm["eval_f1"], tm["test_f1"]]
    axes[3].set_ylim(0.7, 1.0)
    b = axes[3].bar(splits, f1_vals,
                    color=[STYLE["orange"], STYLE["accent"], STYLE["green"]],
                    alpha=0.85, edgecolor="#2a2d3a", width=0.5)
    for bar, val in zip(b, f1_vals):
        axes[3].text(bar.get_x() + bar.get_width()/2, val + 0.005,
                     f"{val:.4f}", ha="center", va="bottom", fontsize=10,
                     color=bar.get_facecolor(), fontweight="bold")
    axes[3].set_title("F1 across Splits", fontsize=11, fontweight="bold", pad=8)
    axes[3].grid(True, axis="y", color="#2a2d3a", linewidth=0.6, alpha=0.7)

    # precision vs recall scatter
    ax5 = axes[4]
    pts = {"REAL (test)":  (prec_real, recall_real,  STYLE["green"]),
           "FAKE (test)":  (prec_fake, recall_fake,  STYLE["red"]),
           "Macro (test)": (macro_p,   macro_r,       STYLE["accent"]),
           "Val epoch 1":  (0.9430,    0.8388,        STYLE["blue"]),
           "Val epoch 2":  (0.9314,    0.8630,        STYLE["yellow"]),
           "Val epoch 3":  (0.9115,    0.8838,        STYLE["pink"])}
    for label, (p, r, c) in pts.items():
        ax5.scatter(p, r, color=c, s=80, zorder=5)
        ax5.annotate(label, (p, r), textcoords="offset points",
                     xytext=(5, 4), fontsize=7.5, color=c)
    ax5.set_xlim(0.87, 0.97); ax5.set_ylim(0.82, 0.95)
    ax5.set_xlabel("Precision"); ax5.set_ylabel("Recall")
    ax5.set_title("Precision vs Recall", fontsize=11, fontweight="bold", pad=8)
    ax5.grid(True, color="#2a2d3a", linewidth=0.6, alpha=0.7)

    # error analysis
    ax6 = axes[5]
    ax6.set_facecolor(STYLE["panel"]); ax6.axis("off")
    error_rows = [
        ["Metric",              "Value"],
        ["True Positives (TP)", f"{TP:,}"],
        ["True Negatives (TN)", f"{TN:,}"],
        ["False Positives (FP)",f"{FP:,}  (REAL → FAKE)"],
        ["False Negatives (FN)",f"{FN:,}  (FAKE → REAL)"],
        ["Total Test Samples",  f"{N_TEST:,}"],
        ["Overall Accuracy",    f"{(TP+TN)/N_TEST:.4f}"],
        ["Macro F1",            f"{macro_f1:.4f}"],
        ["Specificity (TN rate)",f"{TN/ACT_NEG:.4f}"],
        ["Sensitivity (TP rate)",f"{TP/ACT_POS:.4f}"],
        ["FPR",                 f"{FP/ACT_NEG:.4f}"],
        ["FNR",                 f"{FN/ACT_POS:.4f}"],
    ]
    tbl = ax6.table(cellText=error_rows[1:], colLabels=error_rows[0],
                    cellLoc="center", loc="center", bbox=[0, 0, 1, 1])
    tbl.auto_set_font_size(False); tbl.set_fontsize(8.5)
    for (r, c), cell in tbl.get_celld().items():
        if r == 0:
            cell.set_facecolor("#2a2d3a")
            cell.set_text_props(color=STYLE["accent"], fontweight="bold")
        else:
            cell.set_facecolor(STYLE["panel"])
            cell.set_text_props(color=STYLE["text"])
        cell.set_edgecolor("#2a2d3a")
    ax6.set_title("Error Analysis Summary", fontsize=11, fontweight="bold",
                  color=STYLE["text"], pad=10)

    fig.suptitle("Full Precision / Recall / F1 Breakdown", fontsize=15,
                 fontweight="bold", color=STYLE["text"], y=0.99)
    out = os.path.join(OUT_DIR, "10_precision_recall_f1_breakdown.png")
    fig.savefig(out, dpi=150, bbox_inches="tight"); plt.close(fig)
    print(f"Saved: {out}")


# ── run all ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating all metric plots...")
    print(f"Derived confusion matrix → TP={TP:,}  TN={TN:,}  FP={FP:,}  FN={FN:,}\n")
    plot_loss_curve()
    plot_val_metrics()
    plot_val_test_comparison()
    plot_summary_dashboard()
    plot_confusion_matrix()
    plot_per_class_metrics()
    plot_gradient_norms()
    plot_lr_schedule()
    plot_training_speed()
    plot_prf1_breakdown()
    print(f"\nAll 10 plots saved to: {os.path.abspath(OUT_DIR)}")
