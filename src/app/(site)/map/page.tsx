'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { GoogleMapConsentEmbed } from '@/components/GoogleMapConsentEmbed';
import { Bus, Plane, Route, TrainFront } from 'lucide-react';

type TransportItem = {
  key: string;
  label: string;
  distance: string;
  icon: React.ReactNode;
};

const MapPage = () => {
  const { t } = useLanguage();

  // Use a normal Google Maps embed link (no API key required)
  // Tip: open Google Maps → Share → Embed a map → copy the iframe src
  const embedSrc = useMemo(
    () =>
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3204.418807566054!2d-4.6121053237933625!3d36.56812418074683!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd72e32fc6508639%3A0xde0fcc5d49465702!2sPara%C3%ADso%20del%20mar!5e0!3m2!1ses-419!2ses!4v1769968510243!5m2!1ses-419!2ses',
    [],
  );

  // Normal “open in maps” URL (share link)
  const openUrl = useMemo(
    () => 'https://maps.app.goo.gl/bn3b2pjsx3q5T9Fz6',
    [],
  );

  const transportItems: TransportItem[] = [
    {
      key: 'airport',
      label: t.mapAirportLabel,
      distance: t.mapAirportDistance,
      icon: <Plane className="h-5 w-5" />,
    },
    {
      key: 'bus',
      label: t.mapBusLabel,
      distance: t.mapBusDistance,
      icon: <Bus className="h-5 w-5" />,
    },
    {
      key: 'highway',
      label: t.mapHighwayLabel,
      distance: t.mapHighwayDistance,
      icon: <Route className="h-5 w-5" />,
    },
    {
      key: 'train',
      label: t.mapTrainLabel,
      distance: t.mapTrainDistance,
      icon: <TrainFront className="h-5 w-5" />,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl my-16 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left column */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t.mapTitle}</h1>
            <div className="mt-2 text-foreground/80">{t.mapAddress}</div>
          </div>

          <p className="text-foreground/80 leading-relaxed">
            {t.mapDescription}
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{t.mapTransportTitle}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {transportItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-foreground/10 bg-background p-4"
                >
                  <div className="flex items-center gap-2 text-foreground/80">
                    {item.icon}
                    <div className="text-sm font-semibold">{item.distance}</div>
                  </div>
                  <div className="mt-2 text-sm text-foreground/70">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <GoogleMapConsentEmbed
          title={t.mapMapTitle}
          embedSrc={embedSrc}
          openUrl={openUrl}
        />
      </div>
    </section>
  );
};

export default MapPage;
