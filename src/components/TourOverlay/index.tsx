import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../theme';
import { FText } from '../common/FText';

const { width: SW, height: SH } = Dimensions.get('screen');
const PAD = 10;

export interface TourRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStep {
  rect: TourRect;
  title: string;
  body: string;
  spotRadius?: number;
}

interface Props {
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

export function TourOverlay({ steps, currentStep, onNext, onSkip }: Props) {
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const visible = currentStep >= 0 && currentStep < steps.length;

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [currentStep, visible]);

  if (!visible) return null;

  const { rect, title, body, spotRadius = 12 } = steps[currentStep];

  const TAB_BAR_H = 64 + safeBottom; // tab bar pill height + device safe area
  const SAFE_BOTTOM = SH - TAB_BAR_H;

  const sx = Math.max(0, rect.x - PAD);
  const sy = Math.max(0, rect.y - PAD);
  const sw = Math.min(SW - sx, rect.width + PAD * 2);
  const rawHeight = rect.height + PAD * 2;
  const sh = Math.max(0, Math.min(rawHeight, SAFE_BOTTOM - sy));
  const spotBottom = sy + sh;

  // Put tooltip above spotlight if it's in the lower half of the screen
  const tooltipAbove = spotBottom > SH * 0.5;
  const tooltipTop = tooltipAbove
    ? Math.max(safeTop + 8, sy - 196)
    : spotBottom + 14;

  const isLast = currentStep === steps.length - 1;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        {/* 4-panel dark overlay with spotlight cutout */}
        <View style={[s.dark, { top: 0, left: 0, right: 0, height: sy }]} />
        <View style={[s.dark, { top: spotBottom, left: 0, right: 0, bottom: 0 }]} />
        <View style={[s.dark, { top: sy, left: 0, width: sx, height: sh }]} />
        <View style={[s.dark, { top: sy, left: sx + sw, right: 0, height: sh }]} />

        {/* Spotlight glow border */}
        <View
          style={{
            position: 'absolute',
            top: sy,
            left: sx,
            width: sw,
            height: sh,
            borderRadius: spotRadius,
            borderWidth: 1.5,
            borderColor: Colors.accent.primary + 'AA',
          }}
        />

        {/* Tooltip card */}
        <View style={[s.tooltip, { top: tooltipTop, maxHeight: SH * 0.4 }]}>
          {/* Arrow indicator pointing to spotlight */}
          <View style={[s.stepBadge]}>
            <FText variant="numXs" color={Colors.accent.primary}>
              STEP {currentStep + 1}
            </FText>
          </View>

          <FText variant="bodyMedium" color={Colors.text.primary} style={{ marginTop: Spacing.xs }}>
            {title}
          </FText>
          <FText
            variant="bodySmall"
            color={Colors.text.secondary}
            style={{ marginTop: 6, lineHeight: 20 }}
          >
            {body}
          </FText>

          <View style={s.footer}>
            <TouchableOpacity
              onPress={onSkip}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FText variant="numXs" color={Colors.text.muted}>건너뛰기</FText>
            </TouchableOpacity>
            <View style={s.rightActions}>
              <FText variant="numXs" color={Colors.text.muted}>
                {currentStep + 1} / {steps.length}
              </FText>
              <TouchableOpacity style={s.nextBtn} onPress={onNext}>
                <FText variant="label" color={Colors.bg.primary}>
                  {isLast ? '완료' : '다음  →'}
                </FText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dark: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  tooltip: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent.primary + '18',
    borderWidth: 1,
    borderColor: Colors.accent.primary + '30',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  nextBtn: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
});
