import { NextResponse } from 'next/server';
import { listImagesInFolder } from '@/services/cloudinary';

export const runtime = 'nodejs';

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder');

  if (!folder) {
    return NextResponse.json({ error: 'Missing folder' }, { status: 400 });
  }

  const images = await listImagesInFolder(folder);
  return NextResponse.json(images);
};
