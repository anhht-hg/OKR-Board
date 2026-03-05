import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const role = (await cookies()).get('okr_role')?.value === 'admin' ? 'admin' : 'viewer';
  return NextResponse.json({ role });
}
