import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter, maybeFail } from '@/app/api/_store';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await jitter();

  if (maybeFail()) {
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }

  const { id } = await params;

  // emission_results는 ON DELETE CASCADE로 자동 삭제됨
  const { error } = await supabaseAdmin
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
