# 디자인 시스템

## 컬러 팔레트

탄소 관리 SaaS의 특성상 신뢰감 있는 다크 네이비 + 친환경 그린 계열로 구성.

```css
/* 기본 토큰 (Tailwind 커스텀 컬러) */
--color-brand-primary: #10b981; /* Emerald-500: 친환경 포인트 */
--color-brand-dark: #064e3b; /* Emerald-900: 사이드바 배경 */
--color-surface: #f8fafc; /* Slate-50: 메인 배경 */
--color-surface-card: #ffffff; /* 카드 배경 */
--color-text-primary: #0f172a; /* Slate-900 */
--color-text-secondary: #64748b; /* Slate-500 */
--color-border: #e2e8f0; /* Slate-200 */

/* Scope 색상 (차트용) */
--color-scope1: #ef4444; /* Red: 직접 배출 (위험) */
--color-scope2: #f59e0b; /* Amber: 간접 배출 (주의) */
--color-scope3: #3b82f6; /* Blue: 가치사슬 배출 (정보) */

/* 상태 색상 */
--color-increase: #ef4444; /* 증가 */
--color-decrease: #10b981; /* 감소 */
```

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
- 배경: Emerald-900 (#064E3B)
- 텍스트: white / emerald-200 (비활성)
- 활성 항목: Emerald-700 배경, white 텍스트

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
