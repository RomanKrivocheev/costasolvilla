'use client';

import { useLanguage } from '@/providers/language-provider';

const AvailabilityPage = () => {
  const { t } = useLanguage();

  return <div>{t.navAvailability}</div>;
};

export default AvailabilityPage;
