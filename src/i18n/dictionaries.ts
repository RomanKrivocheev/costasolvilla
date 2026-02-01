export const dictionaries = {
  es: {
    brand: 'CostaSolVilla',
    navHome: 'Inicio',
    navOverview: 'Resumen',
    navMap: 'Mapa',
    navAvailability: 'Disponibilidad',
    navUsefulInfo: 'Información útil',
    navPrices: 'Precios',
    navContact: 'Contacto',
    navGallery: 'Galería',
    ctaBookNow: 'Reserva ahora',
    footerPrivacy: 'Política de privacidad',
    footerCookies: 'Política de cookies',

    homeTitle1: 'Bienvenido a CostaSolVilla',
    homeText1:
      'Experimenta la combinación perfecta de confort y lujo en nuestra exclusiva villa frente al mar.',
    homeTitle2: 'Tus vacaciones de ensueño te esperan',
    homeText2:
      'Disfruta de vistas impresionantes, playas vírgenes y momentos inolvidables en nuestro paraíso vacacional cuidadosamente seleccionado.',

    labelTheme: 'Tema',
    labelLanguage: 'Idioma',
    homeVideoTitle: 'Video',
    homeVideoDisclaimer:
      'Clicking play loads content from YouTube (may set cookies).',
    homeVideoPlayAria: 'Play video',
    mapTitle: 'Ubicación',
    mapAddress: 'Calle Azalea, 10, 29640 Fuengirola, Málaga',
    mapDescription:
      'La forma más fácil de llegar a la villa es en coche. Hay aparcamiento gratuito cerca. Configura tu GPS en Calle Azalea 10, Fuengirola.',
    mapTransportTitle: 'Cercanías',

    mapAirportLabel: 'Aeropuerto',
    mapBusLabel: 'Autobús',
    mapHighwayLabel: 'Autopista',
    mapTrainLabel: 'Tren',

    mapAirportDistance: '22 km',
    mapBusDistance: '0.4 km',
    mapHighwayDistance: '2.8 km',
    mapTrainDistance: '1.9 km',

    mapMapTitle: 'Mapa',
    mapMapConsentLine:
      'Haz clic para cargar Google Maps (puede establecer cookies).',
    mapMapLoadButton: 'Cargar mapa',
    mapMapOpenInGoogle: 'Abrir en Google Maps',
  },
  en: {
    brand: 'CostaSolVilla',
    navHome: 'Home',
    navOverview: 'Overview',
    navMap: 'Map',
    navAvailability: 'Availability',
    navUsefulInfo: 'Useful information',
    navPrices: 'Prices',
    navContact: 'Contact',
    navGallery: 'Gallery',
    ctaBookNow: 'Book now',
    footerPrivacy: 'Privacy Policy',
    footerCookies: 'Cookie Policy',

    homeTitle1: 'Welcome to CostaSolVilla',
    homeText1:
      'Experience the perfect blend of comfort and luxury in our exclusive beachfront villa.',
    homeTitle2: 'Your Dream Vacation Awaits',
    homeText2:
      'Enjoy breathtaking views, pristine beaches, and unforgettable moments in our carefully curated holiday paradise.',
    labelTheme: 'Theme',
    labelLanguage: 'Language',
    homeVideoTitle: 'Video',
    homeVideoDisclaimer:
      'Clicking play loads content from YouTube (may set cookies).',
    homeVideoPlayAria: 'Play video',

    mapTitle: 'Location',
    mapAddress: 'Calle Azalea, 10, 29640 Fuengirola, Málaga',
    mapDescription:
      'The easiest way to reach the villa is by car. Free parking is available nearby. Set your GPS to Calle Azalea 10, Fuengirola.',
    mapTransportTitle: 'Nearby',

    mapAirportLabel: 'Airport',
    mapBusLabel: 'Bus',
    mapHighwayLabel: 'Highway',
    mapTrainLabel: 'Train',

    mapAirportDistance: '22 km',
    mapBusDistance: '0.4 km',
    mapHighwayDistance: '2.8 km',
    mapTrainDistance: '1.9 km',

    mapMapTitle: 'Map',
    mapMapConsentLine: 'Click to load Google Maps (may set cookies).',
    mapMapLoadButton: 'Load map',
    mapMapOpenInGoogle: 'Open in Google Maps',
  },
  ru: {
    brand: 'CostaSolVilla',
    navHome: 'Главная',
    navOverview: 'Обзор',
    footerPrivacy: 'Политика конфиденциальности',
    footerCookies: 'Политика использования файлов cookie',
    homeTitle1: 'Добро пожаловать в CostaSolVilla',
    homeText1:
      'Испытайте идеальное сочетание комфорта и роскоши в нашей эксклюзивной вилле на берегу моря.',
    homeTitle2: 'Ваш отпуск мечты ждет вас',
    homeText2:
      'Наслаждайтесь захватывающими видами, нетронутыми пляжами и незабываемыми моментами в нашем тщательно подобранном курортном раю.',

    navMap: 'Карта',
    navAvailability: 'Доступность',
    navUsefulInfo: 'Полезная информация',
    navPrices: 'Цены',
    navContact: 'Контакты',
    navGallery: 'Галерея',
    ctaBookNow: 'Забронировать',

    labelTheme: 'Тема',
    labelLanguage: 'Язык',

    homeVideoTitle: 'Видео',
    homeVideoDisclaimer:
      'Нажатие кнопки воспроизведения загружает контент с YouTube (может устанавливать файлы cookie).',
    homeVideoPlayAria: 'Воспроизвести видео',

    mapTitle: 'Расположение',
    mapAddress: 'Calle Azalea, 10, 29640 Fuengirola, Málaga',
    mapDescription:
      'Самый простой способ добраться до виллы - на машине. Рядом есть бесплатная парковка. Установите GPS на Calle Azalea 10, Fuengirola.',
    mapTransportTitle: 'Рядом',

    mapAirportLabel: 'Аэропорт',
    mapBusLabel: 'Автобус',
    mapHighwayLabel: 'Автострада',
    mapTrainLabel: 'Поезд',

    mapAirportDistance: '22 км',
    mapBusDistance: '0.4 км',
    mapHighwayDistance: '2.8 км',
    mapTrainDistance: '1.9 км',

    mapMapTitle: 'Карта',
    mapMapConsentLine:
      'Нажмите, чтобы загрузить Google Maps (может устанавливать файлы cookie).',
    mapMapLoadButton: 'Загрузить карту',
    mapMapOpenInGoogle: 'Открыть в Google Maps',
  },
} as const;

export type Lang = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)[Lang];
