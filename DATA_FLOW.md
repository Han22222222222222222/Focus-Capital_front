# Focus Capital — Data Flow 문서

## 기술 선택 이유

| 기술 | 선택 이유 |
|---|---|
| **Supabase** | PostgreSQL 기반 무료 BaaS. REST API 자동 생성, 환경변수로 키 관리, RLS로 보안 처리 가능 |
| **React Context + useReducer** | 외부 라이브러리 없이 단방향 상태 흐름 구현. Action 타입이 명확해 디버깅 용이 |
| **react-native-watch-connectivity** | Apple Watch와 세션 상태 실시간 동기화. 별도 서버 없이 기기 간 직접 통신 |

---

## 전체 상태 구조 (`focusStore.tsx`)

```
FocusState
├── hasSeenOnboarding       앱 최초 실행 여부
├── hasAcceptedTracking     앱 이탈 감지 동의 여부
├── focusIndex              집중력 지수 (0–999)
├── dopamineLevel           도파민 수치 (0–100)
├── recoveryLevel           회복 수치 (0–100)
├── volatility              변동성 (0–100)
├── marketStatus            bull | bear | neutral | volatile
├── sessionState            idle | active | paused | success | failure
├── sessionDuration         목표 시간 (초)
├── sessionElapsed          경과 시간 (초)
├── sessionDistractions     앱 이탈 횟수
├── sessionFocusInvested    투자 FC 량
├── chartData               최근 30개 포인트 (실시간)
├── news                    NewsItem[] (최대 20개, 최신순)
├── weeklyData              7×24 히트맵 (초기값 랜덤)
└── weeklyFocusScores       7일치 점수 (초기값 고정)
```

**상태 변경 규칙**: 모든 변경은 `dispatch(Action)` 을 통해서만 가능. 직접 mutate 불가.

---

## Flow 1 — 앱 시작 / 온보딩

```
앱 실행
  │
  ▼
App.tsx → FocusProvider 마운트 (initialState 주입)
  │
  ▼
AppNavigator (navigation/index.tsx)
  │
  ├─ hasSeenOnboarding === false
  │     ▼
  │   OnboardingScreen
  │     │  슬라이드 6장 확인
  │     ▼
  │   "시작하기" 버튼
  │     │  dispatch({ type: 'COMPLETE_ONBOARDING' })
  │     │  → state.hasSeenOnboarding = true
  │     ▼
  │   Bottom Tab Navigator (홈 화면)
  │
  └─ hasSeenOnboarding === true
        ▼
      Bottom Tab Navigator (홈 화면)
```

---

## Flow 2 — 집중 세션 (핵심 기능)

```
[HomeScreen] 탭바 중앙 버튼 탭
  │
  ▼
SessionScreen — idle 상태 (SessionSetup 렌더)
  │
  ├─ 최초 실행: hasAcceptedTracking === false
  │     ▼
  │   TrackingConsentModal 표시
  │     │  동의 → dispatch(ACCEPT_TRACKING)
  │     │  비동의 → 세션 시작 불가 (버튼 비활성)
  │
  ├─ 시간 선택 (15·25·45·90분 또는 직접 입력)
  │     dispatch(SET_SESSION_DURATION)
  │
  ├─ 투자 FC 선택 (20·30·40·60·80)
  │     dispatch(SET_SESSION_FOCUS)
  │
  └─ "투자 시작" 버튼
        dispatch(START_SESSION)
        → sessionState: idle → active
        → sessionElapsed = 0

  ┌─────────────────────────────────────────┐
  │           active 상태 (1초 인터벌)        │
  │  setInterval → dispatch(TICK_SESSION)   │
  │  sessionElapsed += 1 (매 초)             │
  │                                         │
  │  [AppState 감지]                        │
  │  앱 → background: dispatch(PAUSE_SESSION)│
  │                  dispatch(ADD_DISTRACTION)│
  │  앱 → foreground: 경고 배너 표시          │
  │                                         │
  │  [Watch 연동]                            │
  │  세션 상태 변경 → updateApplicationContext│
  │  Watch에서 명령 수신 → pause/resume/stop  │
  └─────────────────────────────────────────┘
        │
        ├─ sessionElapsed >= sessionDuration
        │     dispatch(END_SESSION) 자동
        │     → sessionState: success
        │
        └─ "중단" 버튼 / Watch stop 명령
              dispatch(END_SESSION, 'failure')
              → sessionState: failure

  [success / failure 확정 시]
        │
        ├─ FC 정산
        │   성공: base - (distractions × 3) + (무이탈 보너스 5)
        │   실패: -sessionFocusInvested
        │
        ├─ saveSession() → Supabase INSERT
        │   테이블: session_records
        │   컬럼: duration_seconds, result, distractions,
        │         fc_earned, focus_invested, created_at
        │
        │   실패 시: { success: false, error: message }
        │            → 앱은 멈추지 않음 (fire-and-forget)
        │
        ├─ dispatch(ADD_NEWS)
        │   buildNewsItem(result, elapsed, distractions, fcEarned)
        │   → state.news 맨 앞에 추가 (최대 20개 유지)
        │
        └─ "확인" 버튼
              dispatch(RESET_SESSION)
              → sessionState: idle
              → elapsed = 0, distractions = 0
```

---

## Flow 3 — 홈 화면 세션 기록 조회

```
HomeScreen 마운트
  │
  ▼
RecentSessions 컴포넌트
  │  loading = true, error = null
  ▼
fetchRecentSessions(limit=3)
  │  Supabase: SELECT * FROM session_records
  │            ORDER BY created_at DESC LIMIT 3
  │
  ├─ 성공
  │   setSessions(data)
  │   loading = false
  │   → 세션 카드 렌더 (완료/중단 배지, FC, 이탈 횟수)
  │
  ├─ 데이터 없음 (data.length === 0)
  │   → Empty State: "아직 세션 기록이 없어요"
  │
  └─ 실패 (네트워크 오류 등)
      setError(message)
      loading = false
      → Error State: "연결 오류 — {message}" + 다시 시도 버튼
```

---

## Flow 4 — Analytics 주간 분석

```
AnalyticsScreen 마운트
  │
  ▼
fetchWeeklyAnalytics()
  │  Supabase: SELECT * FROM session_records
  │            WHERE created_at >= (오늘 - 6일 00:00:00)
  │            ORDER BY created_at ASC
  │
  ├─ 성공 (sessions 배열 반환)
  │   │
  │   ├─ dailyMinutes 계산
  │   │   sessions → 날짜별 집중 시간(분) [7개]
  │   │   → SparkLine, MiniBar 차트 데이터
  │   │
  │   ├─ heatmapData 계산
  │   │   sessions → 요일×시간대 분포 → 0-100 정규화
  │   │   → HeatMap 컴포넌트 데이터
  │   │
  │   └─ KPI 계산
  │       총 세션 수, 성공률, 총 FC, 총 집중 시간
  │       최고 활동 시간, 평균 이탈 횟수
  │
  ├─ 데이터 없음
  │   → Empty State: "이번 주 세션 기록이 없어요"
  │
  └─ 실패
      → Error State: "연결 오류" + 다시 시도 버튼
```

---

## Flow 5 — 뉴스 피드

```
뉴스 소스: state.news (focusStore)

초기값: initialNews (6개 하드코딩 샘플)

업데이트: 세션 종료 시 자동 생성
  result = success/failure
  distractions 횟수
  경과 시간
  fcEarned
    │
    ▼
  buildNewsItem() → NewsItem 생성
    type: positive | negative | warning
    tag:  FOCUS | DOPAMINE | VOLATILITY
    headline, detail: 결과 조합에 따라 분기
    │
    ▼
  dispatch(ADD_NEWS)
  → state.news = [새 항목, ...기존].slice(0, 20)

NewsScreen 렌더
  state.news → 필터(tag) → FlatList
  필터 없음 시 Empty State 표시
```

---

## API 레이어 구조

```
src/
  lib/
    supabase.ts         createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
                        환경변수: @env (react-native-dotenv)

  services/
    sessionService.ts
      saveSession()           INSERT session_records
      fetchRecentSessions()   SELECT (최근 N개)
      fetchWeeklyAnalytics()  SELECT (7일 이내 전체)
```

모든 서비스 함수는 `try/catch`로 감싸고 `{ data, error }` 형태로 반환.  
호출부에서 `error` 여부를 확인해 Loading / Error / Empty 분기 처리.

---

## 실패 처리 요약

| 상황 | 처리 방식 |
|---|---|
| Supabase INSERT 실패 (세션 저장) | 에러 반환, 앱 흐름 유지 (fire-and-forget) |
| Supabase SELECT 실패 (홈 기록) | Error State 표시 + 다시 시도 버튼 |
| Supabase SELECT 실패 (Analytics) | Error State 표시 + 다시 시도 버튼 |
| 데이터 없음 | Empty State 별도 UI 표시 |
| 앱 이탈 감지 동의 거부 | 세션 시작 불가, Modal 유지 |
| Watch 연결 불가 | try/catch 무시, 세션은 정상 진행 |
| 잘못된 커스텀 시간 입력 | 숫자 외 입력 필터, 1분 미만 시 버튼 비활성 |
