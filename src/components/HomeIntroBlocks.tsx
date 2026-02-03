'use client';

import { useEffect, useState } from 'react';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import { useLanguage } from '@/providers/language-provider';

type ImageItem = {
  publicId: string;
};

type IntroBlock = {
  title: string;
  text?: string;
  href?: string;
};

type HomeIntroBlocksProps = {
  imageFolder?: string;
  blocks?: [IntroBlock, IntroBlock];
  hoverable?: boolean;
  compactDesktop?: boolean;
};

export const HomeIntroBlocks = ({
  imageFolder = 'HomeImages',
  blocks,
  hoverable = false,
  compactDesktop = false,
}: HomeIntroBlocksProps) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(
        `/api/cloudinary/folder?folder=${encodeURIComponent(imageFolder)}`,
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

  const defaultBlocks: [IntroBlock, IntroBlock] = [
    { title: t.homeTitle1, text: t.homeText1 },
    { title: t.homeTitle2, text: t.homeText2 },
  ];
  const resolvedBlocks = blocks ?? defaultBlocks;

  const wrapperClass = `grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center ${
    hoverable ? 'transition-transform hover:-translate-y-1' : ''
  }`;
  const hoverClass = hoverable
    ? 'transition-all hover:shadow-xl cursor-pointer'
    : '';
  const sectionClass = compactDesktop
    ? 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 my-10 space-y-12'
    : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 my-20 space-y-24';
  const titleClass = compactDesktop
    ? 'text-2xl md:text-3xl font-bold mb-3'
    : 'text-3xl font-bold mb-4';
  const imageClass = compactDesktop
    ? 'relative w-full aspect-square md:aspect-[4/3] lg:aspect-[3/2] overflow-hidden rounded-xl'
    : 'relative w-full aspect-square overflow-hidden rounded-xl';

  return (
    <section className={sectionClass}>
      {/* Block 1 */}
      {resolvedBlocks[0].href ? (
        <Link href={resolvedBlocks[0].href} className={`${wrapperClass} group`}>
          <div
            className={`${imageClass} ${hoverClass}`}
          >
            <CldImage
              src={images[0].publicId}
              alt={resolvedBlocks[0].title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              quality="auto"
              format="auto"
            />
          </div>

          <div>
            <h1 className={titleClass}>{resolvedBlocks[0].title}</h1>
            {resolvedBlocks[0].text ? (
              <p className="text-foreground/80 leading-relaxed">
                {resolvedBlocks[0].text}
              </p>
            ) : null}
          </div>
        </Link>
      ) : (
        <div className={wrapperClass}>
          <div
            className={`${imageClass} ${hoverClass}`}
          >
            <CldImage
              src={images[0].publicId}
              alt={resolvedBlocks[0].title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              quality="auto"
              format="auto"
            />
          </div>

          <div>
            <h1 className={titleClass}>{resolvedBlocks[0].title}</h1>
            {resolvedBlocks[0].text ? (
              <p className="text-foreground/80 leading-relaxed">
                {resolvedBlocks[0].text}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Block 2 (reversed) */}
      {resolvedBlocks[1].href ? (
        <Link
          href={resolvedBlocks[1].href}
          className={`${wrapperClass} group`}
        >
          <div
            className={`md:order-2 ${imageClass} ${hoverClass}`}
          >
            <CldImage
              src={images[1].publicId}
              alt={resolvedBlocks[1].title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              quality="auto"
              format="auto"
            />
          </div>

          <div className="md:order-1">
            <h1 className={titleClass}>{resolvedBlocks[1].title}</h1>
            {resolvedBlocks[1].text ? (
              <p className="text-foreground/80 leading-relaxed">
                {resolvedBlocks[1].text}
              </p>
            ) : null}
          </div>
        </Link>
      ) : (
        <div className={wrapperClass}>
          <div
            className={`md:order-2 ${imageClass} ${hoverClass}`}
          >
            <CldImage
              src={images[1].publicId}
              alt={resolvedBlocks[1].title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              quality="auto"
              format="auto"
            />
          </div>

          <div className="md:order-1">
            <h1 className={titleClass}>{resolvedBlocks[1].title}</h1>
            {resolvedBlocks[1].text ? (
              <p className="text-foreground/80 leading-relaxed">
                {resolvedBlocks[1].text}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
};
