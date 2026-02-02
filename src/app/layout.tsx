import './globals.css';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/providers/language-provider';
import { ThemeProvider } from '@/providers/themeProvider';
import type { Lang } from '@/i18n/dictionaries';

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
