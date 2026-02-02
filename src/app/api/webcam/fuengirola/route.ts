import { NextResponse } from 'next/server';

export const revalidate = 600;

const FUENGIROLA = { lat: 36.539, lng: -4.624 };
const RADIUS_KM = 25;

type WindyWebcamV3 = {
  webcamId: number;
  title?: string;
  player?: {
    live?: string; // embed URL for iframe
    day?: string; // embed URL for iframe
  };
  urls?: {
    detail?: string;
  };
};

export async function GET() {
  const key = process.env.WINDY_WEBCAMS_API_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: 'missing_api_key' });

  const url =
    `https://api.windy.com/webcams/api/v3/webcams` +
    `?nearby=${FUENGIROLA.lat},${FUENGIROLA.lng},${RADIUS_KM}` +
    `&include=player,urls,location` +
    `&sortKey=popularity&sortDirection=desc&limit=50`;

  try {
    const res = await fetch(url, {
      headers: { 'X-WINDY-API-KEY': key },
      next: { revalidate },
    });

    if (!res.ok) throw new Error(`Windy API ${res.status}`);
    const data = (await res.json()) as {
      total?: number;
      webcams?: WindyWebcamV3[];
    };

    const webcams = data.webcams ?? [];

    // pick the first webcam that has a live or day embed URL
    const best =
      webcams.find((w) => w.player?.live) ??
      webcams.find((w) => w.player?.day) ??
      null;

    if (!best)
      return NextResponse.json({ ok: false, reason: 'no_webcam_found' });

    const embed = best.player?.live ?? best.player?.day ?? null;

    return NextResponse.json({
      ok: true,
      webcamId: best.webcamId,
      title: best.title ?? 'Fuengirola webcam',
      embed, // this is a URL for <iframe src="...">
      detailUrl: best.urls?.detail ?? null,
    });
  } catch {
    return NextResponse.json({ ok: false, reason: 'fetch_failed' });
  }
}
