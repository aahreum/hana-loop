import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database';

// 서버 전용 — API Route에서만 사용. 클라이언트 컴포넌트에서 import 금지.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
