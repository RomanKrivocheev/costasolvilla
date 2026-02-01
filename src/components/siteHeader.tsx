'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Lang } from '@/i18n/dictionaries';
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

  // Fuengirola info (fetched once)
  const [temperatureC, setTemperatureC] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [clock, setClock] = useState<string>('—:—');

  const navItems = [
    { href: '/home', label: t.navHome },
    { href: '/overview', label: t.navOverview },
    { href: '/map', label: t.navMap },
    { href: '/availability', label: t.navAvailability },
    { href: '/useful-information', label: t.navUsefulInfo },
    { href: '/prices', label: t.navPrices },
    { href: '/gallery', label: t.navGallery },
    { href: '/contact', label: t.navContact },
  ];

  const isActive = (href: string) => pathname === href;

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
  }, [pathname, lang, theme, isActive, navItems]);

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
          <Link href="/home" className="text-2xl font-bold text-primary">
            Costa Sol Villa
          </Link>

          <div className="text-xs text-foreground/70 leading-tight flex items-center gap-2 min-w-0 whitespace-nowrap">
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">
              <span className="sm:hidden">Fuengirola</span>
              <span className="hidden sm:inline">Fuengirola, Málaga</span>
            </span>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1">
                {weatherCode == null ? null : (
                  <WeatherIcon code={weatherCode} />
                )}
                <span>
                  {temperatureC == null ? '—°' : `${Math.round(temperatureC)}°`}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="h-3.5 w-3.5" />
                <span>{clock}</span>
              </span>
            </div>
          </div>
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
                      Close
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
                  <DialogTitle>Menu</DialogTitle>
                </DialogHeader>

                <div className="grid gap-3">
                  <Button variant="secondary" className="w-full cursor-pointer">
                    {t.ctaBookNow}
                  </Button>

                  <div className="grid">
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
                      Close
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
                  <DialogTitle>Settings</DialogTitle>
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
                      Close
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
