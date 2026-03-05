import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  (await cookies()).delete('okr_role');
  return NextResponse.json({ ok: true });
}
