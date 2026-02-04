import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'admin_session';

export const hasAdminSession = () => {
  const cookieStore = cookies();
  return !!cookieStore.get(ADMIN_COOKIE_NAME)?.value;
};
