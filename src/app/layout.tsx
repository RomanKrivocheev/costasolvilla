import './globals.css';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/providers/language-provider';
import { ThemeProvider } from '@/providers/themeProvider';
import type { Lang } from '@/i18n/dictionaries';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Costa Sol Villa',
  description:
    'Luxury seaside villa in Fuengirola with modern amenities, coastal views, and easy booking.',
  metadataBase: new URL('https://costasolvilla.com'),
  icons: {
    icon: '/logoMetadataIcon.png',
    apple: '/logoMetadataIcon.png',
  },
  openGraph: {
    title: 'Costa Sol Villa',
    description:
      'Luxury seaside villa in Fuengirola with modern amenities, coastal views, and easy booking.',
    url: '/',
    siteName: 'Costa Sol Villa',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Costa Sol Villa',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Costa Sol Villa',
    description:
      'Luxury seaside villa in Fuengirola with modern amenities, coastal views, and easy booking.',
    images: ['/og-image.jpg'],
  },
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value as Lang) || 'es';

  return (
    <html lang={lang}>
      <body className="bg-noise">
        <ThemeProvider>
          <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
