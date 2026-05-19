/**
 * HeatMap — 7×24 grid showing focus intensity by day and hour.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FText } from '../common/FText';
import { Colors } from '../../theme';

interface HeatMapProps {
  data: number[][];   // [day][hour] 0–100
  days?: string[];
}

const HOURS = ['0', '3', '6', '9', '12', '15', '18', '21'];
const HOUR_INDICES = [0, 3, 6, 9, 12, 15, 18, 21];

function valueToColor(v: number): string {
  if (v >= 80) return Colors.accent.primary;
  if (v >= 60) return 'rgba(0, 212, 255, 0.5)';
  if (v >= 40) return 'rgba(0, 212, 255, 0.25)';
  if (v >= 20) return 'rgba(0, 212, 255, 0.1)';
  return Colors.bg.elevated;
}

export function HeatMap({
  data,
  days = ['일', '월', '화', '수', '목', '금', '토'],
}: HeatMapProps) {
  return (
    <View style={styles.container}>
      {/* Hour axis */}
      <View style={styles.hourAxis}>
        <View style={styles.dayLabelSpacer} />
        {HOUR_INDICES.map((h, i) => (
          <FText key={i} variant="numXs" color={Colors.text.tertiary} style={styles.hourLabel}>
            {HOURS[i]}
          </FText>
        ))}
      </View>

      {/* Rows */}
      {data.map((dayData, di) => (
        <View key={di} style={styles.row}>
          <FText variant="numXs" color={Colors.text.tertiary} style={styles.dayLabel}>
            {days[di]}
          </FText>
          <View style={styles.cells}>
            {dayData.map((v, hi) => (
              <View
                key={hi}
                style={[styles.cell, { backgroundColor: valueToColor(v) }]}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 3,
  },
  hourAxis: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayLabelSpacer: {
    width: 20,
    marginRight: 4,
  },
  hourLabel: {
    flex: 3,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    width: 20,
    textAlign: 'right',
  },
  cells: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    flex: 1,
    height: 10,
    borderRadius: 2,
  },
});
