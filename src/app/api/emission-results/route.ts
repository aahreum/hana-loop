import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter } from '@/app/api/_store';
import { toCCArray } from '@/shared/lib/case';
import type { EmissionResult } from '@/shared/types/emission';

export async function GET(req: NextRequest) {
  await jitter();

  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get('companyId');
  const yearMonth = searchParams.get('yearMonth');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabaseAdmin
    .from('emission_results')
    .select('*')
    .order('year_month', { ascending: false });

  if (companyId) query = query.eq('company_id', companyId);
  if (yearMonth) query = query.eq('year_month', yearMonth);
  if (from) query = query.gte('year_month', from);
  if (to) query = query.lte('year_month', to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toCCArray<EmissionResult>(data ?? []));
}
