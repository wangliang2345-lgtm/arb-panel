// app/api/debug/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const host = process.env.OPTICODDS_API_HOST;
  const scheme = process.env.OPTICODDS_AUTH_SCHEME;
  const key = process.env.OPTICODDS_API_KEY || '';
  const sport = process.env.SPORT_KEY;
  const books = process.env.SPORTSBOOKS;

  return NextResponse.json({
    host,
    scheme,
    hasKey: key.length > 0,
    keyPreview: key ? `len=${key.length}` : 'missing',
    sport,
    books
  });
}
