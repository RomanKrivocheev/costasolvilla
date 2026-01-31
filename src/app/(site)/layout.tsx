import type { ReactNode } from 'react';
import SiteHeader from '@/components/siteHeader';

const SiteLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 px-4 sm:px-6 lg:px-12 py-6">{children}</main>
    </div>
  );
};

export default SiteLayout;
