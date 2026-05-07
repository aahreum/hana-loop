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
      { error: status === 422 ? '배출계수를 찾을 수 없습니다.' : '활동 데이터 저장 실패' },
      { status },
    );
  }

  return NextResponse.json(toCC(data), { status: 201 });
}
```

---

## Swagger UI 설정 (zod-to-openapi)

Zod 스키마가 유효성 검증과 OpenAPI spec의 단일 소스.
스키마 수정 시 API 문서 자동 반영.

### Zod 스키마에 OpenAPI 메타데이터 추가

```ts
// shared/types/activity.ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

export const CreateActivitySchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .openapi({ example: '2025-01-01' }),
    // ...
  })
  .openapi('CreateActivity');
```

### OpenAPI spec 등록 및 라우트

```ts
// shared/lib/openapi.ts — 스키마 및 엔드포인트 등록
// app/api/docs/route.ts — GET /api/docs → JSON spec 반환
// app/docs/page.tsx    — SwaggerUI 렌더링
```

→ `/docs` 접속 시 Swagger UI 확인 가능.
