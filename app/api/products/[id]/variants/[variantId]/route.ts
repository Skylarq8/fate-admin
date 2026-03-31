// 📁 app/api/products/[id]/variants/[variantId]/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api-response"

type Ctx = { params: Promise<{ id: string; variantId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { variantId } = await params
    const { label, values } = await req.json()
    const variant = await prisma.productVariantOption.update({
      where: { id: variantId },
      data: {
        ...(label  ? { label: label.trim() } : {}),
        ...(values ? { values } : {}),
      },
    })
    return ok(variant)
  } catch (err) {
    console.error(err)
    return fail("Серверийн алдаа.", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { variantId } = await params
    await prisma.productVariantOption.delete({ where: { id: variantId } })
    return ok({ deleted: true })
  } catch (err) {
    console.error(err)
    return fail("Серверийн алдаа.", 500)
  }
}