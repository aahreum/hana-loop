import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter, maybeFail } from '@/app/api/_store';
import { toCC, toCCArray } from '@/shared/lib/case';
import { CreateActivitySchema } from '@/shared/types/activity';
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

  // activities + emission_results를 하나의 트랜잭션으로 저장 (RPC)
  const { data, error } = await supabaseAdmin.rpc(
    'create_activity_with_emission',
    {
      p_company_id: input.companyId,
      p_date: input.date,
      p_type: input.type,
      p_description: input.description,
      p_factor_category: input.factorCategory,
      p_quantity: input.quantity,
      p_unit: input.unit,
    },
  );

  if (error) {
    const status = error.message.includes('FACTOR_NOT_FOUND') ? 422 : 500;
    const message =
      status === 422 ? '배출계수를 찾을 수 없습니다.' : '활동 데이터 저장 실패';
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(
    toCC<ActivityData>(data as Record<string, unknown>),
    {
      status: 201,
    },
  );
}
