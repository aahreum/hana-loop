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

### 사이드바 내부 라인

`NavigationDrawer` 의 헤더/회사 선택/푸터 구분선은 **모두 제거** (라이트/다크 모드 통일). 사이드바 배경이 다크 navy 로 고정이라 라이트 모드 본문(흰색)과의 대비에서 흰 라인이 두드러지는 문제가 있어, 라인 자체를 빼고 영역 구분은 `px/py` spacing 으로만.

회사 선택 select 박스의 외곽 `border` 도 동일 사유로 제거 — `bg-white/10` 으로만 영역 표시.

> 변경 이력: `border-white/10` → `border-white/5` → 완전 제거 (라이트 모드에서 어떤 alpha 도 흰색이 도드라짐).

### Popover — `src/shared/ui/popover.tsx`

Radix Popover wrapper (shadcn 패턴 준수). 헤더 액션 트리거에서 사용 — DateRangePicker (트리거 버튼 + From/To input + preset 버튼). align/sideOffset 기본값을 두고 호출부에서 className 으로 너비/패딩 조정.

> Dialog 와 차이: Popover 는 페이지 위에 떠있는 작은 floating 패널 (overlay 없음, esc 로 닫힘, 외부 클릭으로 닫힘). 모달 흐름이 필요 없으면 Popover 가 더 가벼운 인터랙션.

### 모달 / 바텀시트 — `AppDialogContent` 사용

shadcn `DialogContent` 의 기본값을 디자인 시스템 룰로 강제하는 wrapper 가 `AppDialogContent` (`src/shared/ui/app-dialog.tsx`).

| shadcn default | wrapper 강제값 | 이유 |
| --- | --- | --- |
| `bg-background` (`#f8fafc`) | `bg-surface` (`#ffffff`) | 카드/패널과 시각 위계 통일 |
| `grid` | `flex flex-col` | `gap-*` 호출부 제어가 직관적, 자식 row layout 에 grid 가 불필요 |

```tsx
// ✅ 권장
import { AppDialogContent } from '@/shared/ui/app-dialog';
<Dialog>
  <AppDialogContent className="gap-3 ...">...</AppDialogContent>
</Dialog>

// ❌ 금지 — bg-background 가 그대로 적용됨, grid layout 에서 gap 동작이 비직관적
<DialogContent>...</DialogContent>
```

shadcn 원본 `dialog.tsx` 는 수정하지 않는다(룰 준수). 호출부에서 className 으로 케이스별 override 가능.

### 모바일 바텀시트 표준

모바일(< lg)에서 다이얼로그를 화면 하단에 붙이는 형태로 사용. 다음 조합으로 일관성 유지:

```tsx
<AppDialogContent className={cn(
  // 화면 하단에 붙이고 상단만 라운드
  'left-0 top-auto bottom-0 max-w-full translate-x-0 translate-y-0',
  'rounded-b-none rounded-t-2xl border-x-0 border-b-0',
  // 최소 높이 보장 — 콘텐츠가 적어도 시트가 너무 얇지 않게
  'min-h-[300px]',
  // lg 이상: 가운데 모달 복귀
  'lg:left-[50%] lg:top-[50%] lg:bottom-auto',
  'lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%]',
  'lg:rounded-lg lg:border lg:min-h-0',
)}>
```

### 모바일 native date / month input 텍스트 크기

native `<input type="month">`, `<input type="date">` 의 picker 결과 텍스트는 일부 모바일 브라우저(Samsung Internet 등)에서 **OS system font size 설정** 을 따라가 18~20px 로 커지는 경우가 있다. `text-sm` 을 명시적으로 입혀서 부분적으로 보정.

```tsx
<Input type="month" className="cursor-pointer pr-10 text-sm" ... />
```

> 사용자 OS 폰트 설정이 매우 큰 경우엔 css 만으로 완전 제어가 어렵다. 근본 해결이 필요하면 native input 대신 custom picker (shadcn Calendar 등) 로 교체.

### 모바일 native date / month input — `appearance: none` 으로 native chrome 제거

일부 모바일 chromium(Samsung Internet 등)은 `<input type="date|month">` 에 picker indicator 외에 **별도 dropdown chevron 을 select 처럼 그린다**. 우리가 우측에 overlay 하는 Lucide `<Calendar>` 아이콘과 시각적으로 중첩되어 텍스트 영역이 잘리거나 두 아이콘이 겹쳐 보이는 문제가 있다. `globals.css` 에 `appearance: none` 을 추가해 native chrome 자체를 제거 (picker 동작은 유지 — 클릭 시 그대로 열림).

```css
input[type='date'],
input[type='month'],
input[type='time'],
input[type='datetime-local'],
input[type='week'] {
  position: relative;
  -webkit-appearance: none;
  appearance: none;
}
```

### 모바일 가로 스크롤 차단

`body { overflow-x: clip }` 을 base 에 적용. `NavigationDrawer` 가 모바일 닫힘 상태에서 `fixed left-0 w-60 -translate-x-full` 로 viewport 밖으로 transform 하는데, 일부 모바일 브라우저(안드로이드 Chrome / Samsung Internet 등)는 transform 후 위치까지 layout overflow 로 잡아 가로 스크롤이 발생. `clip` 은 `hidden` 과 달리 stacking context 를 만들지 않아 `position: sticky` 동작을 깨지 않는다.

### `scrollbar-gutter: stable` 은 데스크탑 한정

`html` 의 `scrollbar-gutter: stable` 은 **`@media (min-width: 1024px)` 안에서만** 적용한다. 모바일에서는 스크롤바가 평소 hidden 이라 gutter 만 예약되어 viewport 가 약 17px 줄어드는 부작용이 있다 (예: iPhone 14 414px → 396.5px). 이 손실분이 모바일 바텀시트의 `w-full` 폭에도 반영되어 시트가 viewport 끝까지 못 차게 된다.

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
