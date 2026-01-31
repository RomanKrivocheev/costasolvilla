'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Dictionary, Lang } from '@/i18n/dictionaries';
import { dictionaries } from '@/i18n/dictionaries';

type LanguageContextValue = {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function setLangCookie(lang: Lang) {
  document.cookie = `lang=${lang}; path=/; samesite=lax`;
}

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = (next: Lang) => {
    setLangState(next);
    setLangCookie(next);
  };

  const value = useMemo(
    () => ({ lang, t: dictionaries[lang], setLang }),
    [lang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
