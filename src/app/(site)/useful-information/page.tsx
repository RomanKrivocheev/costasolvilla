'use client';

import { useLanguage } from '@/providers/language-provider';

const UsefulInformationPage = () => {
  const { t } = useLanguage();

  return <div>{t.navUsefulInfo}</div>;
};

export default UsefulInformationPage;
