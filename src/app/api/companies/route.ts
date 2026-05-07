import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase.server';
import { jitter, toCCArray } from '@/app/api/_store';
import type { Company } from '@/shared/types/company';

export async function GET() {
  await jitter();

  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toCCArray<Company>(data ?? []));
}
