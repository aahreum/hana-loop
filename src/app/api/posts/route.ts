import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter, maybeFail } from '@/app/api/_store';
import { toCC, toCCArray } from '@/shared/lib/case';
import { CreatePostSchema } from '@/shared/types/post';
import type { Post } from '@/shared/types/post';

export async function GET(req: NextRequest) {
  await jitter();

  const { searchParams } = req.nextUrl;
  const resourceUid = searchParams.get('resourceUid');
  const dateTime = searchParams.get('dateTime');

  let query = supabaseAdmin
    .from('posts')
    .select('*')
    .order('date_time', { ascending: false });

  if (resourceUid) query = query.eq('resource_uid', resourceUid);
  if (dateTime) query = query.eq('date_time', dateTime);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toCCArray<Post>(data ?? []));
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
  const parsed = CreatePostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.',
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title: input.title,
      resource_uid: input.resourceUid,
      date_time: input.dateTime,
      content: input.content,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? '게시물 저장 실패' },
      { status: 500 },
    );
  }

  return NextResponse.json(toCC<Post>(data), { status: 201 });
}
