/**
 * SparkLine — animated SVG line chart for Focus Index.
 * Uses react-native-svg for rendering, Animated for value transitions.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Line } from 'react-native-svg';
import { Colors } from '../../theme';

interface SparkLineProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
  showGradient?: boolean;
  showGrid?: boolean;
}

function buildPath(data: number[], width: number, height: number): string {
  if (data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = height * 0.1;
  const usableH = height - pad * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + usableH - ((v - min) / range) * usableH;
    return { x, y };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1].x + points[i].x) / 2;
    d += ` C ${cpx} ${points[i - 1].y}, ${cpx} ${points[i].y}, ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function buildFillPath(data: number[], width: number, height: number): string {
  const line = buildPath(data, width, height);
  if (!line) return '';
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

export function SparkLine({
  data,
  width,
  height,
  color = Colors.chart.line,
  showGradient = true,
  showGrid = false,
}: SparkLineProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const linePath = buildPath(data, width, height);
  const fillPath = buildFillPath(data, width, height);

  const gridLines = showGrid ? [0.25, 0.5, 0.75] : [];

  return (
    <Animated.View style={{ opacity, width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {gridLines.map((fraction, idx) => (
          <Line
            key={idx}
            x1={0}
            y1={height * fraction}
            x2={width}
            y2={height * fraction}
            stroke={Colors.chart.grid}
            strokeWidth={1}
          />
        ))}

        {showGradient && (
          <Path d={fillPath} fill="url(#sparkFill)" />
        )}

        <Path
          d={linePath}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}
