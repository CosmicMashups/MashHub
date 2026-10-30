export type ThemeMode = 'light' | 'dark';

type ThemeScale = {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    base: string;
    elevated: string;
    hover: string;
    selected: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
  };
  accent: {
    primary: string;
    hover: string;
    soft: string;
    contrast: string;
  };
  state: {
    success: string;
    warning: string;
    danger: string;
    info: string;
    hover: string;
    active: string;
    disabled: string;
  };
  fx: {
    focusRing: string;
    cardShadow: string;
    modalShadow: string;
    accentGlow: string;
  };
};

export const theme: Record<ThemeMode, ThemeScale> = {
  light: {
    background: {
      primary: '#f0f4f9',
      secondary: '#e4ecf6',
      tertiary: '#d8e4f2',
    },
    surface: {
      base: '#ffffff',
      elevated: '#ffffff',
      hover: '#f1f6fd',
      selected: '#e2effd',
      overlay: 'rgba(15, 23, 42, 0.55)',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      tertiary: '#64748b',
      disabled: '#94a3b8',
      inverse: '#ffffff',
    },
    border: {
      subtle: '#f1f5f9',
      default: '#e2e8f0',
      strong: '#cbd5e1',
      focus: '#0284c7',
    },
    accent: {
      primary: '#0284c7',
      hover: '#0369a1',
      soft: 'rgba(2, 132, 199, 0.12)',
      contrast: '#ffffff',
    },
    state: {
      success: '#059669',
      warning: '#d97706',
      danger: '#e11d48',
      info: '#0284c7',
      hover: '#e8effa',
      active: '#0369a1',
      disabled: '#cbd5e1',
    },
    fx: {
      focusRing: 'rgba(2, 132, 199, 0.25)',
      cardShadow: '0 10px 30px -18px rgba(2, 132, 199, 0.15)',
      modalShadow: '0 24px 70px -28px rgba(15, 23, 42, 0.35)',
      accentGlow: '0 0 0 3px rgba(2, 132, 199, 0.18)',
    },
  },
  dark: {
    background: {
      primary: '#000b26',
      secondary: '#0a1633',
      tertiary: '#0f2140',
    },
    surface: {
      base: '#121a3a',
      elevated: '#18244a',
      hover: '#1f2f57',
      selected: '#1d3f67',
      overlay: 'rgba(2, 6, 23, 0.72)',
    },
    text: {
      primary: '#e6f0ff',
      secondary: '#a8beda',
      tertiary: '#7d91b0',
      disabled: '#5d6f8a',
      inverse: '#05101f',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      default: 'rgba(182, 212, 255, 0.2)',
      strong: 'rgba(182, 212, 255, 0.35)',
      focus: '#4da6ff',
    },
    accent: {
      primary: '#4da6ff',
      hover: '#66b2ff',
      soft: 'rgba(77, 166, 255, 0.2)',
      contrast: '#031121',
    },
    state: {
      success: '#4cc88f',
      warning: '#f4be5c',
      danger: '#f48787',
      info: '#8bc8ff',
      hover: '#17254a',
      active: '#3b98f4',
      disabled: '#253a58',
    },
    fx: {
      focusRing: 'rgba(77, 166, 255, 0.42)',
      cardShadow: '0 14px 34px -20px rgba(0, 0, 0, 0.68)',
      modalShadow: '0 30px 80px -35px rgba(0, 0, 0, 0.75)',
      accentGlow: '0 0 0 3px rgba(77, 166, 255, 0.24)',
    },
  },
};

export const musicKeyPalette = {
  1: '#0e8d8d',
  2: '#2b96d4',
  3: '#bf4444',
  4: '#4f59bf',
  5: '#a18120',
  6: '#9b5f2a',
  7: '#2b8450',
  8: '#8f3a3a',
  9: '#2f6b9d',
  10: '#be7b2d',
  11: '#7752b6',
  12: '#37a066',
} as const;
