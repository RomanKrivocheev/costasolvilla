'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { CldImage } from 'next-cloudinary';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import Link from 'next/link';
import { FolderSlider } from '@/components/FolderSlider';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Slide = {
  publicId: string;
  width: number;
  height: number;
};

type FolderMap = Record<string, Slide[]>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const GalleryCard = ({
  title,
  text,
  expanded,
  cover,
  folder,
  enableFallback,
  sliderFolder,
}: {
  title: string;
  text: string;
  expanded: string;
  cover: Slide | null;
  folder: string;
  enableFallback: boolean;
  sliderFolder: string;
}) => {
  const fallbackKey =
    !cover && enableFallback
      ? `/api/cloudinary/folder?folder=${encodeURIComponent(folder)}`
      : null;
  const { data: fallbackData } = useSWR<Slide[]>(fallbackKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60 * 1000,
  });
  const finalCover =
    cover ?? (Array.isArray(fallbackData) ? fallbackData[0] : null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer w-full rounded-xl border border-foreground/10 bg-background p-4 text-left shadow-md shadow-black/15 dark:shadow-white/15 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative w-full aspect-video sm:h-44 sm:w-88 md:h-52 md:w-104 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
              {finalCover ? (
                <>
                  <CldImage
                    src={finalCover.publicId}
                    alt=""
                    fill
                    className="object-cover scale-110 blur-xl opacity-30"
                    quality="auto"
                    format="auto"
                    aria-hidden
                  />
                  <CloudinaryImage
                    src={finalCover.publicId}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, 416px"
                    className="object-contain relative z-10"
                    quality="auto"
                    format="auto"
                  />
                </>
              ) : null}
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-lg font-semibold text-foreground">
                {title}
              </div>
              <div className="mt-1 text-sm text-foreground/70">{text}</div>
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="w-[92vw] sm:max-w-225">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <FolderSlider folder={sliderFolder} showCta={false} />

        <p className="text-sm text-foreground/70">{expanded}</p>
      </DialogContent>
    </Dialog>
  );
};

const GalleryFuengirolaPage = () => {
  const { t } = useLanguage();
  const cards = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const index = i + 1;
        return {
          folder: `GalleryFuengirola${index}`,
          sliderFolder: `GalleryFuengirola${index}Extended`,
          title: t[
            `galleryFuengirolaCard${index}Title` as keyof typeof t
          ] as string,
          text: t[`galleryFuengirolaText${index}` as keyof typeof t] as string,
          expanded: t[
            `galleryFuengirolaTextExpanded${index}` as keyof typeof t
          ] as string,
        };
      }),
    [t],
  );

  const foldersParam = useMemo(
    () => cards.map((c) => c.folder).join(','),
    [cards],
  );
  const { data: folderMap } = useSWR<FolderMap>(
    `/api/cloudinary/batch?folders=${encodeURIComponent(foldersParam)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000,
    },
  );

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 mt-6 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-semibold text-foreground">
            {t.galleryFuengirolaTitle}
          </h1>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/gallery">{t.backLabel}</Link>
          </Button>
        </div>
        <p className="text-base text-foreground/70">
          {t.galleryFuengirolaIntro}
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <GalleryCard
            key={card.folder}
            title={card.title}
            text={card.text}
            expanded={card.expanded}
            cover={
              folderMap && folderMap[card.folder]?.length
                ? folderMap[card.folder][0]
                : null
            }
            folder={card.folder}
            enableFallback={false}
            sliderFolder={card.sliderFolder}
          />
        ))}
      </section>
    </div>
  );
};

export default GalleryFuengirolaPage;
