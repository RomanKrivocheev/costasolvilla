'use client';

import Link from 'next/link';
import type { Lang } from '@/i18n/dictionaries';
import { useLanguage } from '@/providers/language-provider';
import { useTheme } from '@/providers/themeProvider';
import { Button } from '@/components/ui/button';
import { Menu, Moon, Settings, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGS: Lang[] = ['es', 'en', 'ru'];

const SiteHeader = () => {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { href: '/home', label: t.navHome },
    { href: '/prices', label: t.navPrices },
    { href: '/gallery', label: t.navGallery },
    { href: '/contact', label: t.navContact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background border-foreground/10">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-12">
        <div className="flex-1">
          <Link href="/home" className="text-lg font-semibold text-primary">
            {t.brand}
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 justify-end">
          <div className="hidden md:flex items-center gap-3">
            <Button className="cursor-pointer" variant="secondary">
              {t.ctaBookNow}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="cursor-pointer" variant="outline" size="sm">
                  {lang.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={lang}
                  onValueChange={(value) => setLang(value as Lang)}
                >
                  {LANGS.map((l) => (
                    <DropdownMenuRadioItem key={l} value={l}>
                      {l.toUpperCase()}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

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

          <div className="flex md:hidden items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <Button variant="secondary" className="w-full">
                    {t.ctaBookNow}
                  </Button>
                </div>
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm font-semibold">{t.labelTheme}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    <Sun className="h-4 w-4 dark:hidden" />
                    <Moon className="hidden h-4 w-4 dark:block" />
                  </Button>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>{t.labelLanguage}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={lang}
                  onValueChange={(value) => setLang(value as Lang)}
                >
                  {LANGS.map((l) => (
                    <DropdownMenuRadioItem key={l} value={l}>
                      {l.toUpperCase()}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
