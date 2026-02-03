'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

type Slide = {
  publicId: string;
  width: number;
  height: number;
  createdAt: string;
};

type FolderSliderProps = {
  folder: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  showCta?: boolean;
  autoplay?: boolean;
};

export const FolderSlider = ({
  folder,
  ctaLabel,
  onCtaClick,
  showCta = true,
  autoplay = false,
}: FolderSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);

  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const key = `/api/cloudinary/folder?folder=${encodeURIComponent(folder)}`;
  const { data, isLoading } = useSWR<Slide[]>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60 * 1000,
  });

  const slides = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );
  const canNavigate = useMemo(() => slides.length > 1, [slides.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: 0, behavior: 'auto' });
  }, [folder]);

  const safeActiveIndex = slides.length
    ? Math.min(activeIndex, slides.length - 1)
    : 0;

  const scrollToIndex = (index: number, behavior: ScrollBehavior) => {
    const el = trackRef.current;
    if (!el || !slides.length) return;

    const next = ((index % slides.length) + slides.length) % slides.length;
    el.scrollTo({ left: next * el.clientWidth, behavior });
    setActiveIndex(next);
  };

  const scrollByViewport = (dir: -1 | 1) => {
    if (!slides.length) return;
    scrollToIndex(safeActiveIndex + dir, 'smooth');
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !slides.length) return;

    const onScroll = () => {
      const width = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / width);
      setActiveIndex(Math.max(0, Math.min(idx, slides.length - 1)));
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [slides.length]);

  // Autoplay (optional)
  useEffect(() => {
    if (!autoplay || !canNavigate) return;

    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }

    autoplayRef.current = window.setInterval(() => {
      scrollToIndex(safeActiveIndex + 1, 'smooth');
    }, 10000);

    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    };
  }, [autoplay, canNavigate, safeActiveIndex, slides.length]);

  // Keep alignment correct on resize
  useEffect(() => {
    const onResize = () => scrollToIndex(safeActiveIndex, 'auto');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [safeActiveIndex, slides.length]);

  if (isLoading && !slides.length) {
    return (
      <section className="relative w-full">
        <div className="relative w-full aspect-[16/9] max-h-[65vh] overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/70" />
        </div>
      </section>
    );
  }

  if (!slides.length) {
    return (
      <div className="w-full py-10 text-center text-sm text-foreground/70">
        No images in “{folder}”.
      </div>
    );
  }

  return (
    <section className="relative w-full">
      <div
        ref={trackRef}
        className="flex w-full overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-lg"
        style={{ scrollbarWidth: 'none' }}
      >
        {slides.map((s) => (
          <div
            key={s.publicId}
            className="relative w-full shrink-0 snap-center"
          >
            <div className="relative w-full aspect-[16/9] max-h-[65vh] overflow-hidden bg-background">
              {/* Blurred background */}
              <CldImage
                src={s.publicId}
                alt=""
                fill
                className="object-cover scale-110 blur-2xl opacity-40"
                quality="auto"
                format="auto"
                aria-hidden
              />

              {/* Main image */}
              <CldImage
                src={s.publicId}
                alt="Costa Sol Villa"
                fill
                sizes="100vw"
                className="object-cover relative z-10"
                quality="auto"
                format="auto"
                priority
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom-center CTA */}
      {showCta && ctaLabel ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="secondary"
            className="
    pointer-events-auto
    cursor-pointer
    px-5 py-3
    text-sm font-medium
    shadow-md
    rounded-lg

    sm:px-8 sm:py-5
    sm:text-base
    sm:font-semibold
    sm:rounded-xl

    md:px-10 md:py-6
    md:text-lg

    transition-transform
    hover:scale-105
  "
            onClick={onCtaClick}
          >
            {ctaLabel}
          </Button>
        </div>
      ) : null}

      {canNavigate && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-auto"
            onClick={() => scrollByViewport(-1)}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-auto"
            onClick={() => scrollByViewport(1)}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </section>
  );
};
