import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../theme';
import { FText } from '../../components/common/FText';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { MiniBar } from '../../components/charts/MiniBar';
import { HeatMap } from '../../components/charts/HeatMap';
import { SparkLine } from '../../components/charts/SparkLine';
import { useFocus } from '../../store/focusStore';

const { width: W } = Dimensions.get('window');
const CHART_W = W - Spacing.base * 2 - Spacing.lg * 2;

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const today = new Date().getDay();

// ─── Stat Block ───────────────────────────────────────────────────────────────
interface StatBlockProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

function StatBlock({ label, value, sub, color }: StatBlockProps) {
  return (
    <View style={styles.statBlock}>
      <FText variant="label" color={Colors.text.tertiary}>{label}</FText>
      <FText variant="num" color={color} style={{ marginTop: 2 }}>{value}</FText>
      <FText variant="numXs" color={Colors.text.tertiary} style={{ marginTop: 2 }}>{sub}</FText>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding={Spacing.lg} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FText variant="h3" color={Colors.text.primary}>{title}</FText>
        {subtitle && (
          <FText variant="numXs" color={Colors.text.tertiary}>{subtitle}</FText>
        )}
      </View>
      {children}
    </Card>
  );
}

// ─── Analytics Screen ─────────────────────────────────────────────────────────
export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useFocus();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const scores = state.weeklyFocusScores;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const maxDay = DAYS[scores.indexOf(maxScore)];
  const minDay = DAYS[scores.indexOf(minScore)];
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Best focus hour (from weeklyData today)
  const todayHourly = state.weeklyData[today] ?? state.weeklyData[0];
  const bestHour = todayHourly.indexOf(Math.max(...todayHourly));

  // Volatility score (std dev approximation)
  const mean = avgScore;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const stdDev = Math.round(Math.sqrt(variance));

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg.primary }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 80 },
        ]}
      >
        <Animated.View style={{ opacity: fadeAnim, gap: Spacing.sm }}>

          {/* Page header */}
          <View style={styles.pageHeader}>
            <FText variant="h2" color={Colors.text.primary}>주간 분석</FText>
            <FText variant="bodySmall" color={Colors.text.tertiary}>
              지난 7일 집중력 포트폴리오
            </FText>
          </View>

          {/* KPI row */}
          <Card variant="elevated" padding={Spacing.base} style={styles.kpiRow}>
            <StatBlock
              label="주간 평균"
              value={`${avgScore}`}
              sub="Focus Score"
              color={Colors.text.primary}
            />
            <View style={styles.kpiDivider} />
            <StatBlock
              label="최고점"
              value={`${maxScore}`}
              sub={`${maxDay}요일`}
              color={Colors.market.bullish}
            />
            <View style={styles.kpiDivider} />
            <StatBlock
              label="최저점"
              value={`${minScore}`}
              sub={`${minDay}요일`}
              color={Colors.market.bearish}
            />
            <View style={styles.kpiDivider} />
            <StatBlock
              label="변동성"
              value={`±${stdDev}`}
              sub="편차"
              color={Colors.volatility}
            />
          </Card>

          {/* Weekly trend chart */}
          <SectionCard
            title="주간 집중력 흐름"
            subtitle="7일 추이"
          >
            <View style={{ marginTop: Spacing.md }}>
              <SparkLine
                data={scores}
                width={CHART_W}
                height={80}
                showGradient
                showGrid
              />
            </View>
            <View style={styles.barWrapper}>
              <MiniBar
                data={scores}
                labels={DAYS}
                highlightIndex={today}
                height={40}
              />
            </View>
          </SectionCard>

          {/* Heatmap */}
          <SectionCard
            title="집중력 히트맵"
            subtitle="시간대별 강도"
          >
            <View style={{ marginTop: Spacing.md }}>
              <HeatMap data={state.weeklyData} days={DAYS} />
            </View>
            <View style={styles.heatLegend}>
              {['없음', '낮음', '보통', '높음', '최고'].map((l, i) => (
                <View key={l} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendCell,
                      {
                        backgroundColor:
                          i === 0 ? Colors.bg.elevated
                            : i === 1 ? 'rgba(0,212,255,0.1)'
                            : i === 2 ? 'rgba(0,212,255,0.25)'
                            : i === 3 ? 'rgba(0,212,255,0.5)'
                            : Colors.accent.primary,
                      },
                    ]}
                  />
                  <FText variant="numXs" color={Colors.text.tertiary}>{l}</FText>
                </View>
              ))}
            </View>
          </SectionCard>

          {/* Best focus window */}
          <SectionCard title="최고 집중 시간대">
            <View style={styles.timeGrid}>
              {[
                { label: '오늘 최고', value: `${bestHour}:00`, color: Colors.accent.primary },
                { label: '주간 최다', value: '10:00', color: Colors.accent.primary },
                { label: '평균 시작', value: '09:30', color: Colors.text.secondary },
                { label: '평균 종료', value: '22:00', color: Colors.text.secondary },
              ].map((item) => (
                <View key={item.label} style={styles.timeItem}>
                  <FText variant="label" color={Colors.text.tertiary}>{item.label}</FText>
                  <FText variant="num" color={item.color}>{item.value}</FText>
                </View>
              ))}
            </View>
          </SectionCard>

          {/* Dopamine crash analysis */}
          <SectionCard
            title="최악의 도파민 폭락"
            subtitle="이번 주 기록"
          >
            <View style={styles.crashList}>
              {[
                { time: '화요일 14:23', cause: '유튜브 쇼츠 34분 소비', drop: '-42%' },
                { time: '목요일 22:10', cause: 'SNS 반복 전환 패턴', drop: '-38%' },
                { time: '금요일 16:05', cause: '알림 과다 수신', drop: '-21%' },
              ].map((crash, i) => (
                <View key={i} style={styles.crashItem}>
                  <View style={[styles.crashDot, { backgroundColor: Colors.market.bearish }]} />
                  <View style={{ flex: 1 }}>
                    <FText variant="numSm" color={Colors.text.secondary}>{crash.time}</FText>
                    <FText variant="bodySmall" color={Colors.text.tertiary}>{crash.cause}</FText>
                  </View>
                  <FText variant="numSm" color={Colors.market.bearish}>{crash.drop}</FText>
                </View>
              ))}
            </View>
          </SectionCard>

          {/* Recovery pattern */}
          <SectionCard
            title="회복 패턴 분석"
            subtitle="패턴 감지됨"
          >
            <View style={styles.recoveryRow}>
              {[
                { label: '평균 회복 시간', value: '2.4h', color: Colors.market.bullish },
                { label: '오프라인 효과', value: '+34%', color: Colors.market.bullish },
                { label: '수면 회복률', value: '91%', color: Colors.accent.primary },
                { label: '명상 효과', value: '+18%', color: Colors.market.bullish },
              ].map((item) => (
                <Card
                  key={item.label}
                  style={styles.recoveryCard}
                  padding={Spacing.sm}
                >
                  <FText variant="numXs" color={Colors.text.tertiary}>{item.label}</FText>
                  <FText variant="numSm" color={item.color} style={{ marginTop: 4 }}>
                    {item.value}
                  </FText>
                </Card>
              ))}
            </View>
          </SectionCard>

          {/* Volatility analysis */}
          <SectionCard
            title="변동성 분석"
          >
            <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
              {[
                {
                  label: 'Focus 변동성',
                  value: state.volatility,
                  color: Colors.volatility,
                  comment: '평균 이하 — 안정적',
                },
                {
                  label: 'Dopamine 변동성',
                  value: 68,
                  color: Colors.dopamine,
                  comment: '주의 필요',
                },
                {
                  label: 'Recovery 변동성',
                  value: 31,
                  color: Colors.market.bullish,
                  comment: '안정적',
                },
              ].map((metric) => (
                <View key={metric.label} style={styles.volRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.volHeader}>
                      <FText variant="bodySmall" color={Colors.text.secondary}>
                        {metric.label}
                      </FText>
                      <FText variant="numXs" color={metric.color}>{metric.comment}</FText>
                    </View>
                    <View style={styles.volBar}>
                      <View
                        style={[
                          styles.volBarFill,
                          {
                            width: `${metric.value}%` as any,
                            backgroundColor: metric.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <FText variant="numSm" color={metric.color} style={{ width: 36, textAlign: 'right' }}>
                    {metric.value}%
                  </FText>
                </View>
              ))}
            </View>
          </SectionCard>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  pageHeader: { gap: 4, marginBottom: Spacing.sm },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: Colors.border.subtle,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  sectionCard: { gap: 0 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barWrapper: { marginTop: Spacing.md },
  heatLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  timeItem: {
    width: (W - Spacing.base * 2 - Spacing.lg * 2 - Spacing.sm) / 2,
    gap: 2,
  },
  crashList: { gap: Spacing.md, marginTop: Spacing.md },
  crashItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  crashDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  recoveryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  recoveryCard: {
    width: (W - Spacing.base * 2 - Spacing.lg * 2 - Spacing.sm) / 2,
  },
  volRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  volHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  volBar: {
    height: 4,
    backgroundColor: Colors.border.subtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
