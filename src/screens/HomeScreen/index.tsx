import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { TourOverlay, TourStep, TourRect } from '../../components/TourOverlay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../theme';
import { FText } from '../../components/common/FText';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { SparkLine } from '../../components/charts/SparkLine';
import { useFocus } from '../../store/focusStore';
import { fetchRecentSessions, fetchTodaySessions, fetchTotalFC, SessionHistory } from '../../services/sessionService';
import { inferFocusReadiness } from '../../utils/focusInference';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2;
const CHART_H = 120;

// ─── Market status badge ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    bull: { label: 'BULL MARKET', color: Colors.market.bullish, bg: Colors.market.bullishGlow },
    bear: { label: 'BEAR MARKET', color: Colors.market.bearish, bg: Colors.market.bearishGlow },
    neutral: { label: 'SIDEWAYS', color: Colors.text.secondary, bg: Colors.bg.elevated },
    volatile: { label: 'HIGH VOLATILITY', color: Colors.volatility, bg: Colors.volatilityGlow },
  };
  const { label, color, bg } = map[status] ?? map.neutral;
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: color + '44' }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <FText variant="label" color={color}>{label}</FText>
    </View>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: number;
  unit?: string;
  delta?: string;
  deltaPositive?: boolean;
  color: string;
  glow: string;
  sublabel?: string;
}

function MetricCard({ label, value, unit = '%', delta, deltaPositive, color, glow, sublabel }: MetricCardProps) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: value / 100,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const barW = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Card style={styles.metricCard} padding={Spacing.md}>
      <FText variant="label" color={Colors.text.tertiary}>{label}</FText>
      <View style={styles.metricRow}>
        <FText variant="num" color={Colors.text.primary}>{value}</FText>
        <FText variant="numSm" color={Colors.text.tertiary}>{unit}</FText>
        {delta && (
          <FText
            variant="numXs"
            color={
              deltaPositive !== undefined
                ? deltaPositive ? Colors.market.bullish : Colors.market.bearish
                : delta.startsWith('+') ? Colors.market.bullish : Colors.market.bearish
            }
            style={styles.metricDelta}
          >
            {delta}
          </FText>
        )}
      </View>
      {/* Progress bar */}
      <View style={styles.metricBar}>
        <Animated.View
          style={[styles.metricBarFill, { width: barW, backgroundColor: color, shadowColor: glow }]}
        />
      </View>
      {sublabel && (
        <FText variant="numXs" color={Colors.text.tertiary} style={{ marginTop: 4 }}>
          {sublabel}
        </FText>
      )}
    </Card>
  );
}

// ─── Recent Sessions ──────────────────────────────────────────────────────────
function RecentSessions() {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchRecentSessions(3);
    if (result.error) {
      setError(result.error);
    } else {
      setSessions(result.data);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}분 ${s}초` : `${s}초`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View>
      <View style={styles.newsHeader}>
        <FText variant="label" color={Colors.text.tertiary}>최근 세션 기록</FText>
        {!loading && (
          <TouchableOpacity onPress={load} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FText variant="label" color={Colors.accent.dim}>새로고침</FText>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <Card padding={Spacing.lg} style={styles.sessionStateCard}>
          <ActivityIndicator size="small" color={Colors.accent.primary} />
          <FText variant="numXs" color={Colors.text.tertiary} style={{ marginTop: Spacing.sm }}>
            불러오는 중...
          </FText>
        </Card>
      )}

      {!loading && error && (
        <Card padding={Spacing.md} style={styles.sessionStateCard}>
          <FText variant="numXs" color={Colors.market.bearish}>연결 오류 — {error}</FText>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <FText variant="numXs" color={Colors.accent.primary}>다시 시도</FText>
          </TouchableOpacity>
        </Card>
      )}

      {!loading && !error && sessions.length === 0 && (
        <Card padding={Spacing.lg} style={styles.sessionStateCard}>
          <FText variant="numXs" color={Colors.text.tertiary}>아직 세션 기록이 없어요</FText>
          <FText variant="numXs" color={Colors.text.muted} style={{ marginTop: 4 }}>
            첫 세션을 완료하면 여기에 표시돼요
          </FText>
        </Card>
      )}

      {!loading && !error && sessions.map((s) => {
        const isSuccess = s.result === 'success';
        const resultColor = isSuccess ? Colors.market.bullish : Colors.market.bearish;
        return (
          <Card key={s.id} style={styles.newsCard} padding={Spacing.md}>
            <View style={styles.newsRow}>
              <View style={[styles.sessionResultBadge, { borderColor: resultColor + '40', backgroundColor: resultColor + '10' }]}>
                <FText variant="numXs" color={resultColor}>
                  {isSuccess ? '완료' : '중단'}
                </FText>
              </View>
              <FText variant="numXs" color={Colors.text.tertiary}>{formatDate(s.created_at)}</FText>
            </View>
            <View style={[styles.newsRow, { marginTop: Spacing.sm }]}>
              <FText variant="numXs" color={Colors.text.secondary}>
                {formatDuration(s.duration_seconds)} · 이탈 {s.distractions}회
              </FText>
              <FText variant="numSm" color={resultColor}>
                {s.fc_earned >= 0 ? '+' : ''}{s.fc_earned} FC
              </FText>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

// ─── Account Balance Card ─────────────────────────────────────────────────────
function AccountCard() {
  const [total, setTotal] = useState(0);
  const [todayDelta, setTodayDelta] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchTotalFC();
    if (result.error) {
      setError(result.error);
    } else {
      setTotal(result.total);
      setTodayDelta(result.todayDelta);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deltaColor = todayDelta >= 0 ? Colors.market.bullish : Colors.market.bearish;
  const deltaSign = todayDelta >= 0 ? '+' : '';

  return (
    <Card variant="elevated" padding={Spacing.md} style={styles.accountCard}>
      <View style={styles.accountRow}>
        <View>
          <FText variant="label" color={Colors.text.tertiary}>MY ACCOUNT</FText>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.accent.primary} style={{ marginTop: 6 }} />
          ) : error ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
              <FText variant="numXs" color={Colors.market.bearish}>연결 오류</FText>
              <TouchableOpacity onPress={load} style={styles.retryBtn}>
                <FText variant="numXs" color={Colors.accent.primary}>다시 시도</FText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.accountBalanceRow}>
              <FText variant="numLg" color={Colors.text.primary}>
                {total.toLocaleString()}
              </FText>
              <FText variant="numSm" color={Colors.text.tertiary} style={{ marginLeft: 4, marginBottom: 2 }}>
                FC
              </FText>
            </View>
          )}
        </View>
        {!loading && !error && (
          <View style={[styles.accountDeltaBadge, { borderColor: deltaColor + '40', backgroundColor: deltaColor + '12' }]}>
            <FText variant="numXs" color={deltaColor}>
              오늘  {deltaSign}{todayDelta} FC
            </FText>
          </View>
        )}
      </View>
      {!loading && !error && (
        <View style={styles.accountDivider} />
      )}
      {!loading && !error && (
        <FText variant="numXs" color={Colors.text.muted}>
          누적 집중 자산 · 전체 기간
        </FText>
      )}
    </Card>
  );
}

// ─── Readiness Card ───────────────────────────────────────────────────────────
function ReadinessCard() {
  const [readiness, setReadiness] = useState(inferFocusReadiness([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchTodaySessions();
    if (result.error) {
      setError(result.error);
    } else {
      setReadiness(inferFocusReadiness(result.data));
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const levelColor =
    readiness.level === 'high' ? Colors.market.bullish
    : readiness.level === 'medium' ? Colors.volatility
    : readiness.level === 'low' ? Colors.market.bearish
    : Colors.text.tertiary;

  return (
    <Card variant="elevated" padding={Spacing.md} style={styles.readinessCard}>
      <View style={styles.readinessHeader}>
        <FText variant="label" color={Colors.text.tertiary}>집중 준비도</FText>
        {loading
          ? <ActivityIndicator size="small" color={Colors.accent.primary} />
          : error
          ? <FText variant="numXs" color={Colors.market.bearish}>조회 실패</FText>
          : (
            <View style={[styles.readinessBadge, { borderColor: levelColor + '50', backgroundColor: levelColor + '15' }]}>
              <FText variant="numXs" color={levelColor}>{readiness.label}</FText>
            </View>
          )
        }
      </View>

      {!loading && !error && (
        <>
          {/* Score bar */}
          <View style={styles.readinessBarBg}>
            <View style={[styles.readinessBarFill, { width: `${readiness.score}%` as any, backgroundColor: levelColor }]} />
          </View>

          {/* Reasons */}
          <View style={styles.reasonList}>
            {readiness.reasons.slice(0, 2).map((r, i) => (
              <FText key={i} variant="numXs" color={Colors.text.tertiary}>· {r}</FText>
            ))}
          </View>

          {/* Recommendation */}
          <FText variant="bodySmall" color={levelColor} style={{ marginTop: Spacing.xs }}>
            {readiness.recommendation}
          </FText>
        </>
      )}
    </Card>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useFocus();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const indexAnim = useRef(new Animated.Value(0)).current;

  // Tour refs
  const scrollViewRef = useRef<ScrollView>(null);
  const heroRef = useRef<View>(null);
  const ctaRef = useRef<View>(null);
  const metricsRef = useRef<View>(null);
  const newsRef = useRef<View>(null);
  const [tourStep, setTourStep] = useState(-1);
  const [tourRects, setTourRects] = useState<{
    hero: TourRect; cta: TourRect; metrics: TourRect; news: TourRect;
  } | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(indexAnim, { toValue: 1, friction: 6, tension: 30, useNativeDriver: true }),
    ]).start();
  }, []);

  // Live chart tick — independent interval, no tour dependency
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK_CHART' }), 2000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Tour start — only when hasSeenTour flips to false, retries if views not laid out
  useEffect(() => {
    if (state.hasSeenTour) return;
    let attempts = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const tryMeasure = () => {
      const rects: Partial<typeof tourRects> = {};
      let count = 0;
      const onMeasured = () => {
        count++;
        if (count === 4) {
          if (rects.hero && rects.cta && rects.metrics && rects.news) {
            setTourRects(rects as NonNullable<typeof tourRects>);
            setTourStep(0);
          } else if (attempts < 3) {
            attempts++;
            const t = setTimeout(tryMeasure, 400);
            timers.push(t);
          }
        }
      };
      const measure = (ref: React.RefObject<View | null>, key: keyof NonNullable<typeof tourRects>) => {
        ref.current?.measureInWindow((x, y, w, h) => {
          if (w > 0 && h > 0) rects[key] = { x, y, width: w, height: h };
          onMeasured();
        });
      };
      measure(heroRef, 'hero');
      measure(ctaRef, 'cta');
      measure(metricsRef, 'metrics');
      measure(newsRef, 'news');
    };

    const t = setTimeout(tryMeasure, 700);
    timers.push(t);
    return () => timers.forEach(clearTimeout);
  }, [state.hasSeenTour]);

  // Step 3 = news section: scroll into view then re-measure
  useEffect(() => {
    if (tourStep !== 3) return;
    scrollViewRef.current?.scrollToEnd({ animated: true });
    const t = setTimeout(() => {
      newsRef.current?.measureInWindow((x, y, w, h) => {
        if (h > 0) {
          setTourRects(prev => prev ? { ...prev, news: { x, y, width: w, height: h } } : null);
        }
      });
    }, 420);
    return () => clearTimeout(t);
  }, [tourStep]);

  // Reset scroll when tour ends
  useEffect(() => {
    if (tourStep === -1) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [tourStep]);

  const isPositive = state.dailyChangePercent >= 0;
  const changeColor = isPositive ? Colors.market.bullish : Colors.market.bearish;
  const changeSign = isPositive ? '+' : '';

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg.primary }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <FText variant="label" color={Colors.text.tertiary}>FOCUS CAPITAL</FText>
            <FText variant="bodySmall" color={Colors.text.tertiary} style={{ marginTop: 2 }}>
              오늘 · {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </FText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Glossary' as never)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="용어 사전 열기"
              accessibilityRole="button"
            >
              <View style={styles.helpBtn}>
                <FText variant="numXs" color={Colors.text.tertiary}>?</FText>
              </View>
            </TouchableOpacity>
            <StatusBadge status={state.marketStatus} />
          </View>
        </Animated.View>

        {/* ── Account Balance ── */}
        <AccountCard />

        {/* ── Focus Index Hero ── */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: indexAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
            },
          ]}
        >
          <View ref={heroRef} collapsable={false}>
          <Card variant="accent" padding={Spacing.lg}>
            {/* Index value */}
            <View style={styles.heroTop}>
              <View>
                <FText variant="label" color={Colors.accent.dim}>FOCUS INDEX</FText>
                <View style={styles.heroValueRow}>
                  <FText
                    variant="displayLg"
                    color={Colors.text.primary}
                    style={styles.heroValue}
                  >
                    {state.focusIndex}
                  </FText>
                </View>
                <View style={styles.deltaRow}>
                  <FText variant="numSm" color={changeColor}>
                    {changeSign}{state.dailyChange} ({changeSign}{state.dailyChangePercent}%)
                  </FText>
                  <FText variant="numXs" color={Colors.text.tertiary} style={{ marginLeft: 6 }}>
                    오늘
                  </FText>
                </View>
              </View>
              <View style={styles.heroRight}>
                <FText variant="label" color={Colors.text.tertiary}>변동성</FText>
                <FText variant="num" color={Colors.volatility}>{state.volatility}%</FText>
              </View>
            </View>

            {/* Sparkline */}
            <View style={styles.chartWrapper}>
              <SparkLine
                data={state.chartData}
                width={CHART_W - Spacing.lg * 2}
                height={CHART_H}
                showGradient
                showGrid
              />
              {/* Time labels */}
              <View style={styles.chartLabels}>
                {['6h', '12h', '18h', 'NOW'].map((l) => (
                  <FText key={l} variant="numXs" color={Colors.chart.label}>{l}</FText>
                ))}
              </View>
            </View>

            {/* Market message */}
            <View style={[styles.marketMsg, { borderColor: Colors.border.accent }]}>
              <FText variant="bodySmall" color={Colors.accent.primary}>
                {state.marketStatus === 'bull'
                  ? '지금 집중하기 좋은 상태예요. 긴 세션 도전해볼 만해요.'
                  : state.marketStatus === 'bear'
                  ? '컨디션이 좋지 않아요. 짧게 쉬고 나서 시작하는 게 낫겠어요.'
                  : state.marketStatus === 'volatile'
                  ? '집중이 됐다 안 됐다 하는 상태예요. 환경 정리부터 해보세요.'
                  : '딱히 좋지도 나쁘지도 않아요. 짧은 세션으로 시작해봐요.'}
              </FText>
            </View>
          </Card>
          </View>
        </Animated.View>

        {/* ── Quick Invest CTA ── */}
        <View ref={ctaRef} collapsable={false}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Session')}
        >
          <View style={styles.ctaInner}>
            <FText variant="bodyMedium" color={Colors.bg.primary}>집중력 투자 시작</FText>
            <FText variant="numSm" color={Colors.bg.primary} style={{ opacity: 0.6 }}>
              25 MIN  ·  40 FC
            </FText>
          </View>
        </TouchableOpacity>
        </View>

        {/* ── Readiness Card ── */}
        <ReadinessCard />

        {/* ── 4 Metric Cards ── */}
        <FText variant="label" color={Colors.text.tertiary} style={styles.sectionLabel}>
          포트폴리오 현황
        </FText>
        <View ref={metricsRef} collapsable={false} style={styles.metricsGrid}>
          <MetricCard
            label="FOCUS"
            value={Math.min(100, Math.round(state.focusIndex / 10))}
            color={Colors.accent.primary}
            glow={Colors.accent.glow}
            delta={`${state.dailyChangePercent >= 0 ? '+' : ''}${state.dailyChangePercent}%`}
            sublabel="집중력 자산"
          />
          <MetricCard
            label="DOPAMINE"
            value={state.dopamineLevel}
            color={Colors.dopamine}
            glow={Colors.dopamineGlow}
            delta={state.dopamineLevel > 70 ? '과열' : '정상'}
            deltaPositive={state.dopamineLevel <= 70}
            sublabel="도파민 수치"
          />
          <MetricCard
            label="RECOVERY"
            value={state.recoveryLevel}
            color={Colors.market.bullish}
            glow={Colors.market.bullishGlow}
            sublabel="회복 자산"
          />
          <MetricCard
            label="VOLATILITY"
            value={state.volatility}
            color={Colors.volatility}
            glow={Colors.volatilityGlow}
            sublabel="변동성 지수"
          />
        </View>

        {/* ── Recent Sessions ── */}
        <RecentSessions />

        {/* ── Recent News ── */}
        <View ref={newsRef} collapsable={false}>
        <View style={styles.newsHeader}>
          <FText variant="label" color={Colors.text.tertiary}>최근 뉴스</FText>
          <TouchableOpacity
            onPress={() => navigation.navigate('News')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FText variant="label" color={Colors.accent.dim}>전체 보기</FText>
          </TouchableOpacity>
        </View>

        {state.news.slice(0, 2).map((item) => (
          <Card key={item.id} style={styles.newsCard} padding={Spacing.md}>
            <View style={styles.newsRow}>
              <View style={styles.newsTag}>
                <FText
                  variant="numXs"
                  color={
                    item.type === 'positive' ? Colors.market.bullish
                      : item.type === 'negative' ? Colors.market.bearish
                      : item.type === 'warning' ? Colors.volatility
                      : Colors.text.secondary
                  }
                >
                  {item.tag}
                </FText>
              </View>
              <FText variant="numXs" color={Colors.text.tertiary}>{item.time}</FText>
            </View>
            <FText variant="bodySmall" color={Colors.text.primary} style={{ marginTop: 4 }}>
              {item.headline}
            </FText>
          </Card>
        ))}
        </View>
      </ScrollView>

      {/* ── Interactive Tour ── */}
      {tourRects && (
        <TourOverlay
          steps={[
            {
              rect: tourRects.hero,
              title: '집중력 지수 (Focus Index)',
              body: '이게 오늘 당신의 "집중력 주가"예요. 숫자가 높을수록 좋고, 세션을 완료할수록 올라가요. 아래 차트는 오늘 하루 변화를 실시간으로 보여줘요.',
              spotRadius: 16,
            },
            {
              rect: tourRects.cta,
              title: '집중 세션 시작하기',
              body: '이 버튼으로 집중 "투자"를 시작해요. 타이머가 끝까지 울리면 FC(Focus Capital)를 얻어요. 중간에 포기하면 손실 처리되니까 조심해요.',
              spotRadius: 14,
            },
            {
              rect: tourRects.metrics,
              title: '포트폴리오 현황',
              body: 'FOCUS·RECOVERY는 높을수록 좋고, DOPAMINE·VOLATILITY는 낮을수록 좋아요. 주식처럼 균형 잡힌 상태를 유지하는 게 목표예요.',
              spotRadius: 12,
            },
            {
              rect: tourRects.news,
              title: '정신 시장 뉴스',
              body: '당신의 행동이 금융 뉴스처럼 표시돼요. SNS를 오래 보거나 숙면을 취하면 뉴스가 달라져요. 탭하면 전체 내용을 볼 수 있어요.',
              spotRadius: 12,
            },
          ] as TourStep[]}
          currentStep={tourStep}
          onNext={() => {
            if (tourStep < 3) {
              setTourStep(s => s + 1);
            } else {
              setTourStep(-1);
              dispatch({ type: 'COMPLETE_TOUR' });
            }
          }}
          onSkip={() => {
            setTourStep(-1);
            dispatch({ type: 'COMPLETE_TOUR' });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  helpBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {},
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  heroValue: { letterSpacing: -3 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  heroRight: { alignItems: 'flex-end' },
  chartWrapper: { marginTop: Spacing.base },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  marketMsg: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.accent.subtle,
  },
  ctaButton: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent.primary,
    overflow: 'hidden',
  },
  ctaInner: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: { marginTop: Spacing.sm },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: { width: (SCREEN_W - Spacing.base * 2 - Spacing.sm) / 2 },
  metricRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 2 },
  metricDelta: { marginLeft: 4, marginBottom: 2 },
  metricBar: {
    height: 2,
    backgroundColor: Colors.border.subtle,
    borderRadius: 1,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  newsCard: { marginBottom: 2 },
  newsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsTag: {},
  sessionStateCard: { alignItems: 'center', marginBottom: 2 },
  sessionResultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '40',
  },
  accountCard: {},
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  accountBalanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  accountDeltaBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  accountDivider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: Spacing.sm,
  },
  readinessCard: { gap: Spacing.xs },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  readinessBarBg: {
    height: 3,
    backgroundColor: Colors.border.subtle,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  readinessBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  reasonList: { gap: 2, marginTop: Spacing.xs },
});
