'use client';

import { HomeIntroBlocks } from '@/components/HomeIntroBlocks';
import { useLanguage } from '@/providers/language-provider';

const GalleryPage = () => {
  const { t } = useLanguage();

  return (
    <HomeIntroBlocks
      hoverable
      imageFolder="GalleryImages"
      compactDesktop
      blocks={[
        {
          title: t.galleryBlockFuengirolaTitle,
          href: '/gallery/fuengirola',
        },
        {
          title: t.galleryBlockVillaTitle,
          href: '/gallery/villa',
        },
      ]}
    />
  );
};

export default GalleryPage;
