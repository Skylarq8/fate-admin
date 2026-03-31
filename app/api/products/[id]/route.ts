// 📁 app/api/products/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";
import { ok, fail } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images:     { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      categories: { include: { category: true } },
      variants:   { orderBy: { order: "asc" } },
    },
  })
  if (!product) return fail("Бараа олдсонгүй.", 404)
  return ok(product)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return fail("Бараа олдсонгүй.", 404)

    const formData    = await req.formData()
    const title       = (formData.get("title")       as string | null) ?? undefined
    const description = (formData.get("description") as string | null) ?? undefined
    const priceRaw    = formData.get("price")   as string | null
    const statusRaw   = formData.get("status")  as string | null
    const sizes       = formData.get("sizes")   ? JSON.parse(formData.get("sizes")   as string) : undefined
    const colors      = formData.get("colors")  ? JSON.parse(formData.get("colors")  as string) : undefined
    const categoryIds = formData.get("categories") ? JSON.parse(formData.get("categories") as string) as string[] : null
    const price       = priceRaw ? parseFloat(priceRaw) : undefined

    const discountEnabledRaw = formData.get("discountEnabled") as string | null
    const discountEnabled    = discountEnabledRaw !== null ? discountEnabledRaw === "true" : undefined
    const finalPriceRaw      = formData.get("finalPrice")     as string | null
    const discountEndsAtRaw  = formData.get("discountEndsAt") as string | null

    let finalPrice:     number | null | undefined = undefined
    let discountEndsAt: Date   | null | undefined = undefined
    if (discountEnabled === true) {
      finalPrice     = finalPriceRaw ? parseFloat(finalPriceRaw) : null
      discountEndsAt = discountEndsAtRaw ? new Date(discountEndsAtRaw) : null
    } else if (discountEnabled === false) {
      finalPrice = null; discountEndsAt = null
    }

    if (categoryIds) {
      await prisma.productCategory.deleteMany({ where: { productId: id } })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(title           !== undefined && { title }),
        ...(description     !== undefined && { description }),
        ...(price           !== undefined && { price }),
        ...(statusRaw       !== null      && { status: statusRaw as "active" | "inactive" }),
        ...(sizes           !== undefined && { sizes }),
        ...(colors          !== undefined && { colors }),
        ...(discountEnabled !== undefined && { discountEnabled }),
        ...(finalPrice      !== undefined && { finalPrice }),
        ...(discountEndsAt  !== undefined && { discountEndsAt }),
        ...(categoryIds && {
          categories: { create: categoryIds.map((cid) => ({ categoryId: cid })) },
        }),
      },
      include: {
        images:     { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        categories: { include: { category: true } },
        variants:   { orderBy: { order: "asc" } },
      },
    })
    return ok(product)
  } catch (err) {
    console.error(err)
    return fail("Серверийн алдаа.", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    })
    if (!product) return fail("Бараа олдсонгүй.", 404)

    // Cloudinary зурагнуудыг устга (алдаа гарсан ч үргэлжлүүл)
    await Promise.allSettled(product.images.map(img => deleteImage(img.publicId)))

    // Related records устга (foreign key order)
    await prisma.orderItem.deleteMany({ where: { productId: id } })
    await prisma.productCategory.deleteMany({ where: { productId: id } })
    await prisma.productImage.deleteMany({ where: { productId: id } })
    await prisma.product.delete({ where: { id } })

    return ok({ deleted: true })
  } catch (err: any) {
    console.error("[products/id] DELETE error:", err)
    return fail(err?.message ?? "Серверийн алдаа.", 500)
  }
}