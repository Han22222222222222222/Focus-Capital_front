/**
 * Focus Capital — in-memory state store (React context + useReducer).
 * No external state library needed for MVP.
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@focus_capital_flags';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MarketStatus = 'bull' | 'bear' | 'neutral' | 'volatile';
export type SessionState = 'idle' | 'active' | 'paused' | 'success' | 'failure';

export interface NewsItem {
  id: string;
  time: string;
  headline: string;
  detail: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  tag: string;
}

export interface FocusState {
  // Onboarding
  hasSeenOnboarding: boolean;
  hasSeenTour: boolean;
  hasAcceptedTracking: boolean;

  // Core metrics (0–100)
  focusIndex: number;
  dopamineLevel: number;
  recoveryLevel: number;
  volatility: number;

  // Market
  marketStatus: MarketStatus;
  dailyChange: number;        // e.g. +4.2 or -3.1
  dailyChangePercent: number; // e.g. +2.3 or -1.5

  // Chart data — last 30 points
  chartData: number[];

  // Session
  sessionState: SessionState;
  sessionDuration: number;   // seconds
  sessionElapsed: number;    // seconds
  sessionFocusInvested: number;
  sessionDistractions: number; // times user left the app

  // News feed
  news: NewsItem[];

  // Weekly data
  weeklyData: number[][];    // 7 days × hourly buckets
  weeklyFocusScores: number[]; // 7 daily scores
}

const generateChartData = (): number[] => {
  const base = 72;
  return Array.from({ length: 30 }, (_, i) => {
    return Math.max(20, Math.min(99,
      base + Math.sin(i * 0.4) * 12 + (Math.random() - 0.5) * 8
    ));
  });
};

const initialNews: NewsItem[] = [
  {
    id: '1',
    time: '14:23',
    headline: 'Focus Index +4.2% — 오전 세션 완료 영향',
    detail: '25분 집중 세션 마감 후 지수 반등. 오후 흐름 긍정적.',
    type: 'positive',
    tag: 'FOCUS',
  },
  {
    id: '2',
    time: '12:08',
    headline: '도파민 과열 — 점심 쇼츠 30분',
    detail: '숏폼 연속 시청으로 도파민 급등. 오후 세션 전 30분 냉각 권고.',
    type: 'negative',
    tag: 'DOPAMINE',
  },
  {
    id: '3',
    time: '11:30',
    headline: '변동성 상승 — 앱 전환 11회 감지',
    detail: 'SNS·메시지·뉴스 반복 전환. 집중 흐름 끊김 누적.',
    type: 'warning',
    tag: 'VOLATILITY',
  },
  {
    id: '4',
    time: '09:45',
    headline: '회복 지수 정상권 — 수면 8h',
    detail: '전날 오프라인 유지 및 충분한 수면. 오늘 컨디션 양호.',
    type: 'positive',
    tag: 'RECOVERY',
  },
  {
    id: '5',
    time: '어제',
    headline: '이번 주 Focus 최고점 기록',
    detail: '3세션 연속 완료. 집중 지속시간 개인 최장.',
    type: 'positive',
    tag: 'FOCUS',
  },
  {
    id: '6',
    time: '어제',
    headline: '회복 손실 — 취침 후 스마트폰 2h',
    detail: '야간 스마트폰 사용으로 수면 질 저하. 회복 지수 -28pt.',
    type: 'negative',
    tag: 'RECOVERY',
  },
];

const initialWeekly = Array.from({ length: 7 }, () => Array(24).fill(0));

const initialState: FocusState = {
  hasSeenOnboarding: false,
  hasSeenTour: false,
  hasAcceptedTracking: false,
  focusIndex: 847,
  dopamineLevel: 62,
  recoveryLevel: 78,
  volatility: 24,
  marketStatus: 'bull',
  dailyChange: 34,
  dailyChangePercent: 4.2,
  chartData: generateChartData(),
  sessionState: 'idle',
  sessionDuration: 25 * 60,
  sessionElapsed: 0,
  sessionFocusInvested: 40,
  sessionDistractions: 0,
  news: initialNews,
  weeklyData: initialWeekly,
  weeklyFocusScores: [72, 65, 81, 54, 88, 79, 84],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'RESET_TOUR' }
  | { type: 'ACCEPT_TRACKING' }
  | { type: 'SET_SESSION_DURATION'; payload: number }
  | { type: 'SET_SESSION_FOCUS'; payload: number }
  | { type: 'START_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'TICK_SESSION' }
  | { type: 'END_SESSION'; payload: 'success' | 'failure' }
  | { type: 'RESET_SESSION' }
  | { type: 'ADD_DISTRACTION' }
  | { type: 'TICK_CHART' }
  | { type: 'ADD_NEWS'; payload: NewsItem };

function calcChangePercent(totalDelta: number, newIndex: number): number {
  const base = newIndex - totalDelta;
  if (base <= 0) return Math.min(999, totalDelta);
  return Math.round(Math.max(-99, Math.min(999, (totalDelta / base) * 100)) * 10) / 10;
}

function reducer(state: FocusState, action: Action): FocusState {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...state, hasSeenOnboarding: true };
    case 'COMPLETE_TOUR':
      return { ...state, hasSeenTour: true };
    case 'RESET_TOUR':
      return { ...state, hasSeenTour: false };
    case 'ACCEPT_TRACKING':
      return { ...state, hasAcceptedTracking: true };
    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.payload };
    case 'SET_SESSION_FOCUS':
      return { ...state, sessionFocusInvested: action.payload };
    case 'START_SESSION':
      return { ...state, sessionState: 'active', sessionElapsed: 0, sessionDistractions: 0 };
    case 'PAUSE_SESSION':
      return { ...state, sessionState: 'paused' };
    case 'RESUME_SESSION':
      return { ...state, sessionState: 'active' };
    case 'TICK_SESSION': {
      if (state.sessionState !== 'active') return state;
      const newElapsed = state.sessionElapsed + 1;
      if (newElapsed >= state.sessionDuration) {
        const distractPenalty = state.sessionDistractions * 2;
        const deltaIndex = Math.max(5, Math.round(newElapsed / 60) - distractPenalty);
        const newIndex = Math.max(0, Math.min(999, state.focusIndex + deltaIndex));
        return {
          ...state,
          sessionElapsed: newElapsed,
          sessionState: 'success',
          focusIndex: newIndex,
          dailyChange: state.dailyChange + deltaIndex,
          dailyChangePercent: calcChangePercent(state.dailyChange + deltaIndex, newIndex),
        };
      }
      return { ...state, sessionElapsed: newElapsed };
    }
    case 'END_SESSION': {
      const isSuccess = action.payload === 'success';
      const distractPenalty = state.sessionDistractions * 2;
      const deltaIndex = isSuccess
        ? Math.max(5, Math.round(state.sessionElapsed / 60) - distractPenalty)
        : -Math.max(3, Math.round(state.sessionElapsed / 60 * 0.3));
      const newIndex = Math.max(0, Math.min(999, state.focusIndex + deltaIndex));
      const totalDelta = state.dailyChange + deltaIndex;
      return {
        ...state,
        sessionState: action.payload,
        focusIndex: newIndex,
        dailyChange: totalDelta,
        dailyChangePercent: calcChangePercent(totalDelta, newIndex),
      };
    }
    case 'RESET_SESSION':
      return { ...state, sessionState: 'idle', sessionElapsed: 0, sessionDistractions: 0 };
    case 'ADD_DISTRACTION':
      return { ...state, sessionDistractions: state.sessionDistractions + 1 };
    case 'TICK_CHART': {
      const last = state.chartData[state.chartData.length - 1];
      const next = Math.max(20, Math.min(99, last + (Math.random() - 0.48) * 3));
      return {
        ...state,
        chartData: [...state.chartData.slice(1), next],
      };
    }
    case 'ADD_NEWS':
      return {
        ...state,
        news: [action.payload, ...state.news].slice(0, 20),
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FocusContext = createContext<{
  state: FocusState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore persisted flags on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const flags = JSON.parse(raw);
        if (flags.hasSeenOnboarding) dispatch({ type: 'COMPLETE_ONBOARDING' });
        if (flags.hasSeenTour) dispatch({ type: 'COMPLETE_TOUR' });
        if (flags.hasAcceptedTracking) dispatch({ type: 'ACCEPT_TRACKING' });
      } catch {}
    }).catch(() => {});
  }, []);

  // Persist flags whenever they change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      hasSeenOnboarding: state.hasSeenOnboarding,
      hasSeenTour: state.hasSeenTour,
      hasAcceptedTracking: state.hasAcceptedTracking,
    }));
  }, [state.hasSeenOnboarding, state.hasSeenTour, state.hasAcceptedTracking]);

  return (
    <FocusContext.Provider value={{ state, dispatch }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used inside FocusProvider');
  return ctx;
}
