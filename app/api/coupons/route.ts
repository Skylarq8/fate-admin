// 📁 app/api/coupons/route.ts
// app/api/coupons/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

// ─── GET /api/coupons ─────────────────────────────────────────────────────────
export async function GET() {
  // auto-deactivate expired coupons
  await prisma.coupon.updateMany({
    where: { active: true, expiresAt: { lt: new Date() } },
    data:  { active: false },
  });

  const coupons = await prisma.coupon.findMany({
    include: { products: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(coupons);
}

// ─── POST /api/coupons ────────────────────────────────────────────────────────
/*
  Body (JSON):
  {
    code: string
    discountPercent?: number   // mutually exclusive with discountAmount
    discountAmount?: number
    expiresAt: string          // ISO date
    applyToAll: boolean
    products?: string[]        // required if applyToAll = false
  }
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      discountPercent,
      discountAmount,
      expiresAt,
      applyToAll,
      products,
    } = body as {
      code: string;
      discountPercent?: number;
      discountAmount?: number;
      expiresAt: string;
      applyToAll: boolean;
      products?: string[];
    };

    if (!code?.trim())  return fail("code шаардлагатай.");
    if (!expiresAt)     return fail("expiresAt шаардлагатай.");

    if (!discountPercent && !discountAmount) {
      return fail("discountPercent эсвэл discountAmount аль нэгийг оруулах ёстой.");
    }
    if (discountPercent && discountAmount) {
      return fail("discountPercent болон discountAmount хоёрыг зэрэг ашиглах боломжгүй.");
    }
    if (!applyToAll && (!products || products.length === 0)) {
      return fail("applyToAll=false үед products массив шаардлагатай.");
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) return fail("Ийм coupon код аль хэдийн байна.");

    const coupon = await prisma.coupon.create({
      data: {
        code:            code.trim().toUpperCase(),
        discountPercent: discountPercent ?? null,
        discountAmount:  discountAmount  ?? null,
        expiresAt:       new Date(expiresAt),
        applyToAll:      applyToAll ?? false,
        active:          true,
        products: !applyToAll && products
          ? { create: products.map((pid) => ({ productId: pid })) }
          : undefined,
      },
      include: { products: { include: { product: true } } },
    });

    return ok(coupon, 201);
  } catch (err) {
    console.error(err);
    return fail("Серверийн алдаа.", 500);
  }
}