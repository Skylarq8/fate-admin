// 📁 app/api/products/route.ts
// app/api/products/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { ok, fail } from "@/lib/api-response";

// ─── GET /api/products ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  // Хугацаа дууссан хямдралуудыг автоматаар унтраана
  await prisma.product.updateMany({
    where: {
      discountEnabled: true,
      discountEndsAt:  { lt: new Date() },
    },
    data: { discountEnabled: false },
  });

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status: status as "active" | "inactive" } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      categories: { include: { category: true } },
      variants: { orderBy: { order: "asc" } }, 
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(products);
}

// ─── POST /api/products ───────────────────────────────────────────────────────
// multipart/form-data
// images[]  → олон файл (эхний файл автоматаар primary болно)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title       = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const priceRaw    = formData.get("price") as string | null;

    if (!title || !description || !priceRaw)
      return fail("title, description, price шаардлагатай.");

    const price = parseFloat(priceRaw);
    if (isNaN(price)) return fail("price тоо байх ёстой.");

    const discountEnabled = formData.get("discountEnabled") === "true";
    const finalPriceRaw   = formData.get("finalPrice") as string | null;
    const discountEndsAt  = formData.get("discountEndsAt") as string | null;

    let finalPrice: number | undefined;
    if (discountEnabled) {
      if (!finalPriceRaw || !discountEndsAt)
        return fail("discountEnabled=true үед finalPrice болон discountEndsAt шаардлагатай.");
      finalPrice = parseFloat(finalPriceRaw);
      if (isNaN(finalPrice) || finalPrice >= price)
        return fail("finalPrice нь price-аас бага байх ёстой.");
    }

    const sizes       = JSON.parse((formData.get("sizes")      as string) || "[]");
    const colors      = JSON.parse((formData.get("colors")     as string) || "[]");
    const variantsRaw = formData.get("variants") as string | null
    const variants = variantsRaw ? JSON.parse(variantsRaw) : []
    const categoryIds = JSON.parse((formData.get("categories") as string) || "[]") as string[];

    // ── images upload ─────────────────────────────────────────────────────────
    const imageFiles = formData.getAll("images") as File[];
    if (!imageFiles.length) return fail("Дор хаяж 1 зураг оруулна уу.");

    const uploaded = await Promise.all(
      imageFiles.map(async (file, index) => {
        const buf    = await file.arrayBuffer();
        const base64 = `data:${file.type};base64,${Buffer.from(buf).toString("base64")}`;
        const { url, publicId } = await uploadImage(base64);
        return { url, publicId, isPrimary: index === 0, order: index };
      })
    );

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        finalPrice:     discountEnabled ? finalPrice : null,
        discountEnabled,
        discountEndsAt: discountEnabled && discountEndsAt ? new Date(discountEndsAt) : null,
        sizes,
        colors,
        status: "active",
        images:     { create: uploaded },
        categories: { create: categoryIds.map((id) => ({ categoryId: id })) },
        variants: {
          create: variants.map((v: any, index: number) => ({
            label: v.label,
            values: v.values,
            order: index
          }))
        }
      },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        categories: { include: { category: true } },
        variants: { orderBy: { order: "asc" } }, 
      },
    });

    return ok(product, 201);
  } catch (err) {
    console.error(err);
    return fail("Серверийн алдаа.", 500);
  }
}