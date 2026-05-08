import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter } from '@/app/api/_store';
import { toCCArray } from '@/shared/lib/case';
import type { EmissionFactor } from '@/shared/types/factor';
import type { ActivityTypeEnum } from '@/shared/types/database';

export async function GET(req: NextRequest) {
  await jitter();

  const { searchParams } = req.nextUrl;
  const activityType = searchParams.get('activityType');
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  let query = supabaseAdmin
    .from('emission_factors')
    .select('*')
    .order('category', { ascending: true });

  if (activityType)
    query = query.eq('activity_type', activityType as ActivityTypeEnum);
  if (activeOnly) query = query.is('valid_to', null);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toCCArray<EmissionFactor>(data ?? []));
}
