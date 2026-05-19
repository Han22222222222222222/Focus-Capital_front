/**
 * MiniBar — compact bar chart (7-day weekly bars).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../theme';
import { FText } from '../common/FText';

interface MiniBarProps {
  data: number[];       // 0–100
  labels?: string[];
  highlightIndex?: number;
  height?: number;
  color?: string;
}

export function MiniBar({
  data,
  labels,
  highlightIndex,
  height = 48,
  color = Colors.accent.primary,
}: MiniBarProps) {
  const max = Math.max(...data, 1);

  return (
    <View style={styles.container}>
      {data.map((value, i) => {
        const barH = Math.max(3, (value / max) * height);
        const isHighlight = i === highlightIndex;
        const c = isHighlight ? color : Colors.text.muted;

        return (
          <View key={i} style={[styles.col, { height: height + 16 }]}>
            <View style={[styles.barWrapper, { height }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barH,
                    backgroundColor: c,
                    opacity: isHighlight ? 1 : 0.3,
                  },
                ]}
              />
            </View>
            {labels && (
              <FText
                variant="numXs"
                color={isHighlight ? Colors.text.secondary : Colors.text.tertiary}
                style={styles.label}
              >
                {labels[i]}
              </FText>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '70%',
    borderRadius: 3,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
});
