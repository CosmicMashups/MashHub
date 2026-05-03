import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# =========================
# Setup
# =========================
sns.set_theme(
    style="darkgrid",
    context="talk",
    font_scale=1.1
)

OUTPUT_DIR = "graphs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# Data
# =========================
labels = ["BPM", "Key", "Artist", "Title"]
weights = [0.45, 0.45, 0.05, 0.05]

# =========================
# Figure Setup
# =========================
plt.figure(figsize=(10, 6))

# Rocket palette (gradient for emphasis)
palette = sns.color_palette("rocket", len(labels))

# =========================
# Bar Plot
# =========================
ax = sns.barplot(
    x=labels,
    y=weights,
    palette=palette,
    edgecolor="black",
    linewidth=1.5
)

# =========================
# Annotations (values on bars)
# =========================
for i, value in enumerate(weights):
    ax.text(
        i,
        value + 0.015,
        f"{value:.2f}",
        ha='center',
        va='bottom',
        fontsize=12,
        fontweight='bold'
    )

# =========================
# Styling Enhancements
# =========================
ax.set_title(
    "Matching: Rule Weights",
    fontsize=18,
    fontweight='bold',
    pad=15
)

ax.set_xlabel("Fuzzy Rule", fontsize=14, labelpad=10)
ax.set_ylabel("Weight Contribution", fontsize=14, labelpad=10)

# Improve y-axis scaling
ax.set_ylim(0, 0.5)

# Remove top/right spines for cleaner look
sns.despine()

# Grid styling
ax.grid(True, linestyle="--", alpha=0.4)

# =========================
# Save
# =========================
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "rule_weights.png"), dpi=300)
plt.close()

print("Enhanced graph saved in /graphs/rule_weights.png")