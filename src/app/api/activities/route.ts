import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter, maybeFail, toCC, toCCArray } from '@/app/api/_store';
import { CreateActivitySchema } from '@/shared/types/activity';
import { GHG_SCOPE } from '@/shared/constants/ghgScope';
import type { ActivityData } from '@/shared/types/activity';
import type { ActivityTypeEnum } from '@/shared/types/database';

export async function GET(req: NextRequest) {
  await jitter();

  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get('companyId');
  const yearMonth = searchParams.get('yearMonth');
  const type = searchParams.get('type');

  let query = supabaseAdmin
    .from('activities')
    .select('*')
    .order('date', { ascending: false });

  if (companyId) query = query.eq('company_id', companyId);
  if (yearMonth) query = query.eq('year_month', yearMonth);
  if (type) query = query.eq('type', type as ActivityTypeEnum);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toCCArray<ActivityData>(data ?? []));
}

export async function POST(req: NextRequest) {
  await jitter();

  if (maybeFail()) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateActivitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.',
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const scope = GHG_SCOPE[input.type];

  // 1. activities 저장
  const { data: activity, error: actErr } = await supabaseAdmin
    .from('activities')
    .insert({
      company_id: input.companyId,
      date: input.date,
      type: input.type,
      description: input.description,
      factor_category: input.factorCategory,
      quantity: input.quantity,
      unit: input.unit,
      scope,
    })
    .select()
    .single();

  if (actErr || !activity) {
    return NextResponse.json(
      { error: actErr?.message ?? '활동 데이터 저장 실패' },
      { status: 500 },
    );
  }

  // 2. 배출계수 조회 (현재 유효: valid_to IS NULL)
  const { data: factor, error: factErr } = await supabaseAdmin
    .from('emission_factors')
    .select('*')
    .eq('category', input.factorCategory)
    .is('valid_to', null)
    .single();

  if (factErr || !factor) {
    return NextResponse.json(
      { error: '배출계수를 찾을 수 없습니다.' },
      { status: 422 },
    );
  }

  // 3. 배출량 계산 및 emission_results 저장
  const emissionKgCo2e = input.quantity * factor.factor;

  await supabaseAdmin.from('emission_results').insert({
    activity_id: activity.id,
    factor_id: factor.id,
    company_id: input.companyId,
    year_month: activity.year_month,
    quantity: input.quantity,
    factor: factor.factor,
    emission_kg_co2e: emissionKgCo2e,
    scope,
  });

  return NextResponse.json(toCC<ActivityData>(activity), { status: 201 });
}
