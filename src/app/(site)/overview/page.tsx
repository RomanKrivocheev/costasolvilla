'use client';

import { useLanguage } from '@/providers/language-provider';

const OverviewPage = () => {
  const { t } = useLanguage();

  return <div>{t.navOverview}</div>;
};

export default OverviewPage;
