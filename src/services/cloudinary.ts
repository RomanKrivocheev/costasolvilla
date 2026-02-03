import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export type CloudinaryImage = {
  publicId: string;
  width: number;
  height: number;
  createdAt: string;
};

export const listImagesInFolder = async (
  folder: string,
  maxResults = 100,
): Promise<CloudinaryImage[]> => {
  const result = await cloudinary.search
    .expression(`folder:${folder} AND resource_type:image`)
    .sort_by('public_id', 'asc')
    .max_results(maxResults)
    .execute();

  return result.resources.map(
    (r: {
      public_id: string;
      width: number;
      height: number;
      created_at: string;
    }) => ({
      publicId: r.public_id,
      width: r.width,
      height: r.height,
      createdAt: r.created_at,
    }),
  );
};

export const listImagesInFolders = async (
  folders: string[],
  maxResults = 500,
): Promise<Record<string, CloudinaryImage[]>> => {
  if (!folders.length) return {};

  const expression =
    `(${folders.map((f) => `folder:\"${f}\"`).join(' OR ')})` +
    ` AND resource_type:image`;

  const result = await cloudinary.search
    .expression(expression)
    .sort_by('public_id', 'asc')
    .max_results(maxResults)
    .execute();

  const grouped: Record<string, CloudinaryImage[]> = {};

  for (const f of folders) grouped[f] = [];

  for (const r of result.resources as Array<{
    public_id: string;
    width: number;
    height: number;
    created_at: string;
  }>) {
    const match = folders.find((f) => r.public_id.startsWith(`${f}/`));
    const folder = match ?? r.public_id.split('/').slice(0, -1).join('/');
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push({
      publicId: r.public_id,
      width: r.width,
      height: r.height,
      createdAt: r.created_at,
    });
  }

  return grouped;
};
