// 📁 app/api/orders/route.ts
// app/api/orders/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

// ─── GET /api/orders ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending | confirmed | delivered

  const orders = await prisma.order.findMany({
    where: status ? { status: status as "pending" | "paid" | "processing" | "delivered" } : {},
    include: {
      items: {
        include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }] } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(orders);
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, phone, email, shippingAddress, items, couponCode } = body as {
      customerName: string;
      phone: string;
      email: string;
      shippingAddress: string;
      items: { productId: string; size?: string; color?: string; quantity: number; variants?: Record<string, string>; }[];
      couponCode?: string;
    };

    if (!customerName || !phone || !email || !shippingAddress) {
      return fail("Хэрэглэгчийн мэдээлэл бүрэн биш байна.");
    }
    if (!items?.length) return fail("Захиалгад дор хаяж 1 бараа байх ёстой.");

    // ── fetch products to calculate total ─────────────────────────────────────
    const productIds = items.map((i) => i.productId);
    const products   = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) return fail(`Бараа олдсонгүй: ${item.productId}`);
      const unitPrice = p.discountEnabled && p.finalPrice ? p.finalPrice : p.price;
      totalAmount += unitPrice * item.quantity;
    }

    // ── apply coupon ──────────────────────────────────────────────────────────
    if (couponCode) {
      const now    = new Date();
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, active: true, expiresAt: { gt: now } },
        include: { products: true },
      });
      if (!coupon) return fail("Coupon хүчингүй эсвэл хугацаа дууссан байна.");

      // check if coupon applies to ordered products
      const eligible = coupon.applyToAll
        ? true
        : items.some((i) => coupon.products.some((cp) => cp.productId === i.productId));

      if (!eligible) return fail("Энэ coupon сонгосон бараанд үйлчлэхгүй.");

      if (coupon.discountPercent) {
        totalAmount = totalAmount * (1 - coupon.discountPercent / 100);
      } else if (coupon.discountAmount) {
        totalAmount = Math.max(0, totalAmount - coupon.discountAmount);
      }
    }

    // ── create order ──────────────────────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        email,
        shippingAddress,
        totalAmount: Math.round(totalAmount),
        status: "pending",
        items: {
          create: items.map((item) => {
            const p         = productMap.get(item.productId)!;
            const unitPrice = p.discountEnabled && p.finalPrice ? p.finalPrice : p.price;
            return {
              productId: item.productId,
              size:      item.size,
              color:     item.color,
              quantity:  item.quantity,
              unitPrice,
              variants:  item.variants,
            };
          }),
        },
      },
      include: { items: { include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }] } } } } } },
    });

    return ok(order, 201);
  } catch (err) {
    console.error(err);
    return fail("Серверийн алдаа.", 500);
  }
}