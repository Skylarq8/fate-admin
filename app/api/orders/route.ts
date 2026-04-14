// 📁 app/api/orders/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";
import { validateCoupon } from "@/lib/coupon";

// ─── GET /api/orders ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    console.log("[orders] GET: status =", status);

    const orders = await prisma.order.findMany({
      where: status ? { status: status as "pending" | "paid" | "processing" | "delivered" } : {},
      include: {
        items: {
          include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }] } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[orders] GET: found", orders.length, "orders");
    return ok(orders);
  } catch (err) {
    console.error("[orders] GET error:", err);
    return fail(String(err), 500);
  }
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

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) return fail(`Бараа олдсонгүй: ${item.productId}`);
      const unitPrice = p.discountEnabled && p.finalPrice ? p.finalPrice : p.price;
      totalAmount += unitPrice * item.quantity;
    }

    let validatedCoupon: ValidateCouponResult["coupon"] | undefined;
    let finalDiscount = 0;

    if (couponCode) {
      const validation = await validateCoupon(couponCode, totalAmount);
      if (!validation.valid) {
        return fail(validation.message || "Coupon хүчингүй", 422);
      }
      validatedCoupon = validation.coupon;
      finalDiscount = validation.discountAmount || 0;
      totalAmount = Math.max(0, totalAmount - finalDiscount);
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        email,
        shippingAddress,
        totalAmount: Math.round(totalAmount),
        status: "pending",
        couponCode: couponCode ? couponCode.toUpperCase() : null,
        items: {
          create: items.map((item) => {
            const p = productMap.get(item.productId)!;
            const unitPrice = p.discountEnabled && p.finalPrice ? p.finalPrice : p.price;
            return {
              productId: item.productId,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              unitPrice,
              variants: item.variants,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: [{ isPrimary: "desc" }] } }
            }
          }
        },
      },
    });

    return ok({
      ...order,
      validatedCoupon: validatedCoupon
        ? { ...validatedCoupon, discountApplied: finalDiscount }
        : null,
    }, 201);
  } catch (err) {
    console.error("[orders] POST error:", err);
    return fail(String(err), 500);
  }
}

type ValidateCouponResult = Awaited<ReturnType<typeof validateCoupon>>;