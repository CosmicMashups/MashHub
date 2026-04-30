import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.optimize import curve_fit

# =========================
# Setup
# =========================
sns.set_theme(style="darkgrid", context="talk")
# Get colors from the 'rocket' palette
rocket_colors = sns.color_palette("rocket", n_colors=5)
line_color = rocket_colors[1]
marker_color = rocket_colors[3]

OUTPUT_DIR = "graphs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# Sigmoid Function
# =========================
def sigmoid(x, L, k, x0):
    return L / (1 + np.exp(k * (x - x0)))

# =========================
# ORIGINAL RULE DATA (positive side only)
# =========================

# BPM
bpm_diff = np.array([0, 5, 10, 12, 20])
mu_bpm = np.array([1.0, 0.9, 0.8, 0.7, 0.0])

# Key
key_dist = np.array([0, 1, 2, 3, 6])
mu_key = np.array([1.0, 0.95, 0.9, 0.8, 0.0])

# =========================
# Fit sigmoid to positive domain
# =========================
params_bpm, _ = curve_fit(sigmoid, bpm_diff, mu_bpm, p0=[1, 0.25, 10])
params_key, _ = curve_fit(sigmoid, key_dist, mu_key, p0=[1, 1.0, 3])

# =========================
# MIRRORED DOMAIN
# =========================
x_bpm = np.linspace(-30, 30, 600)
x_key = np.linspace(-6, 6, 600)

y_bpm = sigmoid(np.abs(x_bpm), *params_bpm)
y_key = sigmoid(np.abs(x_key), *params_key)

# =========================
# Sugeno outputs
# =========================
WEIGHT = 0.45
z_bpm = y_bpm * WEIGHT
z_key = y_key * WEIGHT

# =========================
# Helper function
# =========================
def save_plot(title, xlabel, ylabel, filename):
    plt.title(title, fontsize=16, weight='bold')
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, filename))
    plt.close()

# Marker settings for consistency
MARKER_SIZE = 200
MARKER_WEIGHT = 4  # This increases the thickness of the 'x'

# =========================
# 1. BPM Membership (Mirrored)
# =========================
plt.figure()
sns.lineplot(x=x_bpm, y=y_bpm, linewidth=3, color=line_color)

sns.scatterplot(
    x=np.concatenate([bpm_diff, -bpm_diff]),
    y=np.concatenate([mu_bpm, mu_bpm]),
    marker="x",
    s=MARKER_SIZE,
    linewidth=MARKER_WEIGHT,
    color=marker_color
)

save_plot("BPM: Membership Function", "BPMs", "μ_bpm_pair", "bpm_mf.png")

# =========================
# 2. BPM Sugeno Output
# =========================
plt.figure()
sns.lineplot(x=x_bpm, y=z_bpm, linewidth=3, color=line_color)

sns.scatterplot(
    x=np.concatenate([bpm_diff, -bpm_diff]),
    y=np.concatenate([mu_bpm * WEIGHT, mu_bpm * WEIGHT]),
    marker="x",
    s=MARKER_SIZE,
    linewidth=MARKER_WEIGHT,
    color=marker_color
)

save_plot("BPM: Output", "BPMs", "z_bpm_pair", "bpm_output.png")

# =========================
# 3. Key Membership (Mirrored)
# =========================
plt.figure()
sns.lineplot(x=x_key, y=y_key, linewidth=3, color=line_color)

sns.scatterplot(
    x=np.concatenate([key_dist, -key_dist]),
    y=np.concatenate([mu_key, mu_key]),
    marker="x",
    s=MARKER_SIZE,
    linewidth=MARKER_WEIGHT,
    color=marker_color
)

save_plot("Key: Membership Function", "Semitones", "μ_key", "key_mf.png")

# =========================
# 4. Key Sugeno Output
# =========================
plt.figure()
sns.lineplot(x=x_key, y=z_key, linewidth=3, color=line_color)

sns.scatterplot(
    x=np.concatenate([key_dist, -key_dist]),
    y=np.concatenate([mu_key * WEIGHT, mu_key * WEIGHT]),
    marker="x",
    s=MARKER_SIZE,
    linewidth=MARKER_WEIGHT,
    color=marker_color
)

save_plot("Key: Output", "Semitones", "z_key", "key_output.png")

print("Graphs updated with weighted markers and saved in /graphs/")