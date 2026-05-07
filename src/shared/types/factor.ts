import { z } from 'zod';
import { ScopeSchema, ActivityTypeSchema } from './activity';

export const EmissionFactorSchema = z.object({
  id: z.string().uuid(),
  category: z.string(), // 머신 키: 'electricity_kepco'
  name: z.string(), // 레이블: '전기 (한국전력 기본값)'
  activityType: ActivityTypeSchema,
  factor: z.number().positive(),
  unit: z.string(),
  scope: ScopeSchema,
  validFrom: z.string().regex(/^\d{4}-\d{2}$/),
  validTo: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable(),
  source: z.string(),
});

export type EmissionFactor = z.infer<typeof EmissionFactorSchema>;
