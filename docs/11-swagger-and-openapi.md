# Swagger UI & OpenAPI 자동 문서화

> 도입 PR: [#30 — feat/#29-swagger-ui-and-openapi](https://github.com/aahreum/hana-loop/pull/30)
> 핵심 커밋: `cb595e7` (도입), `56e9652` (YearMonthSchema 공통화), `47bca75` (route group 분리), `a009f15` (디자인), `b93041c` (문서)

내부 API의 명세를 코드 한 곳(Zod 스키마)에서 자동 생성해 `/docs` 경로에서 Swagger UI 로 탐색 가능하도록 만든 시스템.

---

## 왜 도입했는가

| 문제 | 해결 |
| --- | --- |
| API 스펙을 별도 마크다운에 손으로 적어놓으면 코드와 빠르게 어긋난다 | Zod 스키마에서 OpenAPI 문서를 **자동 생성** → 코드가 곧 명세 |
| 백엔드 분리 평가자가 API 동작을 빠르게 파악하기 어렵다 | `/docs` 에서 인터랙티브하게 try-it-out 가능 |
| 스키마 / 타입 / 문서가 3중 정의되면 유지보수 비용이 폭증한다 | Zod 스키마 → `z.infer<>` 타입 + OpenAPI Schema 동시 도출 |

CLAUDE.md 의 **"Zod 스키마가 유일한 타입 출처"** 원칙을 그대로 OpenAPI 차원으로 확장한 것.

---

## 전체 동작 흐름

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. 정의 단계 — 빌드/번들 시점                                    │
│                                                                  │
│  shared/types/*.ts            shared/lib/openapi.ts              │
│  ┌─────────────────┐          ┌────────────────────────────┐     │
│  │ ActivitySchema  │ ──register──▶ OpenAPIRegistry          │     │
│  │ CompanySchema   │              + registerPath(...)        │     │
│  │ ...Zod schemas  │              (메서드/경로/요청/응답)    │     │
│  └─────────────────┘          └────────────────────────────┘     │
│         │                              │                          │
│         │ z.infer<>                    │ OpenApiGeneratorV3       │
│         ▼                              ▼                          │
│  TypeScript 타입               OpenAPI 3.0 JSON Document          │
└──────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP GET
                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. 서빙 단계 — 런타임                                             │
│                                                                  │
│  GET /api/docs                       GET /docs                   │
│  app/api/docs/route.ts               app/docs/page.tsx           │
│  ┌────────────────────┐              ┌─────────────────────┐     │
│  │ generateOpenApi    │              │ SwaggerDocsContainer│     │
│  │ Document() 결과를  │              │  └ dynamic ssr:false│     │
│  │ JSON 으로 응답     │ ◀── fetch ── │     SwaggerDocsView │     │
│  │ (force-static)     │              │     <SwaggerUI      │     │
│  └────────────────────┘              │       url="/api/docs│     │
│                                      │     />              │     │
│                                      └─────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                                   브라우저: 인터랙티브 Swagger UI
```

---

## 구성 요소별 역할

### 1. `shared/lib/openapi.ts` — 단일 레지스트리

OpenAPI 문서의 **유일한 출처**. 새로운 API 엔드포인트는 여기에 등록해야만 `/docs` 에 노출된다.

```ts
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);              // (A) zod 인스턴스에 .openapi() 메서드 주입
const registry = new OpenAPIRegistry(); // (B) 정의 수집기

registry.register('Activity', ActivitySchema);  // (C) 컴포넌트 스키마 등록
registry.registerPath({                          // (D) 엔드포인트 등록
  method: 'post',
  path: '/api/activities',
  tags: ['Activities'],
  request: { body: { content: { 'application/json': { schema: CreateActivitySchema } } } },
  responses: { 201: { ..., content: jsonContent(ActivitySchema) }, 400: errorResponse('...') },
});

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'HanaLoop Carbon Dashboard API', version: '1.0.0', description: '...' },
    servers: [{ url: '/' }],
    tags: [{ name: 'Companies' }, { name: 'Activities' }, ...],
  });
}
```

| 단계 | 의미 |
| --- | --- |
| (A) `extendZodWithOpenApi(z)` | 모든 Zod 스키마에 `.openapi(...)` 메서드 추가 — 설명/예제를 스키마 옆에 직접 적을 수 있다 |
| (B) `OpenAPIRegistry` | 컴포넌트 스키마 + 경로를 한 곳에 모아두는 그릇 |
| (C) `register(name, schema)` | OpenAPI `components.schemas.<name>` 으로 빠진다. UI 에서 재사용·참조 가능 |
| (D) `registerPath({ method, path, request, responses, ... })` | OpenAPI `paths.<path>.<method>` 항목을 만든다. 요청/응답에 Zod 스키마를 그대로 꽂는다 |
| `generateOpenApiDocument()` | 등록된 정의를 OpenAPI 3.0 JSON 으로 변환해 반환 |

> **중요**: `YearMonthSchema` 같이 여러 엔드포인트에서 재사용하는 검증은 `shared/types/common.ts` 에 두고 import 한다 (PR #29 코드리뷰 반영).

### 2. `app/api/docs/route.ts` — JSON 스펙 엔드포인트

```ts
import { NextResponse } from 'next/server';
import { generateOpenApiDocument } from '@/shared/lib/openapi';

export const dynamic = 'force-static';   // 빌드 시 1회 정적 생성

export function GET() {
  return NextResponse.json(generateOpenApiDocument());
}
```

- `force-static` — Zod 스키마는 빌드 시점에 결정되므로 매 요청마다 다시 생성할 필요 없음. CDN 캐시·정적 호스팅에 유리.
- 응답은 OpenAPI 3.0 규격의 순수 JSON. Postman / Insomnia / 다른 SDK 생성기에 그대로 import 가능.

### 3. `app/docs/page.tsx` + `app/docs/layout.tsx` — UI 진입점

```tsx
// page.tsx
export default function DocsPage() {
  return <SwaggerDocsContainer />;
}
```

`SwaggerDocsContainer` 가 `dynamic(import, { ssr: false })` 로 `SwaggerDocsView` 를 감싼다. 이유는 다음 항목 참고.

```tsx
// SwaggerDocsView.tsx ('use client')
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export function SwaggerDocsView() {
  return (
    <SwaggerUI
      url="/api/docs"          // ← 우리가 만든 JSON 엔드포인트
      docExpansion="list"
      defaultModelsExpandDepth={-1}
    />
  );
}
```

브라우저는 `/docs` 진입 → `SwaggerUI` 가 `/api/docs` 를 fetch → JSON 을 파싱해 인터랙티브 UI 렌더링.

### 4. Route group `(app)` 으로 레이아웃 격리

`/docs` 는 사이드바·헤더가 있는 일반 대시보드 셸과 어울리지 않으므로 별도 레이아웃을 쓴다.

```
src/app/
├── (app)/                  ← 라우트 그룹: URL 에는 (app) 이 안 보임
│   ├── layout.tsx          ← AppShell (사이드바 + 헤더)
│   ├── dashboard/
│   ├── activities/
│   ├── companies/
│   └── factors/
├── docs/                   ← AppShell 없음
│   ├── layout.tsx          ← /docs 전용 헤더 (브랜드 + "대시보드로" 링크)
│   └── page.tsx
├── api/
│   ├── docs/route.ts       ← OpenAPI JSON
│   └── ...
└── layout.tsx              ← 루트 레이아웃 (Providers, Theme)
```

> Next.js route group `(app)` — 폴더명에 괄호를 쓰면 URL 경로에서는 사라지지만 `layout.tsx` 적용 범위는 그 그룹 안에서만 유지된다.

---

## 새로운 엔드포인트 추가하는 절차

1. **Zod 스키마 정의/확인** — 요청·응답 스키마가 `shared/types/` 에 있는지 확인.
2. **API Route 작성** — `app/api/<path>/route.ts` 에서 핸들러 구현 (jitter + maybeFail 룰 준수).
3. **`shared/lib/openapi.ts` 에 등록** — `registry.registerPath({ method, path, tags, request, responses })`.
4. **(선택) `registry.register(name, schema)`** — 새 컴포넌트 스키마라면 등록해서 UI 재사용.
5. **`pnpm dev` 실행 후 `/docs` 진입** — 새 엔드포인트가 보이고 try-it-out 동작하는지 확인.

빌드 시점에 `/api/docs` 가 정적으로 생성되므로 **새 엔드포인트가 안 보이면** 캐시/HMR 갱신 또는 재빌드(`pnpm build`)가 필요한지 의심한다.

---

## 트러블슈팅 / 결정 기록

| 상황 | 결정 | 이유 |
| --- | --- | --- |
| Swagger UI 가 SSR 환경에서 `window` 를 참조해 깨짐 | `dynamic(..., { ssr: false })` + Container 패턴으로 분리 | UI/Container 분리 규칙 + 클라이언트 의존 라이브러리 차단 |
| `/docs` 에 사이드바가 따라오지 않게 하고 싶음 | route group `(app)` 으로 일반 페이지를 묶고 `/docs` 는 외부에 둠 | layout 트리 분리가 가장 깔끔, conditional layout 보다 표준적 |
| 같은 `YYYY-MM` 검증이 여러 엔드포인트에 흩뿌려짐 | `shared/types/common.ts` 의 `YearMonthSchema` 단일화 | 검증 로직 일관성 + 월 범위(01-12) 누락 방지 (PR #29 리뷰 반영) |
| 매 요청마다 OpenAPI 문서를 재생성? | `export const dynamic = 'force-static'` | 스키마는 코드에 박혀 있어 런타임 변경 없음 — 빌드 시 1회면 충분 |
| Swagger UI 의 흰 배경이 다크 모드와 안 어울림 | `/docs` 레이아웃은 항상 흰 배경 + 풀폭 적용 | Swagger UI 자체 스타일링이 다크 모드 대응이 빈약 — 격리가 단순 |

---

## 의존성

```json
{
  "@asteasolutions/zod-to-openapi": "^7.0.0",  // Zod → OpenAPI 변환기
  "swagger-ui-react": "^5.18.2",                // React 래퍼
  "swagger-ui-dist": "^5.18.2",                 // 정적 자산
  "@types/swagger-ui-react": "^4.18.3"          // 타입
}
```

---

## 참고 링크

- 라이브러리: [`@asteasolutions/zod-to-openapi`](https://github.com/asteasolutions/zod-to-openapi)
- OpenAPI 3.0 스펙: <https://spec.openapis.org/oas/v3.0.3>
- Next.js Route Groups: <https://nextjs.org/docs/app/building-your-application/routing/route-groups>
