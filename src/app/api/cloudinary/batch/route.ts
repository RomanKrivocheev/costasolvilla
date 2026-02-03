import { NextResponse } from 'next/server';
import { listImagesInFolders } from '@/services/cloudinary';

export const runtime = 'nodejs';
export const revalidate = 600;

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const foldersParam = searchParams.get('folders');

  if (!foldersParam) {
    return NextResponse.json({ error: 'Missing folders' }, { status: 400 });
  }

  const folders = foldersParam
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  if (!folders.length) {
    return NextResponse.json({ error: 'Missing folders' }, { status: 400 });
  }

  const images = await listImagesInFolders(folders);

  return NextResponse.json(images, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  });
};
