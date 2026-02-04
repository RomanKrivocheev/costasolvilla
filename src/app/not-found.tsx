'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';

const NotFoundPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
        {t.notFoundTitle}
      </h1>
      <Button asChild variant="secondary" className="mt-6">
        <Link href="/home">{t.notFoundHome}</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
