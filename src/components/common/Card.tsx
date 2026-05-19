import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'accent' | 'market-bull' | 'market-bear';
  padding?: number;
}

export function Card({
  variant = 'default',
  padding = Spacing.base,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[styles.base, styles[variant], { padding }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  default: {
    backgroundColor: Colors.bg.card,
    borderColor: Colors.border.subtle,
  },
  elevated: {
    backgroundColor: Colors.bg.elevated,
    borderColor: Colors.border.default,
  },
  accent: {
    backgroundColor: Colors.bg.card,
    borderColor: Colors.border.accent,
  },
  'market-bull': {
    backgroundColor: Colors.market.bullishGlow,
    borderColor: 'rgba(38, 208, 124, 0.2)',
  },
  'market-bear': {
    backgroundColor: Colors.market.bearishGlow,
    borderColor: 'rgba(255, 77, 77, 0.2)',
  },
});
