'use client';

import { useLanguage } from '@/providers/language-provider';

const GalleryPage = () => {
  const { t } = useLanguage();

  return <div>{t.navGallery}</div>;
};

export default GalleryPage;
