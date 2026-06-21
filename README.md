# Focus Capital

사용자의 집중력·도파민·회복·변동성을 **주식 시장**처럼 시각화하는 정신 금융 플랫폼.

> "공부 타이머"가 아닌 **집중력 자산 관리 앱** — 핀테크/터미널 감성의 다크 UI로 집중 세션을 투자처럼 관리한다.

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | React Native 0.85.3 (Expo 미사용, bare workflow) |
| 언어 | TypeScript |
| 내비게이션 | React Navigation 7 (Bottom Tabs + Native Stack) |
| 애니메이션 | react-native-reanimated 3, RN Animated API |
| 차트/SVG | react-native-svg 15 |
| 제스처 | react-native-gesture-handler 2 |
| Safe Area | react-native-safe-area-context 5 |
| 백엔드/DB | Supabase (@supabase/supabase-js 2) |
| Watch 연동 | react-native-watch-connectivity 2 |
| 상태 관리 | React Context + useReducer |

---

## 폴더 구조

```
src/
  theme/
    colors.ts         — 전체 컬러 시스템 (Colors 객체)
    typography.ts     — SF Pro / SF Mono 기반 타입 스케일
    spacing.ts        — Spacing, Radius 토큰
    index.ts          — re-export
  store/
    focusStore.ts     — FocusProvider, useFocus hook, FocusState, Action
  services/
    sessionService.ts — Supabase 세션 저장/조회
    supabaseClient.ts — Supabase 클라이언트 초기화
  components/
    common/
      FText.tsx       — Typography variant 기반 텍스트 컴포넌트
      Card.tsx        — 테두리/배경 variant 카드
      Divider.tsx     — 구분선
    charts/
      SparkLine.tsx   — SVG 라인 차트 (그라디언트 fill)
      MiniBar.tsx     — 바 차트 (7일 주간)
      HeatMap.tsx     — 7×24 히트맵
  navigation/
    index.tsx         — AppNavigator (NavigationContainer + Tab.Navigator)
    TabBar.tsx        — 커스텀 탭바 (플로팅, 중앙 Session 버튼)
  screens/
    HomeScreen/       — 메인 대시보드 (지수, 차트, 최근 세션 기록)
    SessionScreen/    — 집중 투자 세션 (링 타이머, 앱 이탈 감지, Watch 연동)
    NewsScreen/       — 정신 시장 뉴스 (사용자 행동을 금융 뉴스 어조로 표현)
    AnalyticsScreen/  — 주간 분석 (히트맵, 바 차트)
    GlossaryScreen/   — 용어 사전
    OnboardingScreen/ — 온보딩
```

---

## 핵심 기능

### Focus Index (집중력 지수)
- 0–999 범위의 집중력 자산 지수
- 세션 성공/실패에 따라 실시간 반영
- SparkLine 차트로 30개 데이터 포인트 시각화

### 집중 세션 (SessionScreen)
- **링 타이머** — 원형 애니메이션으로 남은 시간 표시
- **앱 이탈 감지** — 세션 중 다른 앱 전환 시 Focus Capital 차감
- **Apple Watch 연동** — 세션 상태 및 타이머를 Watch에 실시간 전송
- **세션 결과 저장** — 완료 시 Supabase DB에 자동 저장

### 상태 지표
| 지표 | 역할 |
|---|---|
| `dopamineLevel` | 도파민 수준 (0–100) |
| `recoveryLevel` | 회복력 수준 (0–100) |
| `volatility` | 변동성 (0–100) |
| `marketStatus` | `bull / bear / neutral / volatile` |

### 뉴스 피드 (NewsScreen)
사용자의 집중 행동을 금융 뉴스 어조("집중력 지수 급등", "도파민 시장 과열")로 표현

---

## 세션 상태 플로우

```
idle ──(START_SESSION)──▶ active
                              │
              ┌───────────────┴──────────────┐
              ▼                              ▼
      (TICK × N 완료)               (END_SESSION failure)
           success                        failure
              │                              │
              └──────────(RESET_SESSION)─────┘
                                │
                               idle
```

---

## 컬러 시스템 (다크 고정)

| 역할 | 색상 |
|---|---|
| 배경 Primary | `#080808` |
| 카드 배경 | `#111111` |
| 네온 블루 (accent) | `#00D4FF` |
| 상승 (bullish) | `#26D07C` |
| 하락 (bearish) | `#FF4D4D` |
| 도파민 | `#B857F5` |
| 변동성 | `#F59E0B` |

---

## 실행 방법

### 사전 조건
- Node.js 18+
- Xcode (iOS 빌드용)
- CocoaPods

### 설치

```bash
npm install
cd ios && pod install && cd ..
```

### 개발 서버 시작

**터미널 1 — Metro 번들러:**
```bash
kill $(lsof -t -i:8081) 2>/dev/null
npx react-native start
```

**터미널 2 — iOS 빌드 (최초 1회 또는 네이티브 코드 변경 시):**
```bash
npx react-native run-ios
```

> 두 번째 실행부터는 Metro만 켜두고 시뮬레이터에서 앱 직접 실행.
> 앱 화면에서 **Cmd+R** 을 누르면 JS 번들 리로드.

---

## 환경 변수

프로젝트 루트에 `.env` 파일 생성:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 커밋 컨벤션

```
feat:     새로운 기능
fix:      버그 수정
refactor: 리팩터링
chore:    빌드/설정 변경
docs:     문서 수정
```
