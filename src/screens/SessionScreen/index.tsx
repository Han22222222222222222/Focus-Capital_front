import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  AppState,
  AppStateStatus,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { saveSession } from '../../services/sessionService';
import {
  sendMessage,
  updateApplicationContext,
  getReachability,
  watchEvents,
} from 'react-native-watch-connectivity';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../theme';
import { FText } from '../../components/common/FText';
import { Card } from '../../components/common/Card';
import { useFocus, NewsItem } from '../../store/focusStore';

const { width: W } = Dimensions.get('window');

// ─── News generator ───────────────────────────────────────────────────────────
function buildNewsItem(
  result: 'success' | 'failure',
  durationSeconds: number,
  distractions: number,
  fcEarned: number,
): NewsItem {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const minutes = Math.floor(durationSeconds / 60);
  const id = `session-${now.getTime()}`;

  if (result === 'success') {
    if (distractions === 0) {
      return {
        id, time, type: 'positive', tag: 'FOCUS',
        headline: `Focus Index 상승 — ${minutes}분 무이탈 세션 완료`,
        detail: `이탈 없이 완료. 무이탈 보너스 포함 +${fcEarned} FC 수익 확정.`,
      };
    }
    if (distractions <= 2) {
      return {
        id, time, type: 'positive', tag: 'FOCUS',
        headline: `${minutes}분 세션 완료 — 이탈 ${distractions}회 기록`,
        detail: `세션 성공. 이탈 페널티 -${distractions * 3} FC 적용 후 +${fcEarned} FC 확정.`,
      };
    }
    return {
      id, time, type: 'warning', tag: 'VOLATILITY',
      headline: `세션 완료 — 이탈 ${distractions}회로 변동성 상승`,
      detail: `완료했지만 잦은 이탈로 집중 흐름 손상. +${fcEarned} FC, 변동성 주의.`,
    };
  }

  // failure
  if (distractions >= 3) {
    return {
      id, time, type: 'negative', tag: 'DOPAMINE',
      headline: `세션 중단 — 앱 이탈 ${distractions}회 후 포기`,
      detail: `${minutes > 0 ? `${minutes}분 경과 후` : '시작 직후'} 중단. 도파민 과열 상태 가능성. -${Math.abs(fcEarned)} FC 손실.`,
    };
  }
  if (minutes < 5) {
    return {
      id, time, type: 'negative', tag: 'FOCUS',
      headline: `조기 중단 — ${minutes > 0 ? `${minutes}분` : '1분 미만'} 만에 포기`,
      detail: `세션 시작 직후 중단. -${Math.abs(fcEarned)} FC 손실. 짧은 세션부터 재도전 권장.`,
    };
  }
  return {
    id, time, type: 'negative', tag: 'FOCUS',
    headline: `${minutes}분 투자 중단 — 손실 처리`,
    detail: `세션 포기로 -${Math.abs(fcEarned)} FC 손실. 회복 후 재투자 권장.`,
  };
}
const CIRCLE_SIZE = 220;

// ─── Tracking consent modal ───────────────────────────────────────────────────
function TrackingConsentModal({ onAccept }: { onAccept: () => void }) {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const ITEMS = [
    { icon: '◎', title: '앱 이탈 감지', desc: '세션 중에 다른 앱으로 나가면 잡혀요. 나갈 때마다 FC가 깎여요.' },
    { icon: '▶', title: '세션 타이머', desc: '타이머가 끝날 때까지 버티면 수익, 중간에 포기하면 손실이에요.' },
    { icon: '◈', title: '지수 반영', desc: '세션 결과가 Focus Index랑 Dopamine, Recovery에 반영돼요.' },
  ];

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.consentOverlay,
        { opacity: fadeAnim },
      ]}
    >
      <Animated.View
        style={[styles.consentSheet, { transform: [{ translateY: slideAnim }], paddingBottom: Spacing['3xl'] + safeBottom }]}
      >
        <View style={styles.consentHandle} />

        <FText variant="h3" color={Colors.text.primary} style={{ marginBottom: 4 }}>
          세션 시작 전에
        </FText>
        <FText variant="bodySmall" color={Colors.text.tertiary} style={{ marginBottom: Spacing.lg, lineHeight: 20 }}>
          이 앱이 세션 중에 뭘 보는지 알려드릴게요.{'\n'}
          데이터는 폰 밖으로 안 나가요.
        </FText>

        {ITEMS.map((item) => (
          <View key={item.icon} style={styles.consentItem}>
            <View style={styles.consentIconBox}>
              <FText variant="numSm" color={Colors.accent.primary}>{item.icon}</FText>
            </View>
            <View style={{ flex: 1 }}>
              <FText variant="bodySmall" color={Colors.text.primary}>{item.title}</FText>
              <FText variant="numXs" color={Colors.text.tertiary} style={{ marginTop: 2, lineHeight: 16 }}>
                {item.desc}
              </FText>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.consentBtn} onPress={onAccept} activeOpacity={0.85}>
          <FText variant="bodyMedium" color={Colors.bg.primary}>동의하고 계속</FText>
        </TouchableOpacity>
        <FText
          variant="numXs"
          color={Colors.text.muted}
          style={{ textAlign: 'center', marginTop: Spacing.sm, lineHeight: 16 }}
        >
          동의 안 하면 세션을 시작할 수 없어요.
        </FText>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Duration presets ─────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { label: '15분', seconds: 15 * 60, risk: '낮음', ret: '+12 FC' },
  { label: '25분', seconds: 25 * 60, risk: '보통', ret: '+22 FC' },
  { label: '45분', seconds: 45 * 60, risk: '높음', ret: '+45 FC' },
  { label: '90분', seconds: 90 * 60, risk: '매우 높음', ret: '+100 FC' },
];

const FOCUS_OPTIONS = [20, 30, 40, 60, 80];

// ─── FC / Risk calculator ─────────────────────────────────────────────────────
function calcBaseFC(seconds: number): { fc: number; risk: string } {
  const minutes = seconds / 60;
  if (minutes < 20) return { fc: Math.max(1, Math.round(minutes * 0.8)), risk: '낮음' };
  if (minutes < 35) return { fc: Math.round(minutes * 0.88), risk: '보통' };
  if (minutes < 70) return { fc: Math.round(minutes * 1.0), risk: '높음' };
  return { fc: Math.round(minutes * 1.11), risk: '매우 높음' };
}

function calcFC(durationSeconds: number, distractions: number): { base: number; penalty: number; bonus: number; final: number } {
  const preset = DURATION_OPTIONS.find(d => d.seconds === durationSeconds);
  const base = preset
    ? parseInt(preset.ret.replace(/[^0-9]/g, ''), 10)
    : calcBaseFC(durationSeconds).fc;
  const penalty = distractions * 3;
  const bonus = distractions === 0 ? 5 : 0;
  const final = Math.max(1, base - penalty + bonus);
  return { base, penalty, bonus, final };
}

// ─── Ring Timer ────────────────────────────────────────────────────────────────
function RingTimer({
  elapsed,
  total,
  state,
}: {
  elapsed: number;
  total: number;
  state: string;
}) {
  const progress = total > 0 ? elapsed / total : 0;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === 'active') {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.98, duration: 1500, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.08, duration: 1500, useNativeDriver: true }),
          ]),
        ]),
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    return () => { pulseRef.current?.stop(); };
  }, [state]);

  const remaining = total - elapsed;
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');

  const ringColor =
    state === 'success' ? Colors.market.bullish
      : state === 'failure' ? Colors.market.bearish
      : Colors.accent.primary;

  const r = CIRCLE_SIZE / 2;

  return (
    <Animated.View style={[styles.ringOuter, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.View
        style={[
          styles.ringGlow,
          {
            width: CIRCLE_SIZE + 40,
            height: CIRCLE_SIZE + 40,
            borderRadius: (CIRCLE_SIZE + 40) / 2,
            backgroundColor: ringColor,
            opacity: glowAnim,
          },
        ]}
      />
      <View
        style={[
          styles.ringCircle,
          {
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: r,
            borderColor: ringColor + '30',
          },
        ]}
      >
        {/* Progress arc overlay */}
        <View style={[styles.ringInner, { borderColor: ringColor, opacity: 0.15 + progress * 0.85 }]} />

        {state === 'idle' && (
          <View style={styles.ringContent}>
            <FText variant="label" color={Colors.text.tertiary}>준비</FText>
            <FText variant="numLg" color={Colors.text.primary}>{mins}:{secs}</FText>
          </View>
        )}
        {(state === 'active' || state === 'paused') && (
          <View style={styles.ringContent}>
            <FText variant="label" color={state === 'paused' ? Colors.volatility : Colors.accent.primary}>
              {state === 'paused' ? '일시정지' : '투자 중'}
            </FText>
            <FText variant="numXl" color={Colors.text.primary}>{mins}:{secs}</FText>
            <FText variant="numXs" color={Colors.text.tertiary} style={{ marginTop: 4 }}>
              {Math.round(progress * 100)}% 완료
            </FText>
          </View>
        )}
        {state === 'success' && (
          <View style={styles.ringContent}>
            <FText variant="h2" color={Colors.market.bullish}>완료</FText>
            <FText variant="numSm" color={Colors.market.bullish}>수익 확정</FText>
          </View>
        )}
        {state === 'failure' && (
          <View style={styles.ringContent}>
            <FText variant="h2" color={Colors.market.bearish}>중단</FText>
            <FText variant="numSm" color={Colors.market.bearish}>손실 처리</FText>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Session Setup ─────────────────────────────────────────────────────────────
function SessionSetup({ navigation }: any) {
  const { state, dispatch } = useFocus();
  const [showConsent, setShowConsent] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const presetMatch = DURATION_OPTIONS.find(d => d.seconds === state.sessionDuration);
  const selectedDuration = presetMatch ?? DURATION_OPTIONS[1];

  const customSeconds = parseInt(customMinutes, 10) * 60;
  const customInfo = calcBaseFC(customSeconds);
  const isCustomValid = !isNaN(customSeconds) && customSeconds >= 60 && customSeconds <= 120 * 60;

  const summaryLabel = isCustom && isCustomValid
    ? `${customMinutes}분`
    : selectedDuration.label;
  const summaryRet = isCustom && isCustomValid
    ? `+${customInfo.fc} FC`
    : selectedDuration.ret;
  const summaryRisk = isCustom && isCustomValid
    ? customInfo.risk
    : selectedDuration.risk;

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.setupContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.setupHeader}>
        <FText variant="h2" color={Colors.text.primary}>집중력 투자</FText>
        <FText variant="bodySmall" color={Colors.text.tertiary}>
          세션을 설정하고 Focus 자산을 투자하세요
        </FText>
      </View>

      {/* Duration */}
      <FText variant="label" color={Colors.text.tertiary} style={styles.sectionLabel}>
        투자 시간 선택
      </FText>
      <View style={styles.durationGrid}>
        {DURATION_OPTIONS.map((opt) => {
          const selected = !isCustom && opt.seconds === state.sessionDuration;
          return (
            <TouchableOpacity
              key={opt.seconds}
              onPress={() => {
                setIsCustom(false);
                dispatch({ type: 'SET_SESSION_DURATION', payload: opt.seconds });
              }}
              activeOpacity={0.7}
            >
              <Card
                variant={selected ? 'accent' : 'default'}
                padding={Spacing.md}
                style={[styles.durationCard, selected && styles.durationSelected]}
              >
                <FText variant="h3" color={selected ? Colors.accent.primary : Colors.text.primary}>
                  {opt.label}
                </FText>
                <View style={styles.durationMeta}>
                  <FText variant="numXs" color={Colors.text.tertiary}>리스크</FText>
                  <FText variant="numXs" color={
                    opt.risk === '낮음' ? Colors.market.bullish
                      : opt.risk === '높음' || opt.risk === '매우 높음' ? Colors.market.bearish
                      : Colors.volatility
                  }>{opt.risk}</FText>
                </View>
                <FText variant="numSm" color={selected ? Colors.accent.primary : Colors.market.bullish}>
                  {opt.ret}
                </FText>
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* 직접 설정 카드 */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsCustom(true)}
          style={styles.customCard}
        >
          <Card
            variant={isCustom ? 'accent' : 'default'}
            padding={Spacing.md}
            style={[styles.customCardInner, isCustom && styles.durationSelected]}
          >
            {isCustom ? (
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  value={customMinutes}
                  onChangeText={(t) => {
                    const digits = t.replace(/[^0-9]/g, '');
                    setCustomMinutes(digits);
                    const mins = parseInt(digits, 10);
                    if (!isNaN(mins) && mins >= 1) {
                      dispatch({ type: 'SET_SESSION_DURATION', payload: mins * 60 });
                    }
                  }}
                  keyboardType="number-pad"
                  placeholder="1–120"
                  placeholderTextColor={Colors.text.muted}
                  autoFocus
                  maxLength={3}
                />
                <FText variant="numSm" color={Colors.accent.primary}>분</FText>
              </View>
            ) : (
              <FText variant="h3" color={Colors.text.secondary}>직접 설정</FText>
            )}
            {isCustom && isCustomValid && (
              <View style={styles.durationMeta}>
                <FText variant="numXs" color={Colors.text.tertiary}>리스크</FText>
                <FText variant="numXs" color={
                  customInfo.risk === '낮음' ? Colors.market.bullish
                    : customInfo.risk === '높음' || customInfo.risk === '매우 높음' ? Colors.market.bearish
                    : Colors.volatility
                }>{customInfo.risk}</FText>
              </View>
            )}
            {isCustom && isCustomValid && (
              <FText variant="numSm" color={Colors.accent.primary}>+{customInfo.fc} FC</FText>
            )}
          </Card>
        </TouchableOpacity>
      </View>

      {/* Focus amount */}
      <FText variant="label" color={Colors.text.tertiary} style={styles.sectionLabel}>
        투자 Focus 량
      </FText>
      <View style={styles.focusRow}>
        {FOCUS_OPTIONS.map((v) => {
          const selected = v === state.sessionFocusInvested;
          return (
            <TouchableOpacity
              key={v}
              style={[styles.focusChip, selected && styles.focusChipSelected]}
              onPress={() => dispatch({ type: 'SET_SESSION_FOCUS', payload: v })}
              activeOpacity={0.7}
            >
              <FText
                variant="numSm"
                color={selected ? Colors.accent.primary : Colors.text.secondary}
              >
                {v}
              </FText>
              <FText variant="numXs" color={Colors.text.tertiary}>FC</FText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary */}
      <Card variant="elevated" padding={Spacing.base} style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <FText variant="bodySmall" color={Colors.text.tertiary}>투자 시간</FText>
          <FText variant="numSm" color={Colors.text.primary}>{summaryLabel}</FText>
        </View>
        <View style={styles.summaryRow}>
          <FText variant="bodySmall" color={Colors.text.tertiary}>투자 Focus</FText>
          <FText variant="numSm" color={Colors.text.primary}>{state.sessionFocusInvested} FC</FText>
        </View>
        <View style={styles.summaryRow}>
          <FText variant="bodySmall" color={Colors.text.tertiary}>예상 수익</FText>
          <FText variant="numSm" color={Colors.market.bullish}>{summaryRet}</FText>
        </View>
        <View style={styles.summaryRow}>
          <FText variant="bodySmall" color={Colors.text.tertiary}>리스크</FText>
          <FText variant="numSm" color={Colors.volatility}>{summaryRisk}</FText>
        </View>
      </Card>

      {/* Start */}
      <TouchableOpacity
        style={[styles.startButton, isCustom && !isCustomValid && styles.startButtonDisabled]}
        activeOpacity={0.85}
        onPress={() => {
          if (isCustom && !isCustomValid) return;
          if (!state.hasAcceptedTracking) {
            setShowConsent(true);
          } else {
            dispatch({ type: 'START_SESSION' });
          }
        }}
      >
        <FText variant="bodyMedium" color={Colors.bg.primary}>
          {isCustom && !isCustomValid ? '시간을 입력하세요' : '투자 시작'}
        </FText>
      </TouchableOpacity>
    </ScrollView>

    {showConsent && (
      <TrackingConsentModal
        onAccept={() => {
          dispatch({ type: 'ACCEPT_TRACKING' });
          setShowConsent(false);
          dispatch({ type: 'START_SESSION' });
        }}
      />
    )}
    </View>
  );
}

// ─── Active Session ────────────────────────────────────────────────────────────
function ActiveSession() {
  const { state, dispatch } = useFocus();
  const sessionStateRef = useRef(state.sessionState);
  const [showWarning, setShowWarning] = useState(false);
  const warningAnim = useRef(new Animated.Value(0)).current;
  const hasSavedRef = useRef(false);

  // Keep ref in sync so AppState listener always has current value
  useEffect(() => {
    sessionStateRef.current = state.sessionState;
  }, [state.sessionState]);

  // Save session to Supabase + generate news when result is determined
  useEffect(() => {
    const isResult = state.sessionState === 'success' || state.sessionState === 'failure';
    if (!isResult || hasSavedRef.current) return;
    hasSavedRef.current = true;

    const result = state.sessionState as 'success' | 'failure';
    const fc = calcFC(state.sessionDuration, state.sessionDistractions);
    const fcEarned = result === 'success' ? fc.final : -state.sessionFocusInvested;

    saveSession({
      duration_seconds: state.sessionElapsed,
      result,
      distractions: state.sessionDistractions,
      fc_earned: fcEarned,
      focus_invested: state.sessionFocusInvested,
    }).then(res => {
      if (!res.success) {
        Alert.alert('저장 실패', `세션 기록을 저장하지 못했어요.\n${res.error ?? ''}`, [{ text: '확인' }]);
      }
    });

    dispatch({
      type: 'ADD_NEWS',
      payload: buildNewsItem(
        result,
        state.sessionElapsed,
        state.sessionDistractions,
        fcEarned,
      ),
    });
  }, [state.sessionState]);

  // Timer tick
  useEffect(() => {
    if (state.sessionState !== 'active') return;
    const t = setInterval(() => dispatch({ type: 'TICK_SESSION' }), 1000);
    return () => clearInterval(t);
  }, [state.sessionState]);

  // Watch — sync state on key events
  useEffect(() => {
    const ctx = {
      sessionState: state.sessionState,
      elapsed: state.sessionElapsed,
      duration: state.sessionDuration,
      distractions: state.sessionDistractions,
    };
    try { updateApplicationContext(ctx); } catch (_) {}
    getReachability().then((isReachable) => {
      if (isReachable) sendMessage(ctx);
    }).catch(() => {});
  }, [state.sessionState, state.sessionDistractions]);

  // Watch — receive commands (pause/resume/stop)
  useEffect(() => {
    const unsub = watchEvents.addListener('message', (msg) => {
      const cmd = (msg as Record<string, string>).command;
      if (cmd === 'pause') dispatch({ type: 'PAUSE_SESSION' });
      if (cmd === 'resume') dispatch({ type: 'RESUME_SESSION' });
      if (cmd === 'stop') dispatch({ type: 'END_SESSION', payload: 'failure' });
    });
    return () => unsub();
  }, []);

  // Dismiss warning when session becomes active again
  useEffect(() => {
    if (state.sessionState === 'active' && showWarning) {
      Animated.timing(warningAnim, { toValue: 0, duration: 200, useNativeDriver: true })
        .start(() => setShowWarning(false));
    }
  }, [state.sessionState]);

  // AppState — detect when user leaves app during session
  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' && sessionStateRef.current === 'active') {
        dispatch({ type: 'PAUSE_SESSION' });
        dispatch({ type: 'ADD_DISTRACTION' });
      } else if (nextState === 'active' && sessionStateRef.current === 'paused') {
        // Returning after distraction — show persistent banner until user resumes
        warningAnim.setValue(0);
        Animated.timing(warningAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        setShowWarning(true);
      }
    };
    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, []);

  const isResult = state.sessionState === 'success' || state.sessionState === 'failure';
  const fc = calcFC(state.sessionDuration, state.sessionDistractions);

  return (
    <View style={styles.activeRoot}>
      {/* ── Distraction return warning — persistent until resumed ── */}
      {showWarning && (
        <Animated.View style={[styles.warningBanner, { opacity: warningAnim }]}>
          <View style={styles.warningDot} />
          <FText variant="numXs" color={Colors.market.bearish} style={{ flex: 1 }}>
            앱 이탈 감지 — 총 {state.sessionDistractions}회 · -{state.sessionDistractions * 3} FC 페널티
          </FText>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'RESUME_SESSION' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FText variant="numXs" color={Colors.accent.primary}>재개 →</FText>
          </TouchableOpacity>
        </Animated.View>
      )}

      <RingTimer
        elapsed={state.sessionElapsed}
        total={state.sessionDuration}
        state={state.sessionState}
      />

      {/* Distraction badge — visible during active/paused */}
      {!isResult && state.sessionDistractions > 0 && (
        <View style={styles.distractBadge}>
          <FText variant="numXs" color={Colors.market.bearish}>
            이탈 {state.sessionDistractions}회  ·  -{state.sessionDistractions * 3} FC
          </FText>
        </View>
      )}

      {!isResult && (
        <View style={styles.activeControls}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.controlBtnSecondary]}
            onPress={() =>
              state.sessionState === 'paused'
                ? dispatch({ type: 'RESUME_SESSION' })
                : dispatch({ type: 'PAUSE_SESSION' })
            }
          >
            <FText variant="bodyMedium" color={Colors.text.primary}>
              {state.sessionState === 'paused' ? '재개' : '일시정지'}
            </FText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, styles.controlBtnDanger]}
            onPress={() => dispatch({ type: 'END_SESSION', payload: 'failure' })}
          >
            <FText variant="bodyMedium" color={Colors.market.bearish}>중단</FText>
          </TouchableOpacity>
        </View>
      )}

      {state.sessionState === 'success' && (
        <View style={styles.resultBlock}>
          <Card variant="market-bull" padding={Spacing.lg} style={{ width: W - Spacing.base * 2 - Spacing.lg * 2 }}>
            <FText variant="h3" color={Colors.market.bullish}>세션 완료</FText>
            <FText variant="bodySmall" color={Colors.text.secondary} style={{ marginTop: 4 }}>
              Focus 자산 정산
            </FText>
            {/* FC breakdown */}
            <View style={styles.fcBreakdown}>
              <View style={styles.fcRow}>
                <FText variant="numXs" color={Colors.text.tertiary}>기본 수익</FText>
                <FText variant="numXs" color={Colors.market.bullish}>+{fc.base} FC</FText>
              </View>
              {fc.bonus > 0 && (
                <View style={styles.fcRow}>
                  <FText variant="numXs" color={Colors.text.tertiary}>무이탈 보너스</FText>
                  <FText variant="numXs" color={Colors.market.bullish}>+{fc.bonus} FC</FText>
                </View>
              )}
              {fc.penalty > 0 && (
                <View style={styles.fcRow}>
                  <FText variant="numXs" color={Colors.text.tertiary}>이탈 페널티 ({state.sessionDistractions}회)</FText>
                  <FText variant="numXs" color={Colors.market.bearish}>-{fc.penalty} FC</FText>
                </View>
              )}
              <View style={[styles.fcRow, styles.fcTotal]}>
                <FText variant="numSm" color={Colors.text.primary}>최종 수익</FText>
                <FText variant="numLg" color={Colors.market.bullish}>+{fc.final} FC</FText>
              </View>
            </View>
          </Card>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => dispatch({ type: 'RESET_SESSION' })}
          >
            <FText variant="label" color={Colors.text.tertiary}>홈으로  →</FText>
          </TouchableOpacity>
        </View>
      )}

      {state.sessionState === 'failure' && (
        <View style={styles.resultBlock}>
          <Card variant="market-bear" padding={Spacing.lg} style={{ width: W - Spacing.base * 2 - Spacing.lg * 2 }}>
            <FText variant="h3" color={Colors.market.bearish}>세션 중단</FText>
            <FText variant="bodySmall" color={Colors.text.secondary} style={{ marginTop: 4 }}>
              Focus 손실 처리
            </FText>
            <View style={styles.fcBreakdown}>
              <View style={styles.fcRow}>
                <FText variant="numXs" color={Colors.text.tertiary}>투자 원금 손실</FText>
                <FText variant="numXs" color={Colors.market.bearish}>-{state.sessionFocusInvested} FC</FText>
              </View>
              {state.sessionDistractions > 0 && (
                <View style={styles.fcRow}>
                  <FText variant="numXs" color={Colors.text.tertiary}>이탈 기록</FText>
                  <FText variant="numXs" color={Colors.volatility}>{state.sessionDistractions}회</FText>
                </View>
              )}
            </View>
          </Card>
          <TouchableOpacity
            style={[styles.startButton, { marginTop: Spacing.lg, backgroundColor: Colors.bg.elevated }]}
            onPress={() => dispatch({ type: 'RESET_SESSION' })}
          >
            <FText variant="bodyMedium" color={Colors.text.primary}>다시 시도</FText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function SessionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useFocus();
  const isSetup = state.sessionState === 'idle';

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor:
            state.sessionState === 'success' ? '#021A0E'
              : state.sessionState === 'failure' ? '#1A0202'
              : Colors.bg.primary,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />
      <View style={[styles.inner, { paddingTop: insets.top + 8, paddingBottom: isSetup ? 0 : insets.bottom + 80 }]}>
        {/* Minimal nav header */}
        <View style={styles.navHeader}>
          <TouchableOpacity
            onPress={() => {
              if (state.sessionState === 'active' || state.sessionState === 'paused') {
                Alert.alert(
                  '세션 진행 중',
                  '지금 나가면 세션이 중단되고 손실 처리돼요. 나갈까요?',
                  [
                    { text: '계속 투자', style: 'cancel' },
                    {
                      text: '나가기',
                      style: 'destructive',
                      onPress: () => {
                        dispatch({ type: 'END_SESSION', payload: 'failure' });
                        navigation.goBack();
                      },
                    },
                  ],
                );
              } else {
                navigation.goBack();
              }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FText variant="bodyMedium" color={Colors.text.secondary}>← 뒤로</FText>
          </TouchableOpacity>
          <FText variant="label" color={Colors.text.tertiary}>집중 투자</FText>
          <View style={{ width: 60 }} />
        </View>

        {isSetup ? (
          <SessionSetup navigation={navigation} />
        ) : (
          <ActiveSession />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: Spacing.base },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  setupContent: { paddingBottom: Spacing['3xl'], gap: Spacing.sm },
  setupHeader: { gap: 4, marginBottom: Spacing.sm },
  sectionLabel: { marginTop: Spacing.sm },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  durationCard: {
    width: (W - Spacing.base * 2 - Spacing.sm) / 2,
    gap: 4,
  },
  durationSelected: {},
  customCard: { width: '100%' },
  customCardInner: { gap: 4 },
  customInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  customInput: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.accent.primary,
    minWidth: 60,
    padding: 0,
  },
  startButtonDisabled: { backgroundColor: Colors.bg.elevated },
  durationMeta: { flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 2 },
  focusRow: { flexDirection: 'row', gap: Spacing.sm },
  focusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.card,
  },
  focusChipSelected: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.subtle,
  },
  summaryCard: { marginTop: Spacing.sm, gap: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  startButton: {
    backgroundColor: Colors.accent.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  homeBtn: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  // Active
  activeRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  ringOuter: { alignItems: 'center', justifyContent: 'center' },
  ringGlow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  ringCircle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.secondary,
  },
  ringInner: {
    position: 'absolute',
    width: CIRCLE_SIZE - 16,
    height: CIRCLE_SIZE - 16,
    borderRadius: (CIRCLE_SIZE - 16) / 2,
    borderWidth: 3,
  },
  ringContent: { alignItems: 'center', gap: 4 },
  activeControls: { flexDirection: 'row', gap: Spacing.md },
  controlBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  controlBtnSecondary: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.strong,
  },
  controlBtnDanger: {
    backgroundColor: Colors.market.bearishGlow,
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.25)',
  },
  resultBlock: { alignItems: 'center' },
  // Consent modal
  consentOverlay: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  consentSheet: {
    backgroundColor: Colors.bg.elevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    borderTopWidth: 1,
    borderColor: Colors.border.default,
  },
  consentHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  consentItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  consentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accent.primary + '15',
    borderWidth: 1,
    borderColor: Colors.accent.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  warningBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.market.bearishGlow,
    borderWidth: 1,
    borderColor: Colors.market.bearish + '40',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.market.bearish,
  },
  distractBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.market.bearishGlow,
    borderWidth: 1,
    borderColor: Colors.market.bearish + '30',
  },
  fcBreakdown: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  fcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fcTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
