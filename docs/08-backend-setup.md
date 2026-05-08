# 백엔드 설계 (Next.js API Routes + Supabase)

## 구성

```
src/
├── app/api/                      ← REST API 엔드포인트
│   ├── _store.ts                 ← 네트워크 시뮬레이션 유틸 (jitter, maybeFail)
│   ├── activities/
│   │   ├── route.ts              ← GET, POST /api/activities
│   │   └── [id]/route.ts         ← DELETE /api/activities/:id
│   ├── factors/
│   │   └── route.ts              ← GET /api/factors
│   ├── companies/
│   │   ├── route.ts              ← GET /api/companies
│   │   └── [id]/route.ts         ← GET /api/companies/:id (emissions 임베드)
│   ├── emission-results/
│   │   └── route.ts              ← GET /api/emission-results
│   └── posts/
│       ├── route.ts              ← GET, POST /api/posts
│       └── [id]/route.ts         ← PATCH, DELETE /api/posts/:id
│
├── shared/lib/
│   ├── api.ts                    ← 브라우저 fetch 클라이언트
│   └── supabase.server.ts        ← 서버 전용 Supabase 클라이언트
```

---

## 환경 변수 설정

```env
# .env.local
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### Supabase API 키 선택 기준

Supabase는 키 체계를 새로 개편했음 (Legacy anon/service_role → Publishable/Secret):

| 키 종류                                | 구 명칭          | 용도                    | 선택 |
| -------------------------------------- | ---------------- | ----------------------- | ---- |
| Publishable key (`sb_publishable_...`) | anon key         | 브라우저, RLS 정책 적용 | ❌   |
| **Secret key (`sb_secret_...`)**       | service_role key | 서버 전용, RLS 우회     | ✅   |

이 프로젝트는 모든 DB 접근이 서버(API Route)에서만 이루어지므로:

- **Secret key → `SUPABASE_SERVICE_ROLE_KEY`** 에 설정
- `NEXT_PUBLIC_` prefix 불필요 — 브라우저 클라이언트(`supabase.ts`) 없음

---

## Supabase 마이그레이션 실행 순서

```bash
# 1. Supabase Dashboard → SQL Editor 에서 순서대로 실행
#    supabase/migrations/20250507000000_initial_schema.sql
#    supabase/migrations/20250507000001_add_posts.sql
#    supabase/seed.sql

# 또는 Supabase CLI 사용 시:
npx supabase db push
npx supabase db seed
```

---

## 네트워크 시뮬레이션 패턴

`app/api/_store.ts`에서 제공하는 유틸을 모든 API Route에 적용:

```ts
// app/api/_store.ts
export const jitter = () =>
  new Promise<void>((res) => setTimeout(res, 200 + Math.random() * 600));

export const maybeFail = () => Math.random() < 0.15;
```

### API Route 적용 규칙

| 작업   | jitter  | maybeFail     |
| ------ | ------- | ------------- |
| GET    | ✅ 적용 | ❌ 미적용     |
| POST   | ✅ 적용 | ✅ 적용 (15%) |
| DELETE | ✅ 적용 | ✅ 적용 (15%) |
| PATCH  | ✅ 적용 | ✅ 적용 (15%) |

---

## API Route 작성 패턴

```ts
// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter, maybeFail } from '../_store';
import { CreateActivitySchema } from '@/shared/types/activity';
import { GHG_SCOPE } from '@/shared/constants/ghgScope';

export async function GET(req: NextRequest) {
  await jitter();

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');

  let query = supabaseAdmin
    .from('activities')
    .select('*')
    .order('date', { ascending: false });
  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await jitter();
  if (maybeFail()) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }

  const body = CreateActivitySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json(
      { error: body.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const input = body.data;

  // activities + emission_results를 하나의 트랜잭션으로 저장 (RPC)
  // - scope는 emission_factors.scope에서 자동 결정 (클라이언트 입력 불필요)
  // - 배출계수 미존재 시 전체 롤백
  const { data, error } = await supabaseAdmin.rpc(
    'create_activity_with_emission',
    {
      p_company_id: input.companyId,
      p_date: input.date,
      p_type: input.type,
      p_description: input.description,
      p_factor_category: input.factorCategory,
      p_quantity: input.quantity,
      p_unit: input.unit,
    },
  );

  if (error) {
    const status = error.message.includes('FACTOR_NOT_FOUND') ? 422 : 500;
    return NextResponse.json(
      {
        error:
          status === 422
            ? '배출계수를 찾을 수 없습니다.'
            : '활동 데이터 저장 실패',
      },
      { status },
    );
  }

  return NextResponse.json(toCC(data), { status: 201 });
}
```

---

## Swagger UI / OpenAPI 3.0 자동 문서화

Zod 스키마가 유효성 검증·응답 타입·OpenAPI spec 의 **단일 출처**.
타입 파일에는 OpenAPI 메타데이터를 흩뿌리지 않고 `shared/lib/openapi.ts` 한 곳에서 등록한다.

### 자동 생성 흐름

```
shared/types/*.ts (순수 Zod 스키마)
  ↓ extendZodWithOpenApi(z) 적용 후 register
shared/lib/openapi.ts (OpenAPIRegistry: 스키마 + 경로)
  ↓ OpenApiGeneratorV3.generateDocument()
{ openapi:'3.0.0', paths:{...}, components:{schemas:{...}} }
  ↓ NextResponse.json() — force-static prerender
/api/docs (정적 JSON)
  ↓ swagger-ui-react fetch
/docs (인터랙티브 UI)
```

### 1. `shared/lib/openapi.ts` — 단일 진입점

```ts
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateActivitySchema, ActivitySchema } from '@/shared/types/activity';

extendZodWithOpenApi(z);  // ← 한 번만 호출

const registry = new OpenAPIRegistry();

// (a) components/schemas
registry.register('Activity', ActivitySchema);
registry.register('CreateActivityInput', CreateActivitySchema);

// (b) paths
registry.registerPath({
  method: 'post',
  path: '/api/activities',
  tags: ['Activities'],
  summary: '활동 데이터 생성',
  request: {
    body: { required: true, content: { 'application/json': { schema: CreateActivitySchema } } },
  },
  responses: {
    201: { description: '생성된 활동 데이터',
           content: { 'application/json': { schema: ActivitySchema } } },
    400: errorResponse('입력값 검증 실패'),
    422: errorResponse('배출계수를 찾을 수 없음'),
    500: errorResponse('서버 오류 (15% 확률로 시뮬레이션)'),
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'HanaLoop Carbon Dashboard API', version: '1.0.0', description: '...' },
    servers: [{ url: '/', description: '현재 호스트' }],
    tags: [/* ... */],
  });
}
```

### 2. `app/api/docs/route.ts` — 정적 JSON 응답

```ts
import { NextResponse } from 'next/server';
import { generateOpenApiDocument } from '@/shared/lib/openapi';

export const dynamic = 'force-static';  // 빌드 시 1회 prerender

export function GET() {
  return NextResponse.json(generateOpenApiDocument());
}
```

### 3. `/docs` 페이지 — 서버 컴포넌트 + dynamic ssr:false

CLAUDE.md 의 "page는 서버 컴포넌트 유지" 규칙과
"swagger-ui-react는 브라우저 DOM 의존" 제약을 동시에 만족시키기 위해 3-tier 분리:

```
app/docs/page.tsx (서버 컴포넌트)
  → features/api-docs/container/SwaggerDocsContainer ('use client', dynamic ssr:false)
    → features/api-docs/ui/SwaggerDocsView ('use client', swagger-ui-react)
```

```tsx
// features/api-docs/container/SwaggerDocsContainer.tsx
'use client';
import dynamic from 'next/dynamic';

const SwaggerDocsView = dynamic(
  () => import('@/features/api-docs/ui/SwaggerDocsView').then((m) => m.SwaggerDocsView),
  { ssr: false, loading: () => <div>API 문서를 불러오는 중...</div> },
);

export function SwaggerDocsContainer() {
  return <SwaggerDocsView />;
}
```

```tsx
// features/api-docs/ui/SwaggerDocsView.tsx
'use client';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export function SwaggerDocsView() {
  return (
    <div className="swagger-wrapper">
      <SwaggerUI url="/api/docs" docExpansion="list" defaultModelsExpandDepth={-1} />
    </div>
  );
}
```

### 4. 레이아웃 분리 — `/docs` 는 AppShell 밖

`/docs` 는 swagger-ui-react 의 라이트 테마와 사이드바(다크) 가 충돌해서,
대시보드 영역과 분리된 자체 layout 을 갖는다.

```
app/(app)/layout.tsx   — AppShell (사이드바 + 컨텐츠)
app/docs/layout.tsx    — 미니 헤더(HanaLoop 로고 + 대시보드로 링크) + 흰 배경
```

`<html>` 의 dark/light 클래스 동기화는 `shared/providers/ThemeApplier.tsx` 가
root layout 에서 항상 mount 되어 처리하므로 두 영역 모두 동일 적용된다.

### 신규 스키마 / 엔드포인트 추가 절차

1. `shared/types/*.ts` 에 Zod 스키마 작성 (`.openapi()` 메타데이터 추가 불필요)
2. `shared/lib/openapi.ts` 에서 `registry.register('Name', Schema)`
3. 새 엔드포인트면 `registry.registerPath({...})` 추가
4. 재빌드 → `/docs` 에 자동 반영, `/api/docs` JSON 도 자동 갱신
