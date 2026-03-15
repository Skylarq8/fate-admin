// app/api/test-cloudinary/route.ts
import { v2 as cloudinary } from "cloudinary";
import { ok } from "@/lib/api-response";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
  const result = await cloudinary.api.ping();
  return ok(result);
}