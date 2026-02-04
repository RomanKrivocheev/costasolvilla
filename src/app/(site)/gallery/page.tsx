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
          text: t.galleryBlockFuengirolaText,
          href: '/gallery/fuengirola',
        },
        {
          title: t.galleryBlockVillaTitle,
          text: t.galleryBlockVillaText,
          href: '/gallery/villa',
        },
      ]}
    />
  );
};

export default GalleryPage;
