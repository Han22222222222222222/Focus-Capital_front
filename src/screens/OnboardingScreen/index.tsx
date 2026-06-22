import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, Radius, Typography } from '../../theme';
import { FText } from '../../components/common/FText';
import { useFocus } from '../../store/focusStore';

const { width: W, height: H } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  // Plain-language explanation
  plain: string;
  // What it maps to in real life
  real: string;
  accentColor: string;
  visual: 'index' | 'session' | 'dopamine' | 'recovery' | 'volatility' | 'welcome';
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    badge: 'FOCUS CAPITAL',
    title: '집중력도\n관리가 된다',
    subtitle: '주식 앱처럼 생겼지만, 공부·작업용 집중력 앱이에요',
    plain: '주식 투자 앱 아닙니다.\n집중력이 오르내리는 걸 숫자로 보여주는 앱이에요.\n투자 몰라도 됩니다.',
    real: '금융 용어는 그냥 비유예요 — 겁먹지 않아도 돼요',
    accentColor: Colors.accent.primary,
    visual: 'welcome',
  },
  {
    id: 'focus',
    badge: 'FOCUS INDEX',
    title: '오늘 집중력\n지수',
    subtitle: '어제 잘 잔 날이랑 쇼츠 본 날이랑 집중력이 다르잖아요',
    plain: '그 차이를 숫자로 보여줘요.\n높으면 지금 집중하기 좋은 상태,\n낮으면 억지로 하기보단 컨디션 회복이 먼저예요.',
    real: '높을수록 좋음  ·  집중하면 올라감  ·  SNS 보면 내려감',
    accentColor: Colors.accent.primary,
    visual: 'index',
  },
  {
    id: 'session',
    badge: '세션',
    title: '타이머 켜고\n한 가지만',
    subtitle: '시작하고 폰 내려놓으면 끝이에요',
    plain: '타이머가 울릴 때까지 이 앱 밖으로 나가지 않으면 성공.\n중간에 나가면 손실 처리돼요.\n그게 다예요.',
    real: '완료 = 수익  ·  중단 = 손실  ·  더 오래 = 더 큰 수익',
    accentColor: Colors.accent.primary,
    visual: 'session',
  },
  {
    id: 'dopamine',
    badge: 'DOPAMINE',
    title: '쇼츠 보고 나서\n집중 안 되는 이유',
    subtitle: '뇌가 자극에 익숙해지면 공부가 지루하게 느껴져요',
    plain: '쇼츠·SNS를 보면 뇌가 과흥분 상태가 돼요.\n그 상태에서 공부나 작업을 하려니\n밍밍하고 집중이 안 되는 거예요.',
    real: '높을수록 위험  ·  70% 넘으면 세션 미루는 게 나아요',
    accentColor: Colors.market.bearish,
    visual: 'dopamine',
  },
  {
    id: 'recovery',
    badge: 'RECOVERY',
    title: '잠 잘 잔 날\n집중 잘 되는 건 기분 탓이 아니에요',
    subtitle: '수면이 집중력 회복의 90%예요',
    plain: '8시간 자면 거의 완전 회복이에요.\n야근하거나 자기 전에 폰 보면\n다음 날 집중력이 눈에 띄게 떨어져요.',
    real: '높을수록 좋음  ·  수면 8시간 = 최대 회복  ·  야근 = 자산 감소',
    accentColor: Colors.market.bullish,
    visual: 'recovery',
  },
  {
    id: 'start',
    badge: '시작',
    title: '일단 해보면\n알아요',
    subtitle: '처음엔 다 어색하지만 금방 익숙해져요',
    plain: '헷갈리는 용어는 홈 화면 ? 버튼 누르면 설명 나와요.\n첫 세션은 짧게 15분으로 잡는 걸 추천해요.',
    real: '잘 모르겠으면 그냥 시작하세요',
    accentColor: Colors.accent.primary,
    visual: 'welcome',
  },
];

// ─── Mini visuals ─────────────────────────────────────────────────────────────

function WelcomeVisual({ color }: { color: string }) {
  return (
    <View style={[styles.visual, { justifyContent: 'center', alignItems: 'center' }]}>
      <View style={[styles.indexCircle, { borderColor: color + '30' }]}>
        <View style={[styles.indexCircleInner, { borderColor: color + '60' }]}>
          <FText variant="label" color={color}>FOCUS INDEX</FText>
          <FText
            variant="numXl"
            color={Colors.text.primary}
            style={{ letterSpacing: -3, marginTop: 4 }}
          >
            847
          </FText>
          <FText variant="numSm" color={Colors.market.bullish}>+4.2%</FText>
        </View>
      </View>
    </View>
  );
}

function LineVisual({ color, up }: { color: string; up: boolean }) {
  const pts = up
    ? [30, 55, 45, 60, 42, 50, 38, 44, 30, 36, 22, 18, 12]
    : [12, 18, 22, 30, 36, 42, 50, 55, 48, 60, 52, 65, 70];

  const w = W - 80;
  const h = 100;
  const stepX = w / (pts.length - 1);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  const points = pts.map((v, i) => ({
    x: i * stepX,
    y: 10 + ((v - min) / range) * (h - 20),
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1].x + points[i].x) / 2;
    d += ` C ${cpx} ${points[i - 1].y} ${cpx} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  const fill = `${d} L ${w} ${h} L 0 ${h} Z`;

  return (
    <View style={[styles.visual, { alignItems: 'center', justifyContent: 'center' }]}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={`g${up ? 'up' : 'dn'}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={fill} fill={`url(#g${up ? 'up' : 'dn'})`} />
        <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      </Svg>
      <View style={[styles.chartLabel, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <FText variant="numSm" color={color}>{up ? '▲ 상승 중' : '▼ 과열 위험'}</FText>
      </View>
    </View>
  );
}

function SessionVisual({ color }: { color: string }) {
  return (
    <View style={[styles.visual, { justifyContent: 'center', alignItems: 'center' }]}>
      <View style={[styles.timerRing, { borderColor: color + '30' }]}>
        <View style={[styles.timerRingInner, { borderColor: color }]}>
          <FText variant="label" color={color}>투자 중</FText>
          <FText variant="numLg" color={Colors.text.primary}>23:14</FText>
          <View style={[styles.timerBadge, { backgroundColor: color + '20' }]}>
            <FText variant="numXs" color={color}>+22 FC 예정</FText>
          </View>
        </View>
      </View>
    </View>
  );
}

function SlideVisual({ visual, color }: { visual: Slide['visual']; color: string }) {
  switch (visual) {
    case 'welcome': return <WelcomeVisual color={color} />;
    case 'index': return <LineVisual color={color} up={true} />;
    case 'session': return <SessionVisual color={color} />;
    case 'dopamine': return <LineVisual color={color} up={false} />;
    case 'recovery': return <LineVisual color={color} up={true} />;
    case 'volatility': return <LineVisual color={Colors.volatility} up={false} />;
    default: return null;
  }
}

// ─── Dot indicator ────────────────────────────────────────────────────────────

function Dots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current
              ? styles.dotActive
              : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Onboarding Screen ────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { dispatch } = useFocus();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isLast = page === SLIDES.length - 1;

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    scrollRef.current?.scrollTo({ x: next * W, animated: true });
    setPage(next);
  };

  const handleNext = () => {
    if (isLast) {
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    } else {
      goTo(page + 1);
    }
  };

  const handleSkip = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  };

  const slide = SLIDES[page];

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg.primary }]}>
      <StatusBar barStyle="light-content" />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: insets.top + 12 }]}
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FText variant="label" color={Colors.text.tertiary}>건너뛰기</FText>
        </TouchableOpacity>
      )}

      {/* Scrollable pages */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={s.id} style={[styles.page, { paddingTop: insets.top + 60 }]}>
            {/* Visual area */}
            <Animated.View style={[styles.visualArea, { opacity: i === page ? fadeAnim : 1 }]}>
              <SlideVisual visual={s.visual} color={s.accentColor} />
            </Animated.View>

            {/* Content */}
            <Animated.View style={[styles.content, { opacity: i === page ? fadeAnim : 1 }]}>
              {/* Badge */}
              <View style={[styles.badge, { borderColor: s.accentColor + '40', backgroundColor: s.accentColor + '10' }]}>
                <FText variant="label" color={s.accentColor}>{s.badge}</FText>
              </View>

              {/* Title */}
              <FText variant="h1" color={Colors.text.primary} style={styles.title}>
                {s.title}
              </FText>

              {/* Subtitle */}
              <FText variant="bodyMedium" color={Colors.text.secondary} style={styles.subtitle}>
                {s.subtitle}
              </FText>

              {/* Divider line */}
              <View style={[styles.rule, { backgroundColor: s.accentColor + '30' }]} />

              {/* Plain language explanation */}
              <FText variant="bodySmall" color={Colors.text.secondary} style={styles.plain}>
                {s.plain}
              </FText>

              {/* Real-world mapping pill */}
              <View style={[styles.realPill, { borderColor: Colors.border.default }]}>
                <FText variant="numXs" color={Colors.text.tertiary}>{s.real}</FText>
              </View>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <Dots total={SLIDES.length} current={page} />

        <View style={styles.btnRow}>
          {page > 0 && (
            <TouchableOpacity
              style={styles.prevBtn}
              onPress={() => goTo(page - 1)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FText variant="bodyMedium" color={Colors.text.tertiary}>← 이전</FText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.accentColor, flex: 1 }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <FText variant="bodyMedium" color={Colors.bg.primary}>
              {isLast ? '시작하기' : '다음'}
            </FText>
            {!isLast && (
              <FText variant="bodyMedium" color={Colors.bg.primary} style={{ opacity: 0.6, marginLeft: 4 }}>
                →
              </FText>
            )}
          </TouchableOpacity>
        </View>

        {/* Step counter */}
        <FText variant="numXs" color={Colors.text.tertiary} style={styles.stepCounter}>
          {page + 1} / {SLIDES.length}
        </FText>
      </View>
    </View>
  );
}

// ─── Glossary pill (reusable, shown in home screen ?)  ─────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  skipBtn: {
    position: 'absolute',
    right: Spacing.base,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  page: {
    width: W,
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  visualArea: {
    height: H * 0.3,
    marginBottom: Spacing.xl,
  },
  content: {
    flex: 1,
    gap: Spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  title: {
    marginTop: Spacing.xs,
    lineHeight: 38,
  },
  subtitle: {
    lineHeight: 22,
  },
  rule: {
    height: 1,
    width: 40,
    marginVertical: Spacing.xs,
  },
  plain: {
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  realPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.bg.card,
  },
  // Bottom
  bottom: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    gap: Spacing.md,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 3,
    borderRadius: 2,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.accent.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.text.muted,
  },
  btnRow: {
    flexDirection: 'row',
    width: W - Spacing.base * 2,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  prevBtn: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    marginTop: -4,
  },
  // Visuals
  visual: {
    flex: 1,
  },
  indexCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.bg.secondary,
  },
  chartLabel: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  timerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRingInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bg.secondary,
  },
  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 4,
  },
});
