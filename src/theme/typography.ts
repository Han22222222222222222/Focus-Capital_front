import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    thin: 'SF Pro Display',
    light: 'SF Pro Display',
    regular: 'SF Pro Text',
    medium: 'SF Pro Text',
    semibold: 'SF Pro Display',
    bold: 'SF Pro Display',
    mono: 'SF Mono',
  },
  default: {
    thin: undefined,
    light: undefined,
    regular: undefined,
    medium: undefined,
    semibold: undefined,
    bold: undefined,
    mono: 'monospace',
  },
});

export const Typography = {
  // Display
  display: {
    fontSize: 48,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -1.5,
    lineHeight: 52,
    fontFamily: fontFamily?.bold,
  },
  displayLg: {
    fontSize: 64,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -2,
    lineHeight: 68,
    fontFamily: fontFamily?.bold,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -1,
    lineHeight: 36,
    fontFamily: fontFamily?.bold,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    lineHeight: 28,
    fontFamily: fontFamily?.semibold,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
    lineHeight: 22,
    fontFamily: fontFamily?.semibold,
  },

  // Body
  body: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.1,
    lineHeight: 20,
    fontFamily: fontFamily?.regular,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
    lineHeight: 18,
    fontFamily: fontFamily?.regular,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: -0.1,
    lineHeight: 20,
    fontFamily: fontFamily?.medium,
  },

  // Labels
  label: {
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
    lineHeight: 14,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    fontFamily: fontFamily?.medium,
  },
  labelLg: {
    fontSize: 12,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.8,
    lineHeight: 16,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    fontFamily: fontFamily?.semibold,
  },

  // Numbers / Mono (for financial data)
  numXl: {
    fontSize: 40,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -1.5,
    lineHeight: 44,
    fontFamily: fontFamily?.mono,
  },
  numLg: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -1,
    lineHeight: 32,
    fontFamily: fontFamily?.mono,
  },
  num: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    lineHeight: 24,
    fontFamily: fontFamily?.mono,
  },
  numSm: {
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0,
    lineHeight: 18,
    fontFamily: fontFamily?.mono,
  },
  numXs: {
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0,
    lineHeight: 14,
    fontFamily: fontFamily?.mono,
  },
} as const;
