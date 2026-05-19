import React, { useRef, useEffect } from 'react';
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
import { Colors, Spacing, Radius } from '../../theme';
import { FText } from '../../components/common/FText';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';

const { width: W } = Dimensions.get('window');

// ─── Glossary data ────────────────────────────────────────────────────────────

const TERMS = [
  {
    term: 'Focus Index',
    korean: '집중력 지수',
    color: Colors.accent.primary,
    icon: '◈',
    short: '오늘 내 집중력이 얼마나 좋은지 나타내는 숫자',
    detail:
      '주가처럼 매일 오르내립니다. 집중 세션을 완료하면 올라가고, SNS를 오래 보거나 수면이 부족하면 내려갑니다.',
    example: '"Focus Index 847" = 오늘 집중력이 꽤 좋은 상태',
    tip: '아침에 일어나자마자 확인하면 오늘의 잠재력을 알 수 있어요.',
  },
  {
    term: 'Session (세션)',
    korean: '집중 투자 시간',
    color: Colors.accent.primary,
    icon: '▶',
    short: '정해진 시간 동안 오롯이 한 가지에 집중하는 것',
    detail:
      '주식을 사는 것처럼 시간을 "투자"합니다. 완료하면 Focus 자산(FC)이 쌓이고, 중간에 포기하면 손실 처리됩니다.',
    example: '"25분 세션 완료" = +22 FC 수익 확정',
    tip: '처음엔 15분부터 시작하세요. 짧게 성공하는 습관이 중요합니다.',
  },
  {
    term: 'FC (Focus Capital)',
    korean: '집중력 자산',
    color: Colors.accent.primary,
    icon: '◆',
    short: '세션을 완료해서 쌓이는 집중력 포인트',
    detail:
      '앱 내 화폐 단위입니다. 세션을 성공할수록 쌓이고, 더 긴 세션일수록 더 많이 받습니다. 앱의 "자산"을 나타냅니다.',
    example: '"40 FC 투자, 예상 수익 +22 FC"',
    tip: '처음엔 FC보다 완료 횟수에 집중하세요.',
  },
  {
    term: 'Dopamine Level',
    korean: '도파민 수치',
    color: Colors.dopamine,
    icon: '◈',
    short: '뇌의 "보상 물질" 수치. 높을수록 집중이 힘들어집니다',
    detail:
      '유튜브 쇼츠, SNS, 게임처럼 자극적인 콘텐츠를 보면 도파민이 급등합니다. 도파민이 과열된 뇌는 "지루한" 공부나 작업에 집중하기 매우 힘들어집니다.',
    example: '"도파민 수치 85%" = 지금 집중 세션 시작 비추',
    tip: '세션 전에는 30분간 스마트폰을 내려놓으세요.',
  },
  {
    term: 'Recovery',
    korean: '회복 수치',
    color: Colors.market.bullish,
    icon: '◎',
    short: '집중력이 다시 충전되는 정도. 높을수록 좋습니다',
    detail:
      '수면, 산책, 오프라인 시간이 회복 수치를 올립니다. 수면 8시간을 자면 거의 완전 회복됩니다. 야간 스마트폰 사용은 회복을 방해합니다.',
    example: '"회복 수치 90%" = 내일 최상의 집중력 가능',
    tip: '취침 1시간 전에 화면을 끄면 회복 효율이 크게 오릅니다.',
  },
  {
    term: 'Volatility',
    korean: '변동성',
    color: Colors.volatility,
    icon: '◈',
    short: '집중력이 얼마나 불안정한지를 나타내는 수치',
    detail:
      '변동성이 높으면 집중이 됐다가 안 됐다가를 반복한다는 의미입니다. 수면 부족, 스트레스, 잦은 앱 전환이 변동성을 높입니다.',
    example: '"변동성 60%" = 집중이 오래 유지되기 어려운 상태',
    tip: '변동성을 낮추려면 환경 정리가 중요합니다. 알림을 끄세요.',
  },
  {
    term: 'Bull Market',
    korean: '강세장',
    color: Colors.market.bullish,
    icon: '▲',
    short: '집중력이 전반적으로 좋은 상태',
    detail:
      '주식시장의 상승장과 같습니다. Focus Index가 오르고 있고, 도파민은 안정적이며, 회복도 잘 되고 있는 이상적인 상태입니다.',
    example: '홈 화면 상단에 "BULL MARKET" 표시',
    tip: '강세장일 때 어려운 작업을 몰아서 처리하세요.',
  },
  {
    term: 'Bear Market',
    korean: '약세장',
    color: Colors.market.bearish,
    icon: '▼',
    short: '집중력이 전반적으로 낮거나 감소 중인 상태',
    detail:
      '수면 부족, 과도한 스마트폰 사용, 스트레스 등으로 집중력 지수가 하락하는 상태입니다. 이럴 땐 긴 세션보다 짧은 회복이 더 효과적입니다.',
    example: '홈 화면 상단에 "BEAR MARKET" 표시',
    tip: '약세장에선 무리하지 말고 회복 루틴에 집중하세요.',
  },
];

// ─── Term Card ────────────────────────────────────────────────────────────────

function TermCard({ item, index }: { item: typeof TERMS[0]; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [expanded, setExpanded] = React.useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 55, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(expandAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const detailHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
        <Card padding={Spacing.md} style={styles.termCard}>
          {/* Header row */}
          <View style={styles.termHeader}>
            <View style={[styles.termIcon, { backgroundColor: item.color + '15', borderColor: item.color + '30' }]}>
              <FText variant="numSm" color={item.color}>{item.icon}</FText>
            </View>
            <View style={styles.termTitles}>
              <FText variant="bodyMedium" color={Colors.text.primary}>{item.term}</FText>
              <FText variant="numXs" color={item.color}>{item.korean}</FText>
            </View>
            <FText variant="numXs" color={Colors.text.muted}>{expanded ? '▲' : '▼'}</FText>
          </View>

          {/* Short description — always visible */}
          <FText variant="bodySmall" color={Colors.text.secondary} style={styles.termShort}>
            {item.short}
          </FText>

          {/* Expanded content */}
          <Animated.View style={[styles.expandedContent, { maxHeight: detailHeight }]}>
            <View style={[styles.ruleAccent, { backgroundColor: item.color + '40' }]} />

            <FText variant="bodySmall" color={Colors.text.secondary} style={{ lineHeight: 20 }}>
              {item.detail}
            </FText>

            {/* Example */}
            <View style={[styles.exampleBox, { borderColor: item.color + '30', backgroundColor: item.color + '08' }]}>
              <FText variant="numXs" color={item.color} style={{ marginBottom: 2 }}>예시</FText>
              <FText variant="numXs" color={Colors.text.secondary}>{item.example}</FText>
            </View>

            {/* Tip */}
            <View style={styles.tipRow}>
              <FText variant="numXs" color={Colors.volatility}>▸ </FText>
              <FText variant="numXs" color={Colors.text.tertiary} style={{ flex: 1 }}>
                {item.tip}
              </FText>
            </View>
          </Animated.View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Glossary Screen ──────────────────────────────────────────────────────────

export function GlossaryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg.primary }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 8, opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FText variant="bodyMedium" color={Colors.text.secondary}>← 닫기</FText>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <FText variant="label" color={Colors.text.tertiary}>용어 사전</FText>
        </View>
        <View style={{ width: 60 }} />
      </Animated.View>

      <Divider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Intro */}
        <Animated.View style={[styles.intro, { opacity: fadeAnim }]}>
          <FText variant="h2" color={Colors.text.primary}>
            Focus Capital{'\n'}용어 해설
          </FText>
          <FText variant="bodySmall" color={Colors.text.tertiary} style={{ marginTop: 6, lineHeight: 20 }}>
            투자 용어처럼 보이지만 모두 집중력과 뇌과학 개념입니다.{'\n'}
            각 항목을 탭하면 자세한 설명을 볼 수 있습니다.
          </FText>
        </Animated.View>

        {/* Quick reference table */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Card variant="elevated" padding={Spacing.md} style={styles.quickRef}>
            <FText variant="label" color={Colors.text.tertiary} style={{ marginBottom: Spacing.sm }}>
              한눈에 보기
            </FText>
            {[
              { label: '높을수록 좋음', items: 'Focus Index · Recovery', color: Colors.market.bullish },
              { label: '낮을수록 좋음', items: 'Dopamine · Volatility', color: Colors.market.bearish },
              { label: '완료해야 수익', items: 'Session', color: Colors.accent.primary },
            ].map((row) => (
              <View key={row.label} style={styles.quickRow}>
                <View style={[styles.quickDot, { backgroundColor: row.color }]} />
                <FText variant="numXs" color={Colors.text.tertiary} style={{ width: 88 }}>
                  {row.label}
                </FText>
                <FText variant="numXs" color={Colors.text.secondary}>{row.items}</FText>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Terms */}
        <View style={styles.terms}>
          {TERMS.map((item, index) => (
            <TermCard key={item.term} item={item} index={index} />
          ))}
        </View>

        {/* Footer note */}
        <View style={styles.footer}>
          <FText variant="numXs" color={Colors.text.muted} style={{ textAlign: 'center', lineHeight: 18 }}>
            모든 수치는 행동 패턴 기반 추정치입니다.{'\n'}
            실제 의학적 측정이 아닙니다.
          </FText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  content: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  intro: { marginBottom: Spacing.sm },
  quickRef: { gap: 0 },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 5,
  },
  quickDot: { width: 6, height: 6, borderRadius: 3 },
  terms: { gap: Spacing.sm },
  termCard: { gap: Spacing.xs },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  termIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termTitles: { flex: 1, gap: 1 },
  termShort: { marginTop: 2, lineHeight: 18 },
  expandedContent: {
    overflow: 'hidden',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ruleAccent: { height: 1, width: '100%' },
  exampleBox: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
