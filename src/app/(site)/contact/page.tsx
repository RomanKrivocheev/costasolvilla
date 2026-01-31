'use client';

import { useLanguage } from '@/providers/language-provider';

const ContactPage = () => {
  const { t } = useLanguage();

  return <div>{t.navContact}</div>;
};

export default ContactPage;
