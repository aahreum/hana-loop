import { z } from 'zod';

export const ActivityTypeSchema = z.enum([
  'electricity',
  'fuel',
  'raw_material',
  'transport',
  'waste',
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const ScopeSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export type Scope = z.infer<typeof ScopeSchema>;

export const CreateActivitySchema = z.object({
  companyId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  type: ActivityTypeSchema,
  description: z.string().min(1, '설명을 입력하세요'),
  factorCategory: z.string().min(1, '배출계수를 선택하세요'),
  quantity: z.number().positive('0보다 큰 값을 입력하세요'),
  unit: z.string().min(1, '단위를 선택하세요'),
  scope: ScopeSchema,
});

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;

export const ActivitySchema = CreateActivitySchema.extend({
  id: z.string().uuid(),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/), // DB generated column
  createdAt: z.string().datetime(),
});

export type ActivityData = z.infer<typeof ActivitySchema>;
