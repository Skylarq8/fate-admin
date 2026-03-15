// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});
 
/**
 * Upload a file buffer / base64 string to Cloudinary.
 * Returns { url, publicId }
 */
export async function uploadImage(
  source: string,           // base64 data-URI or remote URL
  folder = "ecommerce"
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(source, {
    folder,
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}
 
/** Delete an image from Cloudinary by its public_id */
export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}