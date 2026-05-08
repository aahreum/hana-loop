// Supabase 는 snake_case 로 반환하지만 Zod 스키마는 camelCase. 변환 유틸.

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Supabase 단일 row → camelCase 객체 */
export function toCC<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [snakeToCamel(k), v]),
  ) as T;
}

/** Supabase row 배열 → camelCase 배열 */
export function toCCArray<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => toCC<T>(r));
}
