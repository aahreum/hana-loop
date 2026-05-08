import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  ActivitySchema,
  ActivityTypeSchema,
  CreateActivitySchema,
  ScopeSchema,
} from '@/shared/types/activity';
import { CompanySchema } from '@/shared/types/company';
import {
  EmissionResultSchema,
  GhgEmissionSchema,
} from '@/shared/types/emission';
import { EmissionFactorSchema } from '@/shared/types/factor';
import { CreatePostSchema, PostSchema } from '@/shared/types/post';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const ErrorSchema = z
  .object({ error: z.string() })
  .openapi('Error', { description: '에러 응답' });

registry.register('Scope', ScopeSchema);
registry.register('ActivityType', ActivityTypeSchema);
registry.register('Company', CompanySchema);
registry.register('CreateActivityInput', CreateActivitySchema);
registry.register('Activity', ActivitySchema);
registry.register('EmissionFactor', EmissionFactorSchema);
registry.register('EmissionResult', EmissionResultSchema);
registry.register('GhgEmission', GhgEmissionSchema);
registry.register('CreatePostInput', CreatePostSchema);
registry.register('Post', PostSchema);

const jsonContent = <T extends z.ZodTypeAny>(schema: T) => ({
  'application/json': { schema },
});

const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ErrorSchema),
});

// ── Companies ─────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/companies',
  tags: ['Companies'],
  summary: '회사 목록 조회',
  responses: {
    200: {
      description: '회사 목록',
      content: jsonContent(z.array(CompanySchema)),
    },
    500: errorResponse('서버 오류'),
  },
});

// ── Activities ────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/activities',
  tags: ['Activities'],
  summary: '활동 데이터 목록 조회',
  request: {
    query: z.object({
      companyId: z.string().uuid().optional(),
      yearMonth: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
      type: ActivityTypeSchema.optional(),
    }),
  },
  responses: {
    200: {
      description: '활동 데이터 목록',
      content: jsonContent(z.array(ActivitySchema)),
    },
    500: errorResponse('서버 오류'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/activities',
  tags: ['Activities'],
  summary: '활동 데이터 생성',
  description:
    '활동 데이터를 저장하고 배출계수를 적용해 emission_results를 함께 생성한다.',
  request: {
    body: {
      required: true,
      content: jsonContent(CreateActivitySchema),
    },
  },
  responses: {
    201: {
      description: '생성된 활동 데이터',
      content: jsonContent(ActivitySchema),
    },
    400: errorResponse('입력값 검증 실패'),
    422: errorResponse('배출계수를 찾을 수 없음'),
    500: errorResponse('서버 오류 (15% 확률로 시뮬레이션)'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/activities/{id}',
  tags: ['Activities'],
  summary: '활동 데이터 삭제',
  description: '연관된 emission_results는 ON DELETE CASCADE로 함께 삭제된다.',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    204: { description: '삭제 성공' },
    500: errorResponse('서버 오류 (15% 확률로 시뮬레이션)'),
  },
});

// ── Emission Factors ──────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/factors',
  tags: ['Emission Factors'],
  summary: '배출계수 목록 조회',
  request: {
    query: z.object({
      activityType: ActivityTypeSchema.optional(),
      activeOnly: z.enum(['true', 'false']).optional().openapi({
        description: 'true(기본값)면 valid_to IS NULL 인 현재 유효 계수만 반환',
      }),
    }),
  },
  responses: {
    200: {
      description: '배출계수 목록',
      content: jsonContent(z.array(EmissionFactorSchema)),
    },
    500: errorResponse('서버 오류'),
  },
});

// ── Emission Results ──────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/emission-results',
  tags: ['Emission Results'],
  summary: '배출량 계산 결과 조회',
  request: {
    query: z.object({
      companyId: z.string().uuid().optional(),
      yearMonth: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
      from: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
      to: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
    }),
  },
  responses: {
    200: {
      description: '배출량 계산 결과 목록',
      content: jsonContent(z.array(EmissionResultSchema)),
    },
    500: errorResponse('서버 오류'),
  },
});

// ── Posts ─────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/posts',
  tags: ['Posts'],
  summary: '게시물 목록 조회',
  request: {
    query: z.object({
      resourceUid: z.string().uuid().optional(),
      dateTime: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
    }),
  },
  responses: {
    200: {
      description: '게시물 목록',
      content: jsonContent(z.array(PostSchema)),
    },
    500: errorResponse('서버 오류'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/posts',
  tags: ['Posts'],
  summary: '게시물 생성',
  request: {
    body: {
      required: true,
      content: jsonContent(CreatePostSchema),
    },
  },
  responses: {
    201: {
      description: '생성된 게시물',
      content: jsonContent(PostSchema),
    },
    400: errorResponse('입력값 검증 실패'),
    500: errorResponse('서버 오류 (15% 확률로 시뮬레이션)'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/posts/{id}',
  tags: ['Posts'],
  summary: '게시물 삭제',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    204: { description: '삭제 성공' },
    500: errorResponse('서버 오류 (15% 확률로 시뮬레이션)'),
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'HanaLoop Carbon Dashboard API',
      version: '1.0.0',
      description:
        '기업 탄소 배출량 관리 플랫폼의 내부 API. 모든 엔드포인트는 200~800ms 지연을 시뮬레이션하며, POST/DELETE는 15% 확률로 500을 반환한다.',
    },
    servers: [{ url: '/', description: '현재 호스트' }],
    tags: [
      { name: 'Companies', description: '회사 정보' },
      { name: 'Activities', description: '활동 데이터 (Scope 1/2/3 원본)' },
      { name: 'Emission Factors', description: '배출계수 (버전 관리)' },
      { name: 'Emission Results', description: '배출량 계산 결과' },
      { name: 'Posts', description: '게시물 / 메모' },
    ],
  });
}
