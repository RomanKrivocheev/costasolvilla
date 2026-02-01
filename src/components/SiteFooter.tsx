'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';

const IUBENDA_PRIVACY_HREF = 'https://www.iubenda.com/privacy-policy/29249604';
const IUBENDA_COOKIE_HREF =
  'https://www.iubenda.com/privacy-policy/29249604/cookie-policy';

export const SiteFooter = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6">
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="ghost" className="cursor-pointer">
              <Link
                href={IUBENDA_PRIVACY_HREF}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.footerPrivacy}
              </Link>
            </Button>

            <Button asChild variant="ghost" className="cursor-pointer">
              <Link
                href={IUBENDA_COOKIE_HREF}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.footerCookies}
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between pb-2">
          <div className="text-sm text-foreground/70 text-center sm:text-left">
            <div>Calle Azalea, 10, 29640 Fuengirola, Málaga</div>
            <div className="mt-2">Cel: +34 642536101</div>
            <div>Email: costasolvilla1@gmail.com</div>
          </div>

          <div className="text-sm text-foreground/70 text-center sm:text-right sm:self-end">
            © {new Date().getFullYear()} {t.brand}
          </div>
        </div>
      </div>
    </footer>
  );
};
