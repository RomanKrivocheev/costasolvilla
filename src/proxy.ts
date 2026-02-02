import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED = ['es', 'en', 'ru'] as const;
type Lang = (typeof SUPPORTED)[number];

const detectLang = (req: NextRequest): Lang => {
  const cookieLang = req.cookies.get('lang')?.value as Lang | undefined;
  if (cookieLang && SUPPORTED.includes(cookieLang)) return cookieLang;

  const header = (req.headers.get('accept-language') || '').toLowerCase();
  if (header.includes('ru')) return 'ru';
  if (header.includes('en')) return 'en';
  return 'es';
};

export const proxy = (req: NextRequest) => {
  const url = req.nextUrl.clone();

  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  if (url.pathname === '/') {
    url.pathname = '/home';
    const res = NextResponse.redirect(url);

    if (!req.cookies.get('lang')) {
      res.cookies.set('lang', detectLang(req), { path: '/', sameSite: 'lax' });
    }
    return res;
  }

  if (!req.cookies.get('lang')) {
    const res = NextResponse.next();
    res.cookies.set('lang', detectLang(req), { path: '/', sameSite: 'lax' });
    return res;
  }

  return NextResponse.next();
};
