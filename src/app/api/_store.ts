// API Route 공통 네트워크 시뮬레이션 + 키 변환 유틸.
// 모든 API Route에서 import하여 사용.
// 실제 데이터는 supabaseAdmin을 통해 Supabase에서 읽고 씀.

/** 모든 엔드포인트 — 200~800ms 네트워크 지연 */
export const jitter = () =>
  new Promise<void>((res) => setTimeout(res, 200 + Math.random() * 600));

/** POST / DELETE 전용 — 15% 확률 쓰기 실패 */
export const maybeFail = () => Math.random() < 0.15;

// Supabase는 snake_case로 반환 — Zod 스키마(camelCase)와 맞추기 위해 변환 필요.

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
