import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  country: z.string().length(2),
  createdAt: z.string().datetime(),
});

export type Company = z.infer<typeof CompanySchema>;
