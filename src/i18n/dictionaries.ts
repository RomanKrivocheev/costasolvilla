export const dictionaries = {
  es: {
    brand: 'CostaSolVilla',
    navHome: 'Inicio',
    navPrices: 'Precios',
    navContact: 'Contacto',
    navGallery: 'Galería',
    ctaBookNow: 'Reserva ahora',

    labelTheme: 'Tema',
    labelLanguage: 'Idioma',
    themeLightMode: 'Modo claro',
    themeDarkMode: 'Modo oscuro',
  },
  en: {
    brand: 'CostaSolVilla',
    navHome: 'Home',
    navPrices: 'Prices',
    navContact: 'Contact',
    navGallery: 'Gallery',
    ctaBookNow: 'Book now',

    labelTheme: 'Theme',
    labelLanguage: 'Language',
    themeLightMode: 'Light mode',
    themeDarkMode: 'Dark mode',
  },
  ru: {
    brand: 'CostaSolVilla',
    navHome: 'Главная',
    navPrices: 'Цены',
    navContact: 'Контакты',
    navGallery: 'Галерея',
    ctaBookNow: 'Забронировать',

    labelTheme: 'Тема',
    labelLanguage: 'Язык',
    themeLightMode: 'Светлая тема',
    themeDarkMode: 'Тёмная тема',
  },
} as const;

export type Lang = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)[Lang];
