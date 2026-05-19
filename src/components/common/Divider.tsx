import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

export function Divider({ vertical = false }: { vertical?: boolean }) {
  return (
    <View
      style={[
        styles.base,
        vertical ? styles.vertical : styles.horizontal,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.border.subtle,
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
