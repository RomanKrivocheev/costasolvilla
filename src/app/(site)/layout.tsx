import type { ReactNode } from 'react';
import SiteHeader from '@/components/siteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StickyCtaFooter } from '@/components/StickyCtaFooter';

const SiteLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-dvh flex flex-col text-foreground">
      <SiteHeader />

      <main className="flex-1 px-4 sm:px-6 lg:px-12 pt-6 pb-24 sm:pb-6 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.6)] dark:shadow-[0_32px_80px_-40px_rgba(255,255,255,0.18)]">
        {children}
      </main>

      <StickyCtaFooter />

      <SiteFooter />
    </div>
  );
};

export default SiteLayout;
