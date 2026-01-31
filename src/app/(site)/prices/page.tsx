'use client';

import { useLanguage } from '@/providers/language-provider';

const PricesPage = () => {
  const { t } = useLanguage();

  return <div>{t.navPrices}</div>;
};

export default PricesPage;
