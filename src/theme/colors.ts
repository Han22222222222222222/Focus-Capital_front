export const Colors = {
  // Backgrounds
  bg: {
    primary: '#080808',
    secondary: '#0F0F0F',
    tertiary: '#141414',
    card: '#111111',
    cardAlt: '#161616',
    elevated: '#1A1A1A',
    overlay: 'rgba(0,0,0,0.85)',
  },

  // Typography
  text: {
    primary: '#F5F5F5',
    secondary: '#A0A0A0',
    tertiary: '#5A5A5A',
    muted: '#3A3A3A',
    inverse: '#080808',
  },

  // Accent — Neon Blue
  accent: {
    primary: '#00D4FF',
    dim: '#0099BB',
    glow: 'rgba(0, 212, 255, 0.15)',
    glowStrong: 'rgba(0, 212, 255, 0.30)',
    subtle: 'rgba(0, 212, 255, 0.08)',
  },

  // Market colors
  market: {
    bullish: '#26D07C',       // muted green
    bullishDim: '#1A8F56',
    bullishGlow: 'rgba(38, 208, 124, 0.12)',
    bearish: '#FF4D4D',       // muted red
    bearishDim: '#B33535',
    bearishGlow: 'rgba(255, 77, 77, 0.12)',
    neutral: '#6B7280',
  },

  // Semantic
  dopamine: '#B857F5',        // purple for dopamine spikes
  dopamineGlow: 'rgba(184, 87, 245, 0.15)',
  recovery: '#26D07C',
  volatility: '#F59E0B',
  volatilityGlow: 'rgba(245, 158, 11, 0.15)',

  // Borders
  border: {
    subtle: 'rgba(255,255,255,0.05)',
    default: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.14)',
    accent: 'rgba(0, 212, 255, 0.25)',
  },

  // Chart
  chart: {
    line: '#00D4FF',
    lineDim: 'rgba(0, 212, 255, 0.4)',
    fill: 'rgba(0, 212, 255, 0.06)',
    grid: 'rgba(255,255,255,0.04)',
    label: '#5A5A5A',
  },
} as const;

export type ColorToken = typeof Colors;
