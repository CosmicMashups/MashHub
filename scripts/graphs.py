import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# =========================
# Setup
# =========================
sns.set_theme(style="darkgrid", context="talk")

OUTPUT_DIR = "graphs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# CONSTANTS (from system)
# =========================
BPM_SCORE_DENOMINATOR = 22.5
KEY_MAX_DISTANCE = 6

MATCH_WEIGHT_BPM = 0.45
MATCH_WEIGHT_KEY = 0.45
MATCH_WEIGHT_ARTIST = 0.05
MATCH_WEIGHT_TITLE = 0.05

QUICK_WEIGHT_BPM = 0.45
QUICK_WEIGHT_KEY = 0.45
QUICK_WEIGHT_ARTIST = 0.05
QUICK_WEIGHT_ORIGIN = 0.05

# =========================
# FUNCTIONS
# =========================

# --- Standard BPM (linear decay)
def bpm_standard(diff):
    return np.maximum(0, 1 - diff / BPM_SCORE_DENOMINATOR)

# --- Quick Match BPM (piecewise sigmoid-like)
def bpm_quick(diff):
    result = np.zeros_like(diff)
    for i, d in enumerate(diff):
        if d <= 10:
            result[i] = 1 - 0.02 * d
        else:
            result[i] = max(0, 0.7 - (d - 11) * (0.7 / 9))
    return result

# --- Key similarity (linear semitone decay)
def key_similarity(distance):
    return np.maximum(0, 1 - distance / KEY_MAX_DISTANCE)

# =========================
# PLOTTING HELPERS
# =========================
def save_plot(title, xlabel, ylabel, filename):
    plt.title(title, fontsize=16)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, filename))
    plt.close()

# =========================
# 1. BPM STANDARD GRAPH
# =========================
diff = np.linspace(0, 30, 300)
mu_bpm = bpm_standard(diff)

plt.figure()
plt.plot(diff, mu_bpm)
save_plot(
    "BPM Membership Function (Standard Matching)",
    "BPM Difference",
    "Membership Degree",
    "bpm_standard.png"
)

# =========================
# 2. BPM QUICK MATCH GRAPH
# =========================
diff = np.linspace(0, 25, 300)
mu_bpm_q = bpm_quick(diff)

plt.figure()
plt.plot(diff, mu_bpm_q)
save_plot(
    "BPM Membership Function (Quick Match)",
    "BPM Difference",
    "Membership Degree",
    "bpm_quick.png"
)

# =========================
# 3. KEY SIMILARITY GRAPH
# =========================
dist = np.linspace(0, 6, 300)
mu_key = key_similarity(dist)

plt.figure()
plt.plot(dist, mu_key)
save_plot(
    "Key Similarity Function (Semitone Distance)",
    "Semitone Distance",
    "Similarity",
    "key_similarity.png"
)

# =========================
# 4. STANDARD MATCH SCORE SURFACE
# =========================
bpm_vals = np.linspace(0, 1, 100)
key_vals = np.linspace(0, 1, 100)

BPM, KEY = np.meshgrid(bpm_vals, key_vals)

match_score = (
    BPM * MATCH_WEIGHT_BPM +
    KEY * MATCH_WEIGHT_KEY
)

plt.figure()
cp = plt.contourf(BPM, KEY, match_score, levels=20)
plt.colorbar(cp)
save_plot(
    "Sugeno Output Surface (Standard Matching)",
    "BPM Membership",
    "Key Membership",
    "standard_surface.png"
)

# =========================
# 5. QUICK MATCH SCORE SURFACE
# =========================
match_quick = (
    BPM * QUICK_WEIGHT_BPM +
    KEY * QUICK_WEIGHT_KEY
)

plt.figure()
cp = plt.contourf(BPM, KEY, match_quick, levels=20)
plt.colorbar(cp)
save_plot(
    "Sugeno Output Surface (Quick Match)",
    "BPM Membership",
    "Key Membership",
    "quick_surface.png"
)

# =========================
# 6. FULL RULE CONTRIBUTION BAR (STANDARD)
# =========================
labels = ["BPM", "Key", "Artist", "Title"]
weights = [
    MATCH_WEIGHT_BPM,
    MATCH_WEIGHT_KEY,
    MATCH_WEIGHT_ARTIST,
    MATCH_WEIGHT_TITLE
]

plt.figure()
sns.barplot(x=labels, y=weights)
save_plot(
    "Rule Weights (Standard Matching)",
    "Rule",
    "Weight",
    "weights_standard.png"
)

# =========================
# 7. FULL RULE CONTRIBUTION BAR (QUICK MATCH)
# =========================
labels = ["BPM", "Key", "Artist", "Origin"]
weights = [
    QUICK_WEIGHT_BPM,
    QUICK_WEIGHT_KEY,
    QUICK_WEIGHT_ARTIST,
    QUICK_WEIGHT_ORIGIN
]

plt.figure()
sns.barplot(x=labels, y=weights)
save_plot(
    "Rule Weights (Quick Match)",
    "Rule",
    "Weight",
    "weights_quick.png"
)

# =========================
# 8. FINAL SCORE DISTRIBUTION
# =========================
random_bpm = np.random.rand(1000)
random_key = np.random.rand(1000)

scores = (
    random_bpm * MATCH_WEIGHT_BPM +
    random_key * MATCH_WEIGHT_KEY
)

plt.figure()
sns.histplot(scores, bins=30, kde=True)
save_plot(
    "Match Score Distribution (Standard)",
    "Score",
    "Frequency",
    "score_distribution.png"
)

print("All graphs saved in /graphs/")