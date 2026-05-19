import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { Colors, Typography } from '../../theme';

type Variant = keyof typeof Typography;

interface FTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  mono?: boolean;
}

export function FText({
  variant = 'body',
  color = Colors.text.primary,
  style,
  mono,
  children,
  ...rest
}: FTextProps) {
  const base = Typography[variant] as TextStyle;

  return (
    <Text
      style={[
        base,
        { color },
        mono ? { fontFamily: 'SF Mono' } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
