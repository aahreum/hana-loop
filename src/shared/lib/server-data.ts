import 'server-only';

import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { toCCArray } from '@/app/api/_store';
import type { ActivityData } from '@/shared/types/activity';
import type { Company } from '@/shared/types/company';
import type { EmissionResult } from '@/shared/types/emission';

// RSC prefetch 전용 — API Route 와 달리 jitter 우회.
// 첫 페이지 LCP 만 빠르게, 사용자 인터랙션은 API Route 경유로 jitter 시뮬레이션 유지.

export async function fetchCompaniesServer(): Promise<Company[]> {
  const { data } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('name');
  return toCCArray<Company>(data ?? []);
}

export async function fetchActivitiesServer(params: {
  companyId: string;
}): Promise<ActivityData[]> {
  const { data } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('company_id', params.companyId)
    .order('date', { ascending: false });
  return toCCArray<ActivityData>(data ?? []);
}

export async function fetchEmissionResultsServer(params: {
  companyId: string;
  from?: string;
  to?: string;
}): Promise<EmissionResult[]> {
  let query = supabaseAdmin
    .from('emission_results')
    .select('*')
    .eq('company_id', params.companyId)
    .order('year_month', { ascending: false });

  if (params.from) query = query.gte('year_month', params.from);
  if (params.to) query = query.lte('year_month', params.to);

  const { data } = await query;
  return toCCArray<EmissionResult>(data ?? []);
}
