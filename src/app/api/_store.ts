// API Route 공통 네트워크 시뮬레이션 유틸.
// 모든 API Route에서 import하여 사용.
// 실제 데이터는 supabaseAdmin을 통해 Supabase에서 읽고 씀.

/** 모든 엔드포인트 — 200~800ms 네트워크 지연 */
export const jitter = () =>
  new Promise<void>((res) => setTimeout(res, 200 + Math.random() * 600));

/** POST / DELETE 전용 — 15% 확률 쓰기 실패 */
export const maybeFail = () => Math.random() < 0.15;
