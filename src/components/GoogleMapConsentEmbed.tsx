'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';

type GoogleMapConsentEmbedProps = {
  embedSrc: string; // the iframe src
  openUrl: string; // link to Google Maps
  title: string;
};

export const GoogleMapConsentEmbed = ({
  embedSrc,
  openUrl,
  title,
}: GoogleMapConsentEmbedProps) => {
  const { t } = useLanguage();
  const [accepted, setAccepted] = useState(false);

  const safeEmbedSrc = useMemo(() => embedSrc, [embedSrc]);
  const safeOpenUrl = useMemo(() => openUrl, [openUrl]);

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <div className="relative w-full overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03] aspect-[4/3]">
        {!accepted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="text-sm text-foreground/80 max-w-md">
              {t.mapMapConsentLine}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setAccepted(true)}
              >
                {t.mapMapLoadButton}
              </Button>

              <Button asChild variant="ghost" className="cursor-pointer">
                <a href={safeOpenUrl} target="_blank" rel="noopener noreferrer">
                  {t.mapMapOpenInGoogle}
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            title={title}
            src={safeEmbedSrc}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </div>
  );
};
