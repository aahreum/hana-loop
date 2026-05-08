# React / FSD 코딩 컨벤션

React 19 + TanStack Query v5 + FSD 환경에서 적용되는 코딩 규칙.
이 파일의 규칙은 `/ship` 커맨드 Phase 0 체크 대상이다.

---

## TanStack Query 로딩 상태 — `isPending` 사용

```ts
// ✅ 올바른 방식
const { data, isPending } = useQuery({ ... });
if (isPending) return <Skeleton />;

// ❌ 금지
const { data, isLoading } = useQuery({ ... });
```

`isLoading`은 v5에서 `isPending && isFetching`으로 재정의되었다.
retry backoff 중 `isFetching = false`가 돼 `isLoading = false`가 되므로 초기 로딩 상태를 정확히 표현하지 못한다.

---

## page 컴포넌트는 서버 컴포넌트 유지

```tsx
// ✅ 올바른 방식
// app/dashboard/page.tsx — 'use client' 없음
import { DashboardContainer } from '@/features/dashboard/container/DashboardContainer';
export default function DashboardPage() {
  return <DashboardContainer />;
}

// ❌ 금지
'use client';
export default function DashboardPage() { ... }
```

클라이언트 상태·훅이 필요하면 `features/{slice}/container/`에 Container를 만들어 page에서 import한다.

---

## JSX return 내 삼항연산자 지양 — 컴포넌트 분리 선호

```tsx
// ✅ 올바른 방식 — early return 또는 조건별 컴포넌트 분리
function ChartSection({ isPending, isError, data, onRetry }: Props) {
  if (isPending) return <ChartSkeleton />;
  if (isError) return <QueryErrorCard onRetry={onRetry} />;
  return <EmissionTrendChart data={data} />;
}

// ❌ 지양 — return 내 중첩 삼항
return (
  <div>{isPending ? <Spinner /> : isError ? <ErrorCard /> : <Chart />}</div>
);
```

---

## forwardRef 금지

React 19부터 `ref`를 일반 props로 직접 전달할 수 있다.

```tsx
// ✅ 올바른 방식 — React 19
function Input({ ref, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} {...props} />;
}

// ❌ 금지
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} />
));
```

---

## UI / Container 분리

```
features/{slice}/
  ui/         → 순수 렌더링. props만 받는다. 훅·비즈니스 로직 직접 사용 금지.
  container/  → 비즈니스 로직(훅) 연결 후 ui/ 컴포넌트에 주입.
  hooks/      → 데이터 페칭, 뮤테이션, 로컬 상태.
```

```tsx
// ✅ ui/ — props만 받아서 렌더링
export function ActivityTable({ activities, onDelete }: ActivityTableProps) {
  return <table>...</table>;
}

// ✅ container/ — 훅 연결 후 ui/에 주입
export function ActivityTableContainer() {
  const { data, deleteActivity } = useActivities();
  return <ActivityTable activities={data} onDelete={deleteActivity} />;
}
```

**Container 생성 기준:**

- 비즈니스 로직(훅, 뮤테이션) 연결이 필요한 경우 → container 생성
- 단순 레이아웃 조합이나 props 전달만 하는 경우 → container 생성 금지 (과도한 분리)

---

## 인터랙티브 요소 — `cursor-pointer` 필수

클릭·탭 가능한 모든 요소에 `cursor-pointer`를 명시한다.
브라우저 기본 cursor가 `default`인 경우가 많아 사용자가 클릭 가능 여부를 인식하지 못한다.

```tsx
// ✅ 올바른 방식
<button className="cursor-pointer ...">제출</button>
<div role="button" onClick={handleClick} className="cursor-pointer ...">카드</div>
<select className="cursor-pointer ...">...</select>
<label htmlFor="input" className="cursor-pointer ...">레이블</label>

// ❌ 금지 — cursor 미지정
<button className="rounded-md px-4 py-2">제출</button>
<div onClick={handleClick} className="rounded-md">카드</div>
```

**적용 대상**: `<button>`, `<select>`, `<label>`, `onClick` 핸들러가 있는 `<div>`/`<tr>`/`<th>` 등 모든 인터랙티브 요소.
**예외**:
- `<a>`, `<Link>` — 브라우저 기본값이 `cursor-pointer`이므로 명시 불필요

**shadcn 원본 베이스라인 (예외 처리됨)**: 일부 shadcn 컴포넌트에는 cursor-pointer 가 baseline class 로 박혀 있어 사용처에서 별도 명시 없이 자동 적용된다. 이 경우 호출부에서 중복 지정하지 않는다.

| 컴포넌트 | 위치 | baseline 클래스 |
| --- | --- | --- |
| `Button` | `src/shared/ui/button.tsx` | `cursor-pointer` (모든 variant 공통) |
| `SelectTrigger` | `src/shared/ui/select.tsx` | `cursor-pointer` |
| `DialogClose` (X 버튼) | `src/shared/ui/dialog.tsx` | `cursor-pointer` |
| `Label` | `src/shared/ui/label.tsx` | `cursor-pointer` (`peer-disabled:cursor-not-allowed` 와 공존) |

native date/month input 의 캘린더 picker pseudo-element 는 utility 로 잡을 수 없어 `globals.css` 에서 전역 처리:

```css
input[type='date']::-webkit-calendar-picker-indicator,
input[type='month']::-webkit-calendar-picker-indicator,
... { cursor: pointer; }
```

---

## `<a>` 태그 대신 Next.js `<Link>` 사용

Next.js 환경에서 내부 링크는 반드시 `next/link`의 `<Link>`를 사용한다.
`<a>` 태그는 전체 페이지 새로고침을 유발하고 prefetch, client-side navigation을 사용할 수 없다.

```tsx
// ✅ 올바른 방식
import Link from 'next/link';
<Link href="/activities">전체 보기 →</Link>
<Link href="https://example.com" target="_blank">외부 링크</Link>

// ❌ 금지
<a href="/activities">전체 보기 →</a>
<a href="https://example.com">외부 링크</a>
```

> FSD 레이어 구조 및 widgets/ 전체 규칙 → [`.claude/rules/fsd-architecture.md`](./fsd-architecture.md)
