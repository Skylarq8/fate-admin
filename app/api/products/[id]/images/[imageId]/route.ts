// 📁 app/api/products/[id]/images/[imageId]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/cloudinary";
import { ok, fail } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string; imageId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id, imageId } = await params
    const body = await req.json() as { isPrimary?: boolean; order?: number }
    if (body.isPrimary === true) {
      await prisma.productImage.updateMany({
        where: { productId: id }, data: { isPrimary: false },
      })
    }
    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: {
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
        ...(body.order     !== undefined && { order: body.order }),
      },
    })
    return ok(image)
  } catch {
    return fail("Зураг олдсонгүй.", 404)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id, imageId } = await params
    const image = await prisma.productImage.findUnique({ where: { id: imageId } })
    if (!image) return fail("Зураг олдсонгүй.", 404)
    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: id, id: { not: imageId } }, orderBy: { order: "asc" },
      })
      if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
    }
    await deleteImage(image.publicId)
    await prisma.productImage.delete({ where: { id: imageId } })
    return ok({ deleted: true })
  } catch (err) {
    console.error(err)
    return fail("Серверийн алдаа.", 500)
  }
}