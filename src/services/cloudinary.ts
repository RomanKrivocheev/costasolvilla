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
