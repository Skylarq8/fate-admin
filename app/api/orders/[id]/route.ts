// 📁 app/api/orders/[id]/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api-response"
import { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> }

const include = {
  items: {
    include: {
      product: {
        include: { images: { orderBy: [{ isPrimary: "desc" as const }] } }
      }
    }
  }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, include })
  if (!order) return fail("Захиалга олдсонгүй.", 404)
  return ok(order)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await req.json() as {
      status?: string
      customerName?: string
      phone?: string
      email?: string
      shippingAddress?: string
      items?: { productId: string; quantity: number; size?: string; color?: string; variants?: Record<string,string> }[]
    }

    const allowed = ["pending", "paid", "processing", "delivered"]
    if (body.status && !allowed.includes(body.status))
      return fail(`status нь дараах утгуудын нэг байх ёстой: ${allowed.join(", ")}`)

    // if items provided — recalculate totalAmount and recreate items
    if (body.items) {
      const productIds = body.items.map(i => i.productId)
      const products   = await prisma.product.findMany({ where: { id: { in: productIds } } })
      const productMap = new Map(products.map(p => [p.id, p]))

      let totalAmount = 0
      for (const item of body.items) {
        const p = productMap.get(item.productId)
        if (!p) return fail(`Бараа олдсонгүй: ${item.productId}`)
        const unitPrice = p.discountEnabled && p.finalPrice ? p.finalPrice : p.price
        totalAmount += unitPrice * item.quantity
      }

      // delete old items and recreate
      await prisma.orderItem.deleteMany({ where: { orderId: id } })

      const order = await prisma.order.update({
        where: { id },
        data: {
          ...(body.customerName    && { customerName:    body.customerName }),
          ...(body.phone           && { phone:           body.phone }),
          ...(body.email           && { email:           body.email }),
          ...(body.shippingAddress && { shippingAddress: body.shippingAddress }),
          ...(body.status          && { status:          body.status as "pending" | "paid" | "processing" | "delivered" }),
          totalAmount: Math.round(totalAmount),
          items: {
            create: body.items.map(item => {
              const p         = productMap.get(item.productId)!
              const unitPrice = p.discountEnabled && p.finalPrice ? p.finalPrice : p.price
              return {
                productId: item.productId,
                quantity:  item.quantity,
                size:      item.size  ?? null,
                color:     item.color ?? null,
                unitPrice,
                variants: item.variants ? item.variants : Prisma.JsonNull,
              }
            }),
          },
        },
        include,
      })
      return ok(order)
    }

    // status-only update
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.customerName    && { customerName:    body.customerName }),
        ...(body.phone           && { phone:           body.phone }),
        ...(body.email           && { email:           body.email }),
        ...(body.shippingAddress && { shippingAddress: body.shippingAddress }),
        ...(body.status          && { status:          body.status as "pending" | "paid" | "processing" | "delivered" }),
      },
      include,
    })
    return ok(order)
  } catch (err) {
    console.error("[orders/id] PATCH error:", err)
    return fail("Серверийн алдаа.", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.orderItem.deleteMany({ where: { orderId: id } })
    await prisma.order.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (err) {
    console.error("[orders/id] DELETE error:", err)
    return fail("Захиалга олдсонгүй.", 404)
  }
}