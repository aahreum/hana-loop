import { z } from 'zod';
import { ScopeSchema } from './activity';

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
