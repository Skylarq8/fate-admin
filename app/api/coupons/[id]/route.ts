// 📁 app/api/coupons/[id]/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api-response"

type Ctx = { params: Promise<{ id: string }> }

const include = { products: { include: { product: true } } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const coupon = await prisma.coupon.findUnique({ where: { id }, include })
  if (!coupon) return fail("Coupon олдсонгүй.", 404)
  return ok(coupon)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await req.json()
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.active          !== undefined && { active:          body.active }),
        ...(body.expiresAt       !== undefined && { expiresAt:       new Date(body.expiresAt) }),
        ...(body.discountPercent !== undefined && { discountPercent: body.discountPercent }),
        ...(body.discountAmount  !== undefined && { discountAmount:  body.discountAmount }),
      },
      include,
    })
    return ok(coupon)
  } catch {
    return fail("Coupon олдсонгүй.", 404)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.coupon.delete({ where: { id } })
    return ok({ deleted: true })
  } catch {
    return fail("Coupon олдсонгүй.", 404)
  }
}