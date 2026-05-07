import { z } from 'zod';
import { ScopeSchema } from './activity';

export const EmissionFactorSchema = z.object({
  id: z.string().uuid(),
  category: z.string(),
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
