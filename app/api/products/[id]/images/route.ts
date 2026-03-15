// 📁 app/api/products/[id]/images/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { ok, fail } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
  })
  return ok(images)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return fail("Бараа олдсонгүй.", 404)

    const formData   = await req.formData()
    const imageFiles = formData.getAll("images") as File[]
    if (!imageFiles.length) return fail("Зураг оруулна уу.")

    const lastImage = await prisma.productImage.findFirst({
      where: { productId: id }, orderBy: { order: "desc" },
    })
    const startOrder = (lastImage?.order ?? -1) + 1
    const hasPrimary = await prisma.productImage.findFirst({
      where: { productId: id, isPrimary: true },
    })

    const uploaded = await Promise.all(
      imageFiles.map(async (file, index) => {
        const buf    = await file.arrayBuffer()
        const base64 = `data:${file.type};base64,${Buffer.from(buf).toString("base64")}`
        const { url, publicId } = await uploadImage(base64)
        return { url, publicId, productId: id, isPrimary: !hasPrimary && index === 0, order: startOrder + index }
      })
    )
    const images = await prisma.productImage.createMany({ data: uploaded })
    return ok(images, 201)
  } catch (err) {
    console.error(err)
    return fail("Серверийн алдаа.", 500)
  }
}