'use client';

import { useLanguage } from '@/providers/language-provider';

const HomePage = () => {
  const { t } = useLanguage();

  return <div>{t.navHome}</div>;
};

export default HomePage;
