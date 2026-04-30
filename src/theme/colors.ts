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
      primary: '#f7f5f2',
      secondary: '#efece6',
      tertiary: '#e7e2d8',
    },
    surface: {
      base: '#fffdf9',
      elevated: '#ffffff',
      hover: '#f8f4ee',
      selected: '#dce8f6',
      overlay: 'rgba(16, 24, 40, 0.45)',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#434343',
      tertiary: '#6e6e6e',
      disabled: '#9b9b9b',
      inverse: '#f8fbff',
    },
    border: {
      subtle: '#ece7dd',
      default: '#ddd7cb',
      strong: '#c6beaf',
      focus: '#1e3a5f',
    },
    accent: {
      primary: '#1e3a5f',
      hover: '#2a4c7b',
      soft: '#d6e1ee',
      contrast: '#f6f9ff',
    },
    state: {
      success: '#1f7a4b',
      warning: '#946200',
      danger: '#b33b3b',
      info: '#24588b',
      hover: '#f2ede4',
      active: '#18314f',
      disabled: '#d5d1c8',
    },
    fx: {
      focusRing: 'rgba(30, 58, 95, 0.28)',
      cardShadow: '0 10px 30px -18px rgba(28, 34, 51, 0.22)',
      modalShadow: '0 24px 70px -28px rgba(16, 24, 40, 0.35)',
      accentGlow: '0 0 0 3px rgba(30, 58, 95, 0.16)',
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
