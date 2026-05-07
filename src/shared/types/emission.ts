import { z } from 'zod';
import { ScopeSchema } from './activity';

// DB 저장 레코드 — emission_results 테이블
export const EmissionResultSchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  factorId: z.string().uuid(),
  companyId: z.string().uuid(),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  quantity: z.number(),
  factor: z.number(),
  emissionKgCo2e: z.number(),
  scope: ScopeSchema,
  calculatedAt: z.string().datetime(),
});

export type EmissionResult = z.infer<typeof EmissionResultSchema>;

// API 응답 타입 — Company.emissions[] 임베드용 (집계된 tCO2e)
// emission_results를 source별로 집계하여 반환
export const GhgEmissionSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  source: z.string(), // activity description (e.g. "한국전력", "플라스틱 1")
  emissions: z.number(), // tCO2e (= emissionKgCo2e / 1000)
  scope: ScopeSchema,
});

export type GhgEmission = z.infer<typeof GhgEmissionSchema>;
