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
```

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

다크모드에서 Surface 토큰: `--bg: #0a0a0a`, `--surface: #111827`, `--border: #1f2937`, `--text: #f8fafc`

## 타이포그래피

```
제목 (h1): 24px / font-bold / text-slate-900
소제목 (h2): 18px / font-semibold / text-slate-800
카드 제목: 14px / font-medium / text-slate-600
본문: 14px / font-normal / text-slate-700
수치 (KPI): 32px / font-bold / text-slate-900
보조 텍스트: 12px / font-normal / text-slate-500
```

## 컴포넌트 규칙

### KPI 카드

```
┌─────────────────────────┐
│ 아이콘  제목             │
│                         │
│ 수치 (32px bold)        │
│ ▲ +12.3% 지난달 대비    │
└─────────────────────────┘
```

- 배경: white
- 테두리: 없음, 그림자: shadow-sm
- 호버: shadow-md 전환

### 차트 컨테이너

```
┌─────────────────────────┐
│ 제목              [필터] │
│─────────────────────────│
│                         │
│     차트 영역            │
│                         │
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
