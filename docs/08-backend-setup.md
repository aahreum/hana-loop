# 백엔드 설계 (Next.js API Routes + Supabase)

## 구성

```
Next.js 15 App Router
├── app/api/                  ← REST API 엔드포인트
│   ├── activities/
│   │   ├── route.ts          ← GET /api/activities, POST /api/activities
│   │   └── [id]/
│   │       └── route.ts      ← DELETE /api/activities/:id
│   ├── factors/
│   │   └── route.ts          ← GET /api/factors
│   ├── companies/
│   │   └── route.ts          ← GET /api/companies
│   └── emission-results/
│       └── route.ts          ← GET /api/emission-results
│
├── app/docs/
│   └── page.tsx              ← Swagger UI (swagger-ui-react)
│
└── lib/
    ├── supabase.ts           ← Supabase 클라이언트
    ├── supabase.server.ts    ← 서버 전용 클라이언트 (서비스 롤)
    └── openapi.ts            ← OpenAPI spec 객체
```

---

## Supabase 세팅 순서

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) → New Project
2. `.env.local`에 키 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 서버 전용 (클라이언트 노출 금지)
```

### 2. 패키지 설치

```bash
npm install @supabase/supabase-js
npm install swagger-ui-react swagger-ui-dist
npm install @types/swagger-ui-react -D
```

### 3. Supabase 클라이언트

```ts
// lib/supabase.ts (브라우저용)
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

```ts
// lib/supabase.server.ts (API Route 전용)
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## Supabase SQL 스키마

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- 회사
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country char(2) not null,
  created_at timestamptz default now()
);

-- 배출계수 (버전 관리)
create table emission_factors (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  factor numeric not null,
  unit text not null,
  scope smallint not null check (scope in (1, 2, 3)),
  valid_from text not null,  -- "2024-01"
  valid_to text,             -- null = 현재 유효
  source text not null,
  created_at timestamptz default now()
);

-- 활동 데이터
create table activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  year_month text not null,  -- "2025-01"
  type text not null,
  description text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  scope smallint not null check (scope in (1, 2, 3)),
  created_at timestamptz default now()
);

-- 배출량 계산 결과 (activities와 분리)
create table emission_results (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  factor_id uuid references emission_factors(id),
  company_id uuid references companies(id),
  year_month text not null,
  quantity numeric not null,
  factor numeric not null,
  emission_kg_co2e numeric not null,  -- quantity × factor
  scope smallint not null,
  calculated_at timestamptz default now()
);

-- 인덱스
create index on activities(company_id, year_month);
create index on emission_results(company_id, year_month);
```

### Supabase 타입 자동 생성

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

---

## API Route 예시

```ts
// app/api/activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";

const jitter = () => 200 + Math.random() * 600;
const maybeFail = () => Math.random() < 0.15;

export async function GET(req: NextRequest) {
  await new Promise((r) => setTimeout(r, jitter()));

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const yearMonth = searchParams.get("yearMonth");

  let query = supabaseAdmin.from("activities").select("*").order("year_month", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);
  if (yearMonth) query = query.eq("year_month", yearMonth);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  await new Promise((r) => setTimeout(r, jitter()));
  if (maybeFail()) {
    return NextResponse.json({ error: "Network error: request failed" }, { status: 503 });
  }

  const body = await req.json();

  // 1. 배출계수 조회
  const { data: factor } = await supabaseAdmin
    .from("emission_factors")
    .select("*")
    .eq("category", body.type)
    .is("valid_to", null)
    .single();

  // 2. 활동 데이터 저장
  const { data: activity, error } = await supabaseAdmin
    .from("activities")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. 배출량 계산 결과 저장
  if (factor) {
    await supabaseAdmin.from("emission_results").insert({
      activity_id: activity.id,
      factor_id: factor.id,
      company_id: activity.company_id,
      year_month: activity.year_month,
      quantity: activity.quantity,
      factor: factor.factor,
      emission_kg_co2e: activity.quantity * factor.factor,
      scope: activity.scope,
    });
  }

  return NextResponse.json(activity, { status: 201 });
}
```

---

## Swagger UI 설정 (zod-to-openapi 방식)

> **핵심 아이디어**: Zod 스키마가 유효성 검증과 OpenAPI spec의 단일 소스.
> 스키마를 수정하면 API 문서가 자동으로 바뀜. 중복 없음.

### 1. Zod 스키마 작성 (zod-to-openapi 형식)

```ts
// lib/validations/activity.ts
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const ActivityTypeSchema = z
  .enum(["electricity", "fuel", "raw_material", "transport", "waste"])
  .openapi({ description: "활동 유형" });

export const CreateActivitySchema = z
  .object({
    companyId: z.string().uuid().openapi({ example: "c1" }),
    yearMonth: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .openapi({ example: "2025-01" }),
    type: ActivityTypeSchema,
    description: z.string().min(1).openapi({ example: "한국전력" }),
    quantity: z.number().positive().openapi({ example: 110 }),
    unit: z.string().openapi({ example: "kWh" }),
    scope: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .openapi("CreateActivity");

export const ActivitySchema = CreateActivitySchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
}).openapi("Activity");
```

### 2. OpenAPI spec 자동 생성

```ts
// lib/openapi.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { ActivitySchema, CreateActivitySchema } from "./validations/activity";

const registry = new OpenAPIRegistry();

// 스키마 등록
registry.register("Activity", ActivitySchema);
registry.register("CreateActivity", CreateActivitySchema);

// 엔드포인트 등록
registry.registerPath({
  method: "get",
  path: "/api/activities",
  summary: "활동 데이터 목록 조회",
  request: {
    query: z.object({
      companyId: z.string().optional(),
      yearMonth: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: z.array(ActivitySchema) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/activities",
  summary: "활동 데이터 생성 (실패 확률 15%)",
  request: {
    body: { content: { "application/json": { schema: CreateActivitySchema } } },
  },
  responses: {
    201: { description: "생성 성공", content: { "application/json": { schema: ActivitySchema } } },
    503: { description: "네트워크 오류 시뮬레이션 (의도된 동작)" },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: { title: "HanaLoop Carbon Dashboard API", version: "1.0.0" },
  servers: [{ url: "" }],
});
```

### 3. Swagger UI 렌더링

```tsx
// app/docs/page.tsx
"use client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-dist/swagger-ui.css";
import { openApiSpec } from "@/lib/openapi";

export default function DocsPage() {
  return <SwaggerUI spec={openApiSpec} />;
}
```

→ `/docs` 접속 시 Swagger UI 확인 가능. 스키마 변경 시 자동 반영.

---

## 프론트엔드 API 클라이언트

`lib/api/` 레이어에서 Next.js API Routes를 fetch로 호출.
TanStack Query 훅은 동일하게 사용 — API 계층만 분리됨.
자세한 내용은 `06-api-client.md` 참고.
