'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dictionary, Lang } from '@/i18n/dictionaries';
import { Playfair_Display } from 'next/font/google';

import { useLanguage } from '@/providers/language-provider';
import { useTheme } from '@/providers/themeProvider';
import { Button } from '@/components/ui/button';
import {
  Cloud,
  Clock,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Camera,
  Menu,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { fetchFuengirolaSnapshot } from '@/services/fuengirolaMeteo';

const logoFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
});

const LANGS: Lang[] = ['es', 'en', 'ru'];

function WeatherIcon({ code }: { code: number }) {
  // Based on Open-Meteo WMO weather codes
  // https://open-meteo.com/en/docs (weather_code)
  if (code === 0) return <Sun className="h-3.5 w-3.5" aria-label="Clear" />;
  if (code === 1)
    return <CloudSun className="h-3.5 w-3.5" aria-label="Mainly clear" />;
  if (code === 2)
    return <CloudSun className="h-3.5 w-3.5" aria-label="Partly cloudy" />;
  if (code === 3)
    return <Cloud className="h-3.5 w-3.5" aria-label="Overcast" />;

  if (code === 45 || code === 48)
    return <CloudFog className="h-3.5 w-3.5" aria-label="Fog" />;

  if (code >= 51 && code <= 57)
    return <CloudDrizzle className="h-3.5 w-3.5" aria-label="Drizzle" />;

  if (code >= 61 && code <= 67)
    return <CloudRain className="h-3.5 w-3.5" aria-label="Rain" />;

  if (code >= 71 && code <= 77)
    return <CloudSnow className="h-3.5 w-3.5" aria-label="Snow" />;

  if (code >= 80 && code <= 82)
    return <CloudRain className="h-3.5 w-3.5" aria-label="Rain showers" />;

  if (code >= 95 && code <= 99)
    return <CloudLightning className="h-3.5 w-3.5" aria-label="Thunderstorm" />;

  return <Cloud className="h-3.5 w-3.5" aria-label="Weather" />;
}

function getWeatherLabel(code: number, t: Dictionary) {
  if (code === 0) return t.weatherSunny;
  if (code === 1) return t.weatherMostlyClear;
  if (code === 2) return t.weatherPartlyCloudy;
  if (code === 3) return t.weatherCloudy;
  if (code === 45 || code === 48) return t.weatherFog;
  if (code >= 51 && code <= 57) return t.weatherDrizzle;
  if (code >= 61 && code <= 67) return t.weatherRain;
  if (code >= 71 && code <= 77) return t.weatherSnow;
  if (code >= 80 && code <= 82) return t.weatherShowers;
  if (code >= 95 && code <= 99) return t.weatherThunderstorm;
  return t.weatherGeneric;
}

const SiteHeader = () => {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 24 });

  const [openLang, setOpenLang] = useState(false);
  const [openMobileNav, setOpenMobileNav] = useState(false);
  const [openMobileSettings, setOpenMobileSettings] = useState(false);
  const [openWebcam, setOpenWebcam] = useState(false);

  // Fuengirola info (fetched once)
  const [temperatureC, setTemperatureC] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [clock, setClock] = useState<string>('—:—');
  const [webcamEmbed, setWebcamEmbed] = useState<string | null>(null);
  const [webcamTitle, setWebcamTitle] = useState<string>('Fuengirola webcam');

  const navItems = useMemo(
    () => [
      { href: '/home', label: t.navHome },
      { href: '/overview', label: t.navOverview },
      { href: '/fuengirola-city', label: t.navFuengirolaCity },
      { href: '/map', label: t.navMap },
      { href: '/prices', label: t.navPrices },
      { href: '/gallery', label: t.navGallery },
    ],
    [t],
  );

  const isActive = useCallback(
    (href: string) => {
      if (href === '/gallery') return pathname.startsWith('/gallery');
      return pathname === href;
    },
    [pathname],
  );

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await fetchFuengirolaSnapshot();
        setTemperatureC(snap.temperatureC);
        setWeatherCode(snap.weatherCode);
      } catch {
        setTemperatureC(null);
        setWeatherCode(null);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/webcam/fuengirola', {
          cache: 'no-store',
        });
        const data = (await res.json()) as {
          ok?: boolean;
          title?: string;
          embed?: string | null;
        };
        if (data.ok && data.embed) {
          setWebcamEmbed(data.embed);
          setWebcamTitle(data.title ?? 'Fuengirola webcam');
        } else {
          setWebcamEmbed(null);
        }
      } catch {
        setWebcamEmbed(null);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = navItems.findIndex((item) => isActive(item.href));
      const activeEl = linkRefs.current[activeIndex];
      const navEl = navRef.current;
      if (!activeEl || !navEl) return;

      const navRect = navEl.getBoundingClientRect();
      const linkRect = activeEl.getBoundingClientRect();
      const center = linkRect.left - navRect.left + linkRect.width / 2;
      const width = Math.max(18, Math.min(32, linkRect.width * 0.5));
      setIndicator({ left: center - width / 2, width });
    };

    updateIndicator();
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname, lang, navItems, isActive]);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Madrid',
      }),
    [],
  );

  useEffect(() => {
    const update = () => setClock(timeFormatter.format(new Date()));

    update();
    const id = window.setInterval(update, 1000);

    return () => window.clearInterval(id);
  }, [timeFormatter]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background border-foreground/10">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-12">
        {/* Make this min-w-0 so the second line can stay single-line on mobile */}
        <div className="flex-1 min-w-0">
          <Link
            href="/home"
            className={`${logoFont.className} text-2xl font-bold tracking-wide bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent`}
          >
            Costa Sol Villa
          </Link>

          <Dialog open={openWebcam} onOpenChange={setOpenWebcam}>
            <DialogTrigger asChild>
              {/* Mobile info line (fixed, uses available space) */}
              <div className="md:hidden cursor-pointer rounded-md py-1 text-xs text-foreground/70 leading-tight flex items-center gap-2 min-w-0 whitespace-nowrap transition-colors hover:bg-foreground/5">
                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">
                  {t.locationFuengirola}
                </span>

                <div className="ml-auto flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1">
                    {weatherCode == null ? null : (
                      <WeatherIcon code={weatherCode} />
                    )}
                    <span>
                      {temperatureC == null
                        ? '—°'
                        : `${Math.round(temperatureC)}°`}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="h-3.5 w-3.5" aria-label="Time" />
                    <span>{clock}</span>
                  </span>

                  {webcamEmbed ? (
                    <span className="inline-flex items-center gap-1 blink-theme">
                      <Camera className="h-3.5 w-3.5" aria-label="Live" />
                      <span>{t.watchLive}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </DialogTrigger>

            <DialogTrigger asChild>
              {/* Desktop info line */}
              <div className="hidden md:flex cursor-pointer rounded-md py-1 text-xs text-foreground/70 leading-tight items-center gap-2 min-w-0 whitespace-nowrap transition-colors hover:bg-foreground/5">
                <span className="min-w-0 overflow-hidden text-ellipsis">
                  {t.locationFuengirolaMalaga}
                </span>

                <span className="shrink-0">•</span>

                <span className="shrink-0 inline-flex items-center gap-1">
                  {weatherCode == null ? null : (
                    <WeatherIcon code={weatherCode} />
                  )}
                  <span>
                    {temperatureC == null
                      ? '—°'
                      : `${Math.round(temperatureC)}°`}
                  </span>
                </span>

                <span className="shrink-0">•</span>

                <span className="shrink-0 inline-flex items-center gap-1 tabular-nums">
                  <Clock className="h-3.5 w-3.5" aria-label="Time" />
                  <span>{clock}</span>
                </span>

                {webcamEmbed ? (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 inline-flex items-center gap-1 blink-theme">
                      <Camera className="h-3.5 w-3.5" aria-label="Live" />
                      <span>{t.watchLive}</span>
                    </span>
                  </>
                ) : null}
              </div>
            </DialogTrigger>

            <DialogContent className="w-[92vw] sm:max-w-[720px]">
              <DialogHeader>
                <DialogTitle>{webcamTitle}</DialogTitle>
              </DialogHeader>

              {webcamEmbed ? (
                <div className="aspect-video overflow-hidden rounded-md border">
                  {webcamEmbed.trim().startsWith('<') ? (
                    <div
                      className="h-full w-full"
                      dangerouslySetInnerHTML={{ __html: webcamEmbed }}
                    />
                  ) : (
                    <iframe
                      src={webcamEmbed}
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      loading="lazy"
                      title={webcamTitle}
                    />
                  )}
                </div>
              ) : null}

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" aria-label="Location" />
                  <span>{t.locationFuengirolaMalaga}</span>
                </div>
                <div className="flex items-center gap-2">
                  {weatherCode == null ? null : (
                    <WeatherIcon code={weatherCode} />
                  )}
                  <span>
                    {weatherCode == null
                      ? t.weatherGeneric
                      : getWeatherLabel(weatherCode, t)}
                    {temperatureC == null
                      ? ' · —°'
                      : ` · ${Math.round(temperatureC)}°C`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-label="Time" />
                  <span>{clock}</span>
                </div>

                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button className="cursor-pointer" variant="ghost">
                      {t.dialogClose}
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <nav
          ref={navRef}
          className="relative hidden md:flex items-center gap-8"
        >
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => {
                linkRefs.current[index] = el;
              }}
              className={`text-base font-semibold transition-colors duration-300 ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <span
            className="pointer-events-none absolute -bottom-1 h-0.5 rounded-full bg-primary transition-[transform,width] duration-300"
            style={{
              width: `${indicator.width}px`,
              transform: `translateX(${indicator.left}px)`,
            }}
          />
        </nav>

        <div className="flex flex-1 justify-end">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button className="cursor-pointer" variant="secondary">
              {t.ctaBookNow}
            </Button>

            <Dialog open={openLang} onOpenChange={setOpenLang}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer" variant="outline">
                  {lang.toUpperCase()}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[360px]">
                <DialogHeader>
                  <DialogTitle>{t.labelLanguage}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-2">
                  {LANGS.map((l) => (
                    <Button
                      key={l}
                      variant={l === lang ? 'secondary' : 'outline'}
                      className="justify-start cursor-pointer"
                      onClick={() => {
                        setLang(l);
                        setOpenLang(false);
                      }}
                    >
                      {l.toUpperCase()}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button className="cursor-pointer" variant="ghost">
                      {t.dialogClose}
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="cursor-pointer"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <Dialog open={openMobileNav} onOpenChange={setOpenMobileNav}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open menu"
                  className="cursor-pointer"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </DialogTrigger>

              <DialogContent className="w-[92vw] sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>{t.dialogMenuTitle}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3">
                  <Button
                    variant="secondary"
                    className="w-full cursor-pointer mb-4"
                  >
                    {t.ctaBookNow}
                  </Button>

                  <div className="grid space-y-4">
                    {navItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className="justify-start cursor-pointer"
                        asChild
                        onClick={() => setOpenMobileNav(false)}
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button className="cursor-pointer" variant="ghost">
                      {t.dialogClose}
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={openMobileSettings}
              onOpenChange={setOpenMobileSettings}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open settings"
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>

              <DialogContent className="w-[92vw] sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>{t.dialogSettingsTitle}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-semibold">
                      {t.labelTheme}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleTheme}
                      aria-label="Toggle theme"
                      className="cursor-pointer"
                    >
                      <Sun className="h-4 w-4 dark:hidden" />
                      <Moon className="hidden h-4 w-4 dark:block" />
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">
                      {t.labelLanguage}
                    </div>
                    <div className="grid gap-2">
                      {LANGS.map((l) => (
                        <Button
                          key={l}
                          variant={l === lang ? 'secondary' : 'outline'}
                          className="justify-start cursor-pointer"
                          onClick={() => setLang(l)}
                        >
                          {l.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button className="cursor-pointer" variant="ghost">
                      {t.dialogClose}
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
