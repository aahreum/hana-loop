// API Route 공통 네트워크 시뮬레이션 유틸.
// 실제 데이터는 supabaseAdmin 으로 Supabase 에서 읽고 씀.
// snake_case <-> camelCase 변환은 shared/lib/case.ts 에 위치 (FSD 레이어 규칙).

/** 모든 엔드포인트 — 200~800ms 네트워크 지연 */
export const jitter = () =>
  new Promise<void>((res) => setTimeout(res, 200 + Math.random() * 600));

/** POST / DELETE 전용 — 15% 확률 쓰기 실패 */
export const maybeFail = () => Math.random() < 0.15;
