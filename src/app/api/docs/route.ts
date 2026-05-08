import { NextResponse } from 'next/server';
import { generateOpenApiDocument } from '@/shared/lib/openapi';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(generateOpenApiDocument());
}
