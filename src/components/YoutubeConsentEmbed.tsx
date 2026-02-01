'use client';

import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

type YouTubeConsentEmbedProps = {
  videoId: string;
  title: string;
};

export const YouTubeConsentEmbed = ({
  videoId,
  title,
}: YouTubeConsentEmbedProps) => {
  const { t } = useLanguage();
  const [accepted, setAccepted] = useState(false);

  const embedUrl = useMemo(() => {
    const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    });
    return `${base}?${params.toString()}`;
  }, [videoId]);

  const thumbnailUrl = useMemo(
    () => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    [videoId],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 my-20">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03]">
        {!accepted ? (
          <button
            type="button"
            className="group absolute inset-0 cursor-pointer"
            onClick={() => setAccepted(true)}
            aria-label={t.homeVideoPlayAria}
          >
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-background/90 border border-foreground/10 shadow-lg transition-transform group-hover:scale-105">
                <Play className="h-7 w-7 text-foreground" />
              </div>
            </div>
          </button>
        ) : (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      <p className="mt-2 text-xs text-foreground/60">{t.homeVideoDisclaimer}</p>
    </section>
  );
};
