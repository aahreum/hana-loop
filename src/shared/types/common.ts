import { z } from 'zod';

// YYYY-MM (월은 01~12) — 모든 month 컬럼·필터·검증의 단일 출처.
export const YearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-MM 형식이어야 합니다');

export type YearMonth = z.infer<typeof YearMonthSchema>;
