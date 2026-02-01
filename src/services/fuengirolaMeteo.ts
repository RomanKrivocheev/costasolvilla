export type FuengirolaSnapshot = {
  temperatureC: number;
  weatherCode: number;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
};

const FUENGIROLA = {
  lat: 36.544148,
  lon: -4.624944,
  timezone: 'Europe/Madrid',
} as const;

export const fetchFuengirolaSnapshot =
  async (): Promise<FuengirolaSnapshot> => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${FUENGIROLA.lat}` +
      `&longitude=${FUENGIROLA.lon}` +
      `&current=temperature_2m,weather_code` +
      `&timezone=${encodeURIComponent(FUENGIROLA.timezone)}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Open-Meteo failed: ${res.status}`);
    }

    const data = (await res.json()) as OpenMeteoResponse;

    const temp = data.current?.temperature_2m;
    const code = data.current?.weather_code;

    if (typeof temp !== 'number' || typeof code !== 'number') {
      throw new Error('Open-Meteo response missing current fields');
    }

    return {
      temperatureC: temp,
      weatherCode: code,
    };
  };
