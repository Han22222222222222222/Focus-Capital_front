import { SessionHistory } from '../services/sessionService';

export type ReadinessLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface FocusReadiness {
  score: number;           // 0–100
  level: ReadinessLevel;
  label: string;
  reasons: string[];
  recommendation: string;
}

export function inferFocusReadiness(sessions: SessionHistory[]): FocusReadiness {
  if (sessions.length === 0) {
    return {
      score: 70,
      level: 'unknown',
      label: '데이터 없음',
      reasons: ['오늘 세션 기록이 없어요'],
      recommendation: '첫 세션을 완료하면 상태를 추론할 수 있어요.',
    };
  }

  let score = 70;
  const reasons: string[] = [];

  // 1. 마지막 세션 후 경과 시간
  const last = sessions[sessions.length - 1];
  const minsAgo = (Date.now() - new Date(last.created_at).getTime()) / 60000;

  if (minsAgo < 10) {
    score -= 25;
    reasons.push(`마지막 세션 종료 ${Math.round(minsAgo)}분 경과 — 회복 부족`);
  } else if (minsAgo < 30) {
    score -= 10;
    reasons.push(`마지막 세션 종료 ${Math.round(minsAgo)}분 경과`);
  } else if (minsAgo > 120) {
    score += 10;
    reasons.push(`${Math.round(minsAgo / 60)}시간 휴식 — 회복 충분`);
  }

  // 2. 오늘 이탈 누적
  const totalDistractions = sessions.reduce((a, s) => a + s.distractions, 0);
  if (totalDistractions >= 6) {
    score -= 25;
    reasons.push(`오늘 이탈 ${totalDistractions}회 누적 — 집중력 소진`);
  } else if (totalDistractions >= 3) {
    score -= 10;
    reasons.push(`오늘 이탈 ${totalDistractions}회 누적`);
  } else if (totalDistractions === 0) {
    score += 10;
    reasons.push('오늘 이탈 없음 — 집중 상태 양호');
  }

  // 3. 오늘 성공률
  const successCount = sessions.filter(s => s.result === 'success').length;
  const successRate = successCount / sessions.length;
  if (sessions.length >= 2 && successRate < 0.5) {
    score -= 20;
    reasons.push(`성공률 ${Math.round(successRate * 100)}% — 컨디션 저하 신호`);
  } else if (sessions.length >= 1 && successRate === 1) {
    score += 10;
    reasons.push(`성공률 100% (${sessions.length}세션)`);
  }

  // 4. 세션 수 과부하
  if (sessions.length >= 5) {
    score -= 15;
    reasons.push(`오늘 ${sessions.length}세션 — 과부하 주의`);
  } else if (sessions.length >= 3) {
    score -= 5;
    reasons.push(`오늘 ${sessions.length}세션 진행`);
  }

  score = Math.max(0, Math.min(100, score));

  let level: ReadinessLevel;
  let label: string;
  let recommendation: string;

  if (score >= 70) {
    level = 'high';
    label = '투자 적합';
    recommendation = '지금 세션을 시작하기 좋은 상태예요.';
  } else if (score >= 40) {
    level = 'medium';
    label = '보통';
    recommendation = '짧은 세션(15분)으로 시작하는 걸 권장해요.';
  } else {
    level = 'low';
    label = '휴식 권장';
    recommendation = '잠깐 쉬고 나서 도전하세요.';
  }

  return { score, level, label, reasons, recommendation };
}
