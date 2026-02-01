'use client';

import { useEffect, useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { useLanguage } from '@/providers/language-provider';

type ImageItem = {
  publicId: string;
};

export const HomeIntroBlocks = () => {
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(
        `/api/cloudinary/folder?folder=${encodeURIComponent('HomeImages')}`,
      );
      const data = (await res.json()) as ImageItem[];

      if (Array.isArray(data)) {
        setImages(data.slice(0, 2)); // only first 2 images
      }
    };

    run();
  }, []);

  if (images.length < 2) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 my-20 space-y-24">
      {/* Block 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
          <CldImage
            src={images[0].publicId}
            alt={t.homeTitle1}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            quality="auto"
            format="auto"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{t.homeTitle1}</h1>
          <p className="text-foreground/80 leading-relaxed">{t.homeText1}</p>
        </div>
      </div>

      {/* Block 2 (reversed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="md:order-2 relative w-full aspect-[16/9] overflow-hidden rounded-xl">
          <CldImage
            src={images[1].publicId}
            alt={t.homeTitle2}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            quality="auto"
            format="auto"
          />
        </div>

        <div className="md:order-1">
          <h1 className="text-3xl font-bold mb-4">{t.homeTitle2}</h1>
          <p className="text-foreground/80 leading-relaxed">{t.homeText2}</p>
        </div>
      </div>
    </section>
  );
};
