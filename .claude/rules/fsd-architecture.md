# FSD (Feature-Sliced Design) 아키텍처 규칙

이 파일의 규칙은 `/ship` 커맨드 Phase 0 체크 대상이다.

---

## 레이어 구조

```
app/        → Next.js 라우팅만 (page.tsx, layout.tsx, route.ts)
widgets/    → 조합형 UI 블록 (Header, Sidebar 등 — 여러 feature/shared를 조합)
features/   → 기능 단위 슬라이스
shared/     → 전역 공유 코드
data/       → 정적 Seed 데이터 (수정 금지)
```

---

## 의존성 방향 (단방향)

```
app  →  widgets  →  features  →  shared
                             ↗
                       data (독립, 다른 레이어 import 금지)
```

- `widgets/A`는 `widgets/B`를 import할 수 없다 (위젯 간 금지)
- `features/A`는 `features/B`를 import할 수 없다 (슬라이스 간 금지)
- `features/`는 `widgets/`를 import할 수 없다
- `shared/`는 어떤 레이어도 import할 수 없다
- `data/`는 어떤 레이어도 import할 수 없다

---

## features/ 내부 구조

```
features/{slice}/
  ui/         → 순수 렌더링. props만 받는다. 훅·비즈니스 로직 직접 사용 금지.
  hooks/      → 데이터 페칭, 뮤테이션, 로컬 상태 관리.
  container/  → 비즈니스 로직(훅) 연결 후 ui/ 컴포넌트에 주입. (필요 시에만)
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

// ❌ 금지 — ui/ 안에서 훅 직접 사용
export function ActivityTable() {
  const { data } = useActivities();
  ...
}
```

**Container 생성 기준:**
- 비즈니스 로직(훅, 뮤테이션) 연결이 필요한 경우 → container 생성
- 단순 레이아웃 조합이나 props 전달만 하는 경우 → container 생성 금지

---

## widgets/ 레이어

`widgets/`는 여러 feature/shared 컴포넌트를 조합한 독립 UI 블록이다.

### features/ vs widgets/ 판단 기준

| 질문 | 예 | 아니오 |
| --- | --- | --- |
| 여러 feature/shared를 조합한 독립 UI 블록인가? | `widgets/` | — |
| 특정 도메인 기능(CRUD, 폼, 차트)에 속하는가? | `features/` | — |
| 앱 전체 레이아웃 역할인가? (헤더, 사이드바 등) | `widgets/` | — |

**`widgets/` 예시**: `Header`, `Sidebar`, `NavigationDrawer`, `AppShell`
**`features/` 예시**: `ActivityTable`, `EmissionTrendChart`, `ActivityForm`

### widgets/ 내부 구조

```
widgets/
  {widget-name}/
    ui/         → 순수 렌더링 컴포넌트
    container/  → 비즈니스 로직 연결 (필요한 경우에만)
    hooks/      → 위젯 전용 로컬 상태 (필요한 경우에만)
    index.ts    → public API (외부에 노출할 것만 export)
```

```tsx
// ✅ widgets/header/ui/Header.tsx — features와 shared를 조합
import { CompanySelector } from '@/features/companies/ui/CompanySelector';
import { DateRangePicker } from '@/shared/ui/date-range-picker';

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header>
      <CompanySelector />
      <DateRangePicker />
    </header>
  );
}

// ❌ features/ 에서 widgets/ import 금지
import { Header } from '@/widgets/header'; // features/ 안에서는 금지
```
