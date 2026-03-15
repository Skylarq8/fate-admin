// 📁 app/api/coupons/validate/route.ts
// app/api/coupons/validate/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

/**
 * POST /api/coupons/validate
 * Body: { code: string, productIds: string[] }
 * Returns: coupon info + calculated discount amount
 */
export async function POST(req: NextRequest) {
  try {
    const { code, productIds } = await req.json() as {
      code: string;
      productIds: string[];
    };

    if (!code) return fail("code шаардлагатай.");

    const now    = new Date();
    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), active: true, expiresAt: { gt: now } },
      include: { products: true },
    });

    if (!coupon) return fail("Coupon хүчингүй эсвэл хугацаа дууссан.", 422);

    // eligibility check
    if (!coupon.applyToAll) {
      const couponProductIds = coupon.products.map((cp) => cp.productId);
      const hasMatch = productIds.some((pid) => couponProductIds.includes(pid));
      if (!hasMatch) return fail("Энэ coupon сонгосон бараанд үйлчлэхгүй.", 422);
    }

    return ok({
      id:              coupon.id,
      code:            coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount:  coupon.discountAmount,
      applyToAll:      coupon.applyToAll,
      expiresAt:       coupon.expiresAt,
    });
  } catch (err) {
    console.error(err);
    return fail("Серверийн алдаа.", 500);
  }
}