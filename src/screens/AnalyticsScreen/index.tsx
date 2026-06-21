import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
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
import { fetchWeeklyAnalytics, SessionHistory } from '../../services/sessionService';

const { width: W } = Dimensions.get('window');
const CHART_W = W - Spacing.base * 2 - Spacing.lg * 2;
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// 오늘 기준 6일 전~오늘까지 index 반환 (0 = 6일 전, 6 = 오늘), 범위 밖이면 -1
function getDayIndex(isoString: string): number {
  const sessionDate = new Date(isoString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const diffMs = today.getTime() - sessionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays <= 6 ? 6 - diffDays : -1;
}

// ─── Stat Block ───────────────────────────────────────────────────────────────
function StatBlock({
  label, value, sub, color,
}: {
  label: string; value: string; sub: string; color: string;
}) {
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
  title, subtitle, children,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <Card padding={Spacing.lg} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FText variant="h3" color={Colors.text.primary}>{title}</FText>
        {subtitle && <FText variant="numXs" color={Colors.text.tertiary}>{subtitle}</FText>}
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

  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchWeeklyAnalytics();
    if (result.error) {
      setError(result.error);
    } else {
      setSessions(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // 최근 7일 요일 라벨 (오래된 순)
  const weekLabels = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return DAY_NAMES[d.getDay()];
    }), []);

  // 날짜별 집중 시간(분) — 바 차트 / 스파크라인
  const dailyMinutes = useMemo(() => {
    const arr = Array(7).fill(0);
    sessions.forEach(s => {
      const idx = getDayIndex(s.created_at);
      if (idx >= 0) arr[idx] += Math.floor(s.duration_seconds / 60);
    });
    return arr;
  }, [sessions]);

  // 히트맵: 7일 × 24시간 (정규화 0-100)
  const heatmapData = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    sessions.forEach(s => {
      const idx = getDayIndex(s.created_at);
      const hour = new Date(s.created_at).getHours();
      if (idx >= 0) grid[idx][hour] += Math.floor(s.duration_seconds / 60);
    });
    const maxVal = Math.max(...grid.flat(), 1);
    return grid.map(day => day.map(v => Math.round((v / maxVal) * 100)));
  }, [sessions]);

  // KPI
  const totalSessions = sessions.length;
  const successCount = sessions.filter(s => s.result === 'success').length;
  const successRate = totalSessions > 0 ? Math.round((successCount / totalSessions) * 100) : 0;
  const totalFC = sessions.reduce((a, s) => a + s.fc_earned, 0);
  const totalMinutes = sessions.reduce((a, s) => a + Math.floor(s.duration_seconds / 60), 0);
  const avgDistractions = totalSessions > 0
    ? (sessions.reduce((a, s) => a + s.distractions, 0) / totalSessions).toFixed(1)
    : '—';

  // 가장 활발한 시간대
  const hourActivity = useMemo(() => {
    const arr = Array(24).fill(0);
    sessions.forEach(s => { arr[new Date(s.created_at).getHours()] += s.duration_seconds; });
    return arr;
  }, [sessions]);
  const bestHour = hourActivity.indexOf(Math.max(...hourActivity));
  const hasBestHour = sessions.length > 0;

  // 주간 통계
  const maxDay = dailyMinutes.indexOf(Math.max(...dailyMinutes));
  const totalHours = Math.floor(totalMinutes / 60);
  const remainMins = totalMinutes % 60;

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

          {/* Loading */}
          {loading && (
            <Card padding={Spacing.xl} style={styles.stateCard}>
              <ActivityIndicator size="small" color={Colors.accent.primary} />
              <FText variant="numXs" color={Colors.text.tertiary} style={{ marginTop: Spacing.sm }}>
                데이터 불러오는 중...
              </FText>
            </Card>
          )}

          {/* Error */}
          {!loading && error && (
            <Card padding={Spacing.lg} style={styles.stateCard}>
              <FText variant="numXs" color={Colors.market.bearish}>연결 오류 — {error}</FText>
              <TouchableOpacity onPress={load} style={styles.retryBtn}>
                <FText variant="numXs" color={Colors.accent.primary}>다시 시도</FText>
              </TouchableOpacity>
            </Card>
          )}

          {/* Empty */}
          {!loading && !error && totalSessions === 0 && (
            <Card padding={Spacing.xl} style={styles.stateCard}>
              <FText variant="numXs" color={Colors.text.tertiary}>
                이번 주 세션 기록이 없어요
              </FText>
              <FText variant="numXs" color={Colors.text.muted} style={{ marginTop: 4 }}>
                세션을 완료하면 여기에 분석이 표시돼요
              </FText>
            </Card>
          )}

          {!loading && !error && totalSessions > 0 && (
            <>
              {/* KPI row */}
              <Card variant="elevated" padding={Spacing.base} style={styles.kpiRow}>
                <StatBlock
                  label="총 세션"
                  value={`${totalSessions}`}
                  sub={`성공 ${successCount}회`}
                  color={Colors.text.primary}
                />
                <View style={styles.kpiDivider} />
                <StatBlock
                  label="성공률"
                  value={`${successRate}%`}
                  sub="이번 주"
                  color={successRate >= 70 ? Colors.market.bullish : Colors.market.bearish}
                />
                <View style={styles.kpiDivider} />
                <StatBlock
                  label="총 FC"
                  value={`${totalFC > 0 ? '+' : ''}${totalFC}`}
                  sub="누적"
                  color={totalFC >= 0 ? Colors.market.bullish : Colors.market.bearish}
                />
                <View style={styles.kpiDivider} />
                <StatBlock
                  label="집중 시간"
                  value={totalHours > 0 ? `${totalHours}h` : `${remainMins}m`}
                  sub="총합"
                  color={Colors.accent.primary}
                />
              </Card>

              {/* Weekly trend chart */}
              <SectionCard title="주간 집중력 흐름" subtitle="7일 · 분 단위">
                <View style={{ marginTop: Spacing.md }}>
                  <SparkLine
                    data={dailyMinutes}
                    width={CHART_W}
                    height={80}
                    showGradient
                    showGrid
                  />
                </View>
                <View style={styles.barWrapper}>
                  <MiniBar
                    data={dailyMinutes}
                    labels={weekLabels}
                    highlightIndex={6}
                    height={40}
                  />
                </View>
                {maxDay >= 0 && dailyMinutes[maxDay] > 0 && (
                  <View style={styles.insightRow}>
                    <FText variant="numXs" color={Colors.market.bullish}>
                      ▲ 최고 — {weekLabels[maxDay]}요일 {dailyMinutes[maxDay]}분
                    </FText>
                  </View>
                )}
              </SectionCard>

              {/* Heatmap */}
              <SectionCard title="집중력 히트맵" subtitle="시간대별 강도">
                <View style={{ marginTop: Spacing.md }}>
                  <HeatMap data={heatmapData} days={weekLabels} />
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
              <SectionCard title="집중 시간대 분석">
                <View style={styles.timeGrid}>
                  {[
                    {
                      label: '최고 활동 시간',
                      value: hasBestHour ? `${bestHour}:00` : '—',
                      color: Colors.accent.primary,
                    },
                    {
                      label: '평균 이탈 횟수',
                      value: `${avgDistractions}회`,
                      color: Number(avgDistractions) <= 1
                        ? Colors.market.bullish
                        : Colors.market.bearish,
                    },
                    {
                      label: '평균 세션 시간',
                      value: totalSessions > 0
                        ? `${Math.round(totalMinutes / totalSessions)}분`
                        : '—',
                      color: Colors.text.secondary,
                    },
                    {
                      label: '이번 주 총 시간',
                      value: totalHours > 0
                        ? `${totalHours}h ${remainMins}m`
                        : `${remainMins}분`,
                      color: Colors.text.secondary,
                    },
                  ].map((item) => (
                    <View key={item.label} style={styles.timeItem}>
                      <FText variant="label" color={Colors.text.tertiary}>{item.label}</FText>
                      <FText variant="num" color={item.color}>{item.value}</FText>
                    </View>
                  ))}
                </View>
              </SectionCard>

              {/* Session breakdown */}
              <SectionCard title="세션 결과 분석" subtitle="이번 주">
                <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
                  {[
                    {
                      label: '성공 세션',
                      value: successCount,
                      total: totalSessions,
                      color: Colors.market.bullish,
                      comment: successRate >= 70 ? '우수' : successRate >= 50 ? '보통' : '개선 필요',
                    },
                    {
                      label: '중단 세션',
                      value: totalSessions - successCount,
                      total: totalSessions,
                      color: Colors.market.bearish,
                      comment: `손실 ${Math.abs(sessions.filter(s => s.result === 'failure').reduce((a, s) => a + s.fc_earned, 0))} FC`,
                    },
                    {
                      label: '무이탈 세션',
                      value: sessions.filter(s => s.distractions === 0).length,
                      total: totalSessions,
                      color: Colors.accent.primary,
                      comment: '보너스 +5 FC 적용',
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
                                width: `${Math.round((metric.value / metric.total) * 100)}%` as any,
                                backgroundColor: metric.color,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <FText variant="numSm" color={metric.color} style={{ width: 36, textAlign: 'right' }}>
                        {metric.value}회
                      </FText>
                    </View>
                  ))}
                </View>
              </SectionCard>
            </>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  pageHeader: { gap: 4, marginBottom: Spacing.sm },
  stateCard: { alignItems: 'center' },
  retryBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '40',
  },
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
  insightRow: { marginTop: Spacing.sm },
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
