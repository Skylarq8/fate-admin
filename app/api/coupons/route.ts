// 📁 app/api/coupons/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

// ─── GET /api/coupons ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { products: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(coupons);
  } catch (err) {
    console.error("[coupons] GET error:", err);
    return fail(String(err), 500);
  }
}

// ─── POST /api/coupons ────────────────────────────────────────────────────────
/*
  Body (JSON):
  {
    code: string
    discountType: "percentage" | "fixed"
    discountValue: number
    usageLimit?: number | null (null = unlimited)
    expiresAt?: string (ISO date, optional)
    applyToAll?: boolean (default true)
    products?: string[] (product IDs if applyToAll = false)
  }
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      usageLimit,
      expiresAt,
      applyToAll,
      products,
    } = body as {
      code: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      usageLimit?: number | null;
      expiresAt?: string;
      applyToAll?: boolean;
      products?: string[];
    };

    if (!code?.trim()) return fail("code шаардлагатай.");
    if (!discountType || !["percentage", "fixed"].includes(discountType)) {
      return fail("discountType нь 'percentage' эсвэл 'fixed' байх ёстой.");
    }
    if (typeof discountValue !== "number" || discountValue <= 0) {
      return fail("discountValue нь эерэг тоо байх ёстой.");
    }
    if (discountType === "percentage" && discountValue > 100) {
      return fail("percentage Discount 100-гаас их байж болохгүй.");
    }
    if (usageLimit !== null && (typeof usageLimit !== "number" || usageLimit < 1)) {
      return fail("usageLimit нь null эсвэл 1-ээс их тоо байх ёстой.");
    }
    if (applyToAll === false && (!products || products.length === 0)) {
      return fail("applyToAll=false үед products массив шаардлагатай.");
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return fail("Ийм coupon код аль хэдийн байна.");

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue,
        usageLimit,
        usedCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        applyToAll: applyToAll ?? true,
        active: true,
        products: !applyToAll && products
          ? { create: products.map((pid: string) => ({ productId: pid })) }
          : undefined,
      },
    });

    return ok(coupon, 201);
  } catch (err) {
    console.error("[coupons] POST error:", err);
    return fail(String(err), 500);
  }
}