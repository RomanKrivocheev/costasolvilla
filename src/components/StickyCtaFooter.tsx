'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';

export const StickyCtaFooter = () => {
  const { t } = useLanguage();

  return (
    <div className="fixed sm:sticky bottom-0 inset-x-0 z-50 border-t border-foreground/10 bg-noise-footer">
      <div className="mx-auto w-full px-2 sm:px-3">
        <div className="flex items-center py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
          <div className="hidden sm:block flex-1">
            <Link
              href="/home"
              className="text-lg font-bold tracking-wide bg-linear-to-r from-secondary to-primary bg-clip-text text-transparent"
            >
              Costa Sol Villa
            </Link>
          </div>

          <div className="flex justify-center flex-1">
            <Button
              variant="secondary"
              className="w-full sm:w-auto cursor-pointer"
            >
              {t.checkAvailability}
            </Button>
          </div>

          <div className="hidden sm:flex flex-1 justify-end text-sm text-foreground/60">
            <span>{t.mapAddress}</span>
            <span className="mx-2">•</span>
            <span>{t.footerPhone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
