# 디자인 시스템

## 컬러 팔레트

탄소 관리 SaaS의 특성상 신뢰감 있는 다크 네이비 + 브랜드 블루/그린 계열로 구성.
모든 색상은 `src/app/globals.css`의 CSS 변수로 관리하며, Tailwind 유틸리티(`text-text`, `bg-surface` 등)로 참조한다.

```css
/* 브랜드 */
--primary: #308af9;          /* HanaLoop 블루 */
--brand-green: #4bb074;      /* 친환경 그린 */
--brand-gradient: linear-gradient(135deg, #4bb074 0%, #308af9 100%);

/* 사이드바 — 라이트/다크 모드 공통 */
--sidebar-bg: #0d1b3e;       /* 다크 네이비 */
--sidebar-active-bg: #1a2c5c;

/* Surface (모드별로 다름) */
--bg: #f8fafc;               /* 페이지 배경 */
--surface: #ffffff;          /* 카드/패널 */
--border: #e2e8f0;
--text: #0f172a;

/* GHG Scope — 차트 고정 색상 (변경 금지) */
--scope1: #ef4444;           /* Scope 1: 직접 배출 */
--scope2: #f59e0b;           /* Scope 2: 간접 배출 */
--scope3: #3b82f6;           /* Scope 3: 가치사슬 */

/* GHG Scope 텍스트용 — WCAG AA 4.5:1 충족 (라이트/다크 분기) */
--scope1-text: #b91c1c (light) / #fca5a5 (dark)
--scope2-text: #b45309 (light) / #fcd34d (dark)
--scope3-text: #1d4ed8 (light) / #93c5fd (dark)

/* 활동 카테고리 차트 fill — 라이트/다크 분기 (globals.css) */
--chart-cat-electricity:  #1e40af (light) / #60a5fa (dark)
--chart-cat-raw-material: #0891b2 (light) / #22d3ee (dark)
--chart-cat-transport:    #16a34a (light) / #4ade80 (dark)
```

라이트는 흰 배경에서 채도가 너무 도드라지지 않도록 deep tone, 다크는 어두운 배경에 묻히지 않게 lighter tone. `chartColors.ts` 의 `categories` 는 hex 대신 `var(--chart-cat-*)` 를 참조해 SVG fill 에서 자동 분기된다.

### 색상 접근성 정책

차트 fill 컬러(`--scope1/2/3`)는 GHG Protocol 컨벤션 준수상 변경 금지.
텍스트 가독성은 별도의 darker/lighter 시맨틱 토큰(`--scope*-text`)로 분리 — 라이트 배경 위에서는 `*-700`, 다크 배경 위에서는 `*-300`을 사용해 4.5:1 이상 보장.

배출량 등급 게이지(`gaugeZones`) 색상 5종은 white text 기준 5:1 이상 만족하도록 darker 톤(violet-600 / blue-600 / sky-700 / yellow-700 / green-700)으로 채택.

## 다크모드

### 동작 방식

| 우선순위 | 조건 | 적용 |
| --- | --- | --- |
| 1순위 | 사용자가 서비스에서 명시적으로 설정한 테마 | localStorage에 저장된 값 (`hanaloop-ui` 키) |
| 2순위 | 시스템 설정 | `@media (prefers-color-scheme: dark)` CSS 폴백 |

### 구현

- `shared/lib/store/uiStore.ts` — `theme: 'light' | 'dark' | null` 상태, Zustand persist로 localStorage 저장
- `shared/hooks/useTheme.ts` — `resolvedTheme` 계산 (null이면 시스템 설정 참조)
- `shared/ui/theme-toggle.tsx` — 헤더 우측 Sun/Moon 아이콘 토글 버튼
- `widgets/layout/ui/AppShell.tsx` — `useEffect`로 `<html>` class(`dark`/`light`) 제어

### CSS 클래스 규칙

```css
:root          /* class 없음 → @media prefers-color-scheme으로 폴백 */
:root.light    /* 라이트 모드 강제 */
:root.dark     /* 다크 모드 강제 */
```

다크모드에서 Surface 토큰: `--bg: #0a0a0a`, `--surface: #111827`, `--border: #1e293b`, `--text: #f8fafc`

### Tailwind v4 — `border` 기본 색 토큰 강제

Tailwind v4 부터 `border` 유틸(색 미지정)의 기본값이 `currentColor` 라, 다크 모드에서 본문 텍스트 색(흰색)이 그대로 border 로 노출되는 문제가 있다. `globals.css` 에서 universal selector 로 `--border` 를 강제한다.

```css
*, ::before, ::after {
  border-color: var(--border);
}
```

shadcn 원본 컴포넌트가 `border` (색 미지정) 만 쓰는 케이스에도 디자인 토큰이 자동 적용된다.

## 타이포그래피

### 폰트 로딩

`next/font/local`로 Pretendard Variable 단일 woff2 파일을 self-host.

- 위치: `src/app/fonts/PretendardVariable.woff2` (~2MB, weight 45~930 단일 파일)
- 진입점: `src/app/layout.tsx`에서 `localFont()` 선언 + `<html className={pretendard.variable}>` 적용
- CSS 변수: `--font-pretendard` 자동 주입 (`globals.css`의 `body`, `kbd`에서 참조)

이점:
- 빌드 타임 메트릭 분석 → `size-adjust` 자동 적용 → CLS 0
- 폰트 파일 자동 preload (`<link rel="preload">`)
- weight별 별도 파일 불필요 (`@fontsource/pretendard` 대비 ~3MB 절감)

### 헤딩 계층

시맨틱 레벨과 시각 크기를 함께 정의. 시각 우선순위는 페이지 타이틀 < 카드 헤더 (내용이 우선).

| 태그 | 용도                                  | 크기            | 컬러                    | 스타일                          |
| ---- | ------------------------------------- | --------------- | ----------------------- | ------------------------------- |
| h1   | 로고 (HanaLoop, NavigationDrawer)     | 16px (text-base) | sidebar-text (white)    | font-semibold tracking-tight    |
| h2   | 페이지 타이틀 (대시보드, 활동 데이터) | 18px (text-lg)  | text-muted-foreground   | font-semibold                   |
| h3   | 섹션 라벨 (현재 상태, 원인 파악)      | 16px (text-base) | text-muted-foreground   | font-semibold uppercase tracking-wider |
| h4   | 카드 헤더 (활동 유형별 비중 등)       | 18px (text-lg)  | text-text               | font-semibold + 아이콘(h-5 w-5) |

> 일반 텍스트 스케일 (본문/수치)
> ```
> 본문: 14px / font-normal / text-text
> 보조: 12px / font-normal / text-muted-foreground
> KPI 수치: 24px (text-2xl) / font-bold tabular-nums / text-text
> ```

## 컴포넌트 규칙

### KPI 카드

```
┌─┬─────────────────────────┐
│▎│ 제목              [아이콘]│  ← 좌측 톤 stripe + 우측 톤 아이콘 박스
│▎│                         │
│▎│ 수치 (24px bold)        │
│▎│ 해석 문구 (톤 컬러)       │
│▎│ ▲ +X.X% 보조 텍스트      │
└─┴─────────────────────────┘
```

- 배경: bg-surface, 테두리: border-border (rounded-xl)
- **톤 시스템** (`InsightTone`: `good` / `warn` / `neutral`):
  - 좌측 stripe (1px 컬러 라인): good=trend-down(green), warn=trend-up(red), neutral=gray-300
  - 우측 아이콘 박스 배경: good=`bg-trend-down/10`, warn=`bg-trend-up/10`, neutral=`bg-primary-bg`
  - 해석 문구 컬러: 같은 톤 매핑
- 톤 미지정 카드(총 배출량 등)는 기존 brand blue 유지

### 카드 섹션 헤더 (CardSectionHeader)

```
┌────────────────────────────┐
│ [icon] 카드 제목   [action] │  ← h4, text-lg, text-text
│ 보조 설명 텍스트              │  ← text-xs, text-muted-foreground
│ ────────────────────────── │  ← border-b, pb-3
│ [content]                  │
└────────────────────────────┘
```

- **타이틀**: `<h4>` + 아이콘(h-5 w-5 muted) + 텍스트 (text-lg, text-text, font-semibold)
- **action 슬롯**: 우측 상단 — 도움말 툴팁 등 (예: 도넛의 "계산식 ?")
- **하단 디바이더**: `border-b border-border pb-3 mb-4`

### 자동 인사이트 리스트 (InsightList)

```
[✨ 자동 분석]
  🔴 운송 사용량이 200% 증가했습니다
  🟢 원소재 활동은 최근 감소 추세입니다 (42%↓)
```

- 헤더 (선택): Sparkles 아이콘 + uppercase tracking-wider 텍스트
- 항목: 24px 컬러 동그라미 아이콘 (TrendingUp red / TrendingDown green / Minus gray) + 텍스트
- 정렬: `items-center` (한 줄/여러 줄 모두 아이콘이 텍스트 중앙)
- **수치 자동 강조**: `\d+(\.\d+)?%[↓↑]?` 패턴 → `<strong>` 자동 감싸기 (룰 함수는 평문 유지)

### 도움말 툴팁 (UnitTooltip)

용어/단위/계산식 등을 `?` 아이콘으로 노출. 호버/포커스 시 본문 + 보조 비교 문구.

- 트리거: `<button>` + 라벨(선택) + HelpCircle 아이콘
- 컨텐츠: `border border-border bg-surface px-4 py-3 shadow-xl whitespace-nowrap`
- `description`/`comparison`은 `string | ReactNode` — 다중 라인은 ReactNode로 `<span className="block">` 구조화 가능
- 사용 예: tCO₂e 단위 안내, 도넛의 계산식 안내, 최근 활동 테이블의 Scope 컬럼 정의

### 차트 컨테이너

```
┌─────────────────────────┐
│ [icon] 카드 제목         │
│ 보조 설명                 │
│─────────────────────────│
│                         │
│     차트 영역            │
│                         │
│ [✨ 분석/요약 인사이트]    │
└─────────────────────────┘
```

### Navigation Drawer

- 너비: 240px (데스크탑)
- 배경: `--sidebar-bg: #0d1b3e` (다크 네이비, 라이트/다크 모드 동일)
- 텍스트: white / `--sidebar-muted: #93c5fd` (비활성)
- 활성 항목: 브랜드 그라디언트 배경(`#4bb074 → #308af9`), white 텍스트

## 반응형 브레이크포인트

| 브레이크포인트 | 레이아웃                            |
| -------------- | ----------------------------------- |
| < 768px (md)   | Drawer 숨김, 햄버거 버튼 → 오버레이 |
| 768px ~ 1280px | Drawer 고정, KPI 카드 2열           |
| > 1280px       | Drawer 고정, KPI 카드 4열           |

## 인터랙션

- 버튼 hover: opacity-90, transition-opacity 150ms
- 카드 hover: shadow 증가, transition 200ms
- 드로어 오픈/클로즈: slide-in/out 애니메이션 (300ms)
- 차트 툴팁: 포인트 hover 시 표시, 배경 white/shadow
