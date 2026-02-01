'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { Button } from '@/components/ui/button';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

type Slide = {
  publicId: string;
  width: number;
  height: number;
  createdAt: string;
};

type FolderSliderProps = {
  folder: string;
  ctaLabel: string;
  onCtaClick?: () => void;
};

export const FolderSlider = ({
  folder,
  ctaLabel,
  onCtaClick,
}: FolderSliderProps) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);

  const canNavigate = useMemo(() => slides.length > 1, [slides.length]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/cloudinary/folder?folder=${encodeURIComponent(folder)}`,
        );
        const data = (await res.json()) as Slide[];
        const nextSlides = Array.isArray(data) ? data : [];

        setSlides(nextSlides);
        setActiveIndex(0);

        const el = trackRef.current;
        if (el) el.scrollTo({ left: 0, behavior: 'auto' });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [folder]);

  const scrollToIndex = (index: number, behavior: ScrollBehavior) => {
    const el = trackRef.current;
    if (!el || !slides.length) return;

    const next = ((index % slides.length) + slides.length) % slides.length;
    el.scrollTo({ left: next * el.clientWidth, behavior });
    setActiveIndex(next);
  };

  const scrollByViewport = (dir: -1 | 1) => {
    if (!slides.length) return;
    scrollToIndex(activeIndex + dir, 'smooth');
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

  // Autoplay: 5s, loop
  useEffect(() => {
    if (!canNavigate) return;

    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }

    autoplayRef.current = window.setInterval(() => {
      scrollToIndex(activeIndex + 1, 'smooth');
    }, 5000);

    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    };
  }, [canNavigate, activeIndex, slides.length]);

  // Keep alignment correct on resize
  useEffect(() => {
    const onResize = () => scrollToIndex(activeIndex, 'auto');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIndex, slides.length]);

  if (loading) {
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
            <div className="relative w-full aspect-[16/9] max-h-[65vh] overflow-hidden">
              <CldImage
                src={s.publicId}
                alt="Costa Sol Villa"
                fill
                sizes="100vw"
                className="object-cover"
                quality="auto"
                format="auto"
                priority
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom-center CTA */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
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

      {canNavigate && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2"
            onClick={() => scrollByViewport(-1)}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2"
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
