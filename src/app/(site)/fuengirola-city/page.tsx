'use client';

import { useLanguage } from '@/providers/language-provider';
import { FolderSlider } from '@/components/FolderSlider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CldImage } from 'next-cloudinary';
import { useMemo } from 'react';
import useSWR from 'swr';

type Slide = {
  publicId: string;
  width: number;
  height: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
type FolderMap = Record<string, Slide[]>;

const FuengirolaCard = ({
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
          className="cursor-pointer w-full rounded-xl border border-foreground/10 bg-background p-4 text-left shadow-md shadow-black/15 dark:shadow-white/15 transition-all hover:-translate-y-0.5 hover:shadow-lg md:min-h-[180px]"
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
                  <CldImage
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

      <DialogContent className="w-[92vw] sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <FolderSlider folder={sliderFolder} showCta={false} />

        <p className="text-sm text-foreground/70">{expanded}</p>
      </DialogContent>
    </Dialog>
  );
};

const FuengirolaCityPage = () => {
  const { t } = useLanguage();
  const cards = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const index = i + 1;
        return {
          folder: `FuengirolaCard${index}`,
          sliderFolder: `FuengirolaCard${index}Extended`,
          title: t[`fuengirolaCard${index}Title` as keyof typeof t] as string,
          text: t[`fuengirolaText${index}` as keyof typeof t] as string,
          expanded: t[
            `fuengirolaTextExpanded${index}` as keyof typeof t
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
      <FolderSlider
        folder="FuengirolaSlider"
        ctaLabel={t.ctaBookNow}
        onCtaClick={() => {
          // booking logic
        }}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 mt-5 space-y-2">
        <h1 className="text-4xl md:text-5xl font-semibold text-foreground">
          {t.fuengirolaTitle}
        </h1>
        <p className="text-base text-foreground/70">{t.fuengirolaIntro}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 mt-6 space-y-3">
        {cards.map((card) => (
          <FuengirolaCard
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

export default FuengirolaCityPage;
