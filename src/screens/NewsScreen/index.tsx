import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../theme';
import { FText } from '../../components/common/FText';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { useFocus, NewsItem } from '../../store/focusStore';

const TAG_COLORS: Record<string, string> = {
  FOCUS: Colors.accent.primary,
  DOPAMINE: Colors.dopamine,
  RECOVERY: Colors.market.bullish,
  VOLATILITY: Colors.volatility,
};

const TYPE_ICON: Record<string, string> = {
  positive: '▲',
  negative: '▼',
  warning: '◆',
  neutral: '●',
};

const TYPE_COLOR: Record<string, string> = {
  positive: Colors.market.bullish,
  negative: Colors.market.bearish,
  warning: Colors.volatility,
  neutral: Colors.text.secondary,
};

function NewsRow({ item, index }: { item: NewsItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const tagColor = TAG_COLORS[item.tag] ?? Colors.text.secondary;
  const typeColor = TYPE_COLOR[item.type];
  const icon = TYPE_ICON[item.type];

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Card padding={Spacing.base} style={styles.newsCard}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={[styles.tagPill, { borderColor: tagColor + '44', backgroundColor: tagColor + '12' }]}>
            <FText variant="numXs" color={tagColor}>{item.tag}</FText>
          </View>
          <View style={styles.rightMeta}>
            <FText variant="numXs" color={typeColor}>{icon}</FText>
            <FText variant="numXs" color={Colors.text.tertiary} style={{ marginLeft: 4 }}>
              {item.time}
            </FText>
          </View>
        </View>

        {/* Headline */}
        <FText variant="bodyMedium" color={Colors.text.primary} style={styles.headline}>
          {item.headline}
        </FText>

        {/* Detail */}
        <FText variant="bodySmall" color={Colors.text.tertiary} style={styles.detail}>
          {item.detail}
        </FText>

      </Card>
    </Animated.View>
  );
}

// ─── Breaking ticker ──────────────────────────────────────────────────────────
function TickerBar() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const TEXT = '  집중력 시장 상승세  ·  도파민 지수 과열 경보  ·  회복 자산 기준값 복귀  ·  오늘 집중력 고점 경신  ·  ';

  useEffect(() => {
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -600,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.ticker}>
      <View style={styles.tickerLabel}>
        <FText variant="numXs" color={Colors.market.bearish}>LIVE</FText>
      </View>
      <View style={styles.tickerContent}>
        <Animated.View style={{ transform: [{ translateX: scrollX }] }}>
          <FText variant="numXs" color={Colors.text.secondary} numberOfLines={1}>
            {TEXT + TEXT}
          </FText>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = ['전체', 'FOCUS', 'DOPAMINE', 'RECOVERY', 'VOLATILITY'] as const;
type Filter = (typeof FILTERS)[number];

export function NewsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useFocus();
  const [activeFilter, setActiveFilter] = React.useState<Filter>('전체');

  const filtered =
    activeFilter === '전체'
      ? state.news
      : state.news.filter((n) => n.tag === activeFilter);

  return (
    <View style={[styles.root, { backgroundColor: Colors.bg.primary }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTitle}>
          <FText variant="h2" color={Colors.text.primary}>정신 시장 뉴스</FText>
          <View style={styles.liveDot} />
        </View>
        <FText variant="bodySmall" color={Colors.text.tertiary}>
          당신의 행동 패턴을 시장 데이터로
        </FText>
      </View>

      {/* Ticker */}
      <TickerBar />

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const active = f === activeFilter;
          const color = active
            ? f === '전체' ? Colors.text.primary : TAG_COLORS[f] ?? Colors.text.primary
            : Colors.text.tertiary;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                active && {
                  borderColor: color,
                  backgroundColor: color + '14',
                },
              ]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}
            >
              <FText variant="numXs" color={color}>{f}</FText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Divider />

      {/* News list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <NewsRow item={item} index={index} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
          filtered.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FText variant="h2" color={Colors.text.tertiary}>—</FText>
            <FText variant="bodyMedium" color={Colors.text.tertiary} style={{ marginTop: Spacing.sm }}>
              해당 카테고리의 뉴스가 없습니다
            </FText>
            <FText variant="bodySmall" color={Colors.text.tertiary} style={{ marginTop: 4 }}>
              다른 필터를 선택해보세요
            </FText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.market.bearish,
  },
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.subtle,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  tickerLabel: {
    paddingHorizontal: Spacing.sm,
    borderRightWidth: 1,
    borderColor: Colors.border.default,
  },
  tickerContent: { flex: 1, overflow: 'hidden', paddingHorizontal: Spacing.sm },
  filterScroll: {},
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  listContent: { padding: Spacing.base },
  listEmpty: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  newsCard: { gap: Spacing.xs },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  rightMeta: { flexDirection: 'row', alignItems: 'center' },
  headline: { marginTop: 2 },
  detail: { marginTop: 2 },
});
