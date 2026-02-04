import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const rateLimit = new Map<string, number[]>();

const getClientIp = (req: Request) => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
};

export const POST = async (req: Request) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const attempts = rateLimit.get(ip) || [];
  const recent = attempts.filter((ts) => now - ts < WINDOW_MS);

  if (recent.length >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 },
    );
  }

  recent.push(now);
  rateLimit.set(ip, recent);

  const { password } = (await req.json()) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || !password || password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
};
