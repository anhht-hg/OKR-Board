import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
    (await cookies()).set('okr_role', 'admin', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
}
