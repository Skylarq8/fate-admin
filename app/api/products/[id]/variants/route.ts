// 📁 app/api/products/[id]/variants/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api-response"

type Ctx = { params: Promise<{ id: string }> }

// GET — бүх variant option авах
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const variants = await prisma.productVariantOption.findMany({
    where:   { productId: id },
    orderBy: { order: "asc" },
  })
  return ok(variants)
}

// POST — variant option нэмэх
// Body: { label: string, values: string[] }
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const { label, values } = await req.json()
    if (!label?.trim()) return fail("Label шаардлагатай.")
    if (!Array.isArray(values) || values.length === 0) return fail("Values шаардлагатай.")

    const count   = await prisma.productVariantOption.count({ where: { productId: id } })
    const variant = await prisma.productVariantOption.create({
      data: { productId: id, label: label.trim(), values, order: count },
    })
    return ok(variant)
  } catch (err) {
    console.error(err)
    return fail("Серверийн алдаа.", 500)
  }
}

// PUT — бүх variant-ыг нэг дор хадгалах (upsert)
// Body: { variants: { id?, label, values, order }[] }
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const { variants } = await req.json()

    // Бүгдийг устгаад дахин үүсгэнэ
    await prisma.productVariantOption.deleteMany({ where: { productId: id } })
    if (variants?.length > 0) {
      await prisma.productVariantOption.createMany({
        data: variants.map((v: any, i: number) => ({
          productId: id,
          label:     v.label,
          values:    v.values,
          order:     i,
        })),
      })
    }

    const updated = await prisma.productVariantOption.findMany({
      where:   { productId: id },
      orderBy: { order: "asc" },
    })
    return ok(updated)
  } catch (err) {
    console.error(err)
    return fail("Серверийн алдаа.", 500)
  }
}