import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'admin_session';

export type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const hasAdminSession = (cookieStore: CookieStore) =>
  !!cookieStore.get(ADMIN_COOKIE_NAME)?.value;
