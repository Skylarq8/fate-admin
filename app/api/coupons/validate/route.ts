// 📁 app/api/coupons/validate/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

/**
 * POST /api/coupons/validate
 * Body: { code: string, cartTotal: number, productIds?: string[] }
 * Returns: coupon info + calculated discount amount
 */
export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal, productIds } = await req.json() as {
      code: string;
      cartTotal: number;
      productIds?: string[];
    };

    if (!code) return fail("code шаардлагатай.");
    if (typeof cartTotal !== "number" || cartTotal < 0) {
      return fail("cartTotal буруу байна.");
    }

    const couponCode = code.toUpperCase()
    
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
      include: { products: true },
    });
    
    if (!coupon) return fail("Coupon олдсонгүй.", 422);
    if (!coupon.active) return fail("Coupon идэвхгүй байна.", 422);

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return fail("Coupon хугацаа дууссан.", 422);
    }

    // Check product eligibility
    if (!coupon.applyToAll && productIds && productIds.length > 0) {
      const couponProductIds = coupon.products.map((cp) => cp.productId)
      const hasMatch = productIds.some((pid) => couponProductIds.includes(pid))
      if (!hasMatch) return fail("Энэ coupon сонгосон бараанд үйлчлэхгүй.", 422)
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return fail("Coupon ашигдсан хязгаарт хүрсэн байна.", 422);
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = cartTotal * (coupon.discountValue / 100);
    } else {
      discountAmount = Math.min(coupon.discountValue, cartTotal);
    }

    return ok({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount),
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      applyToAll: coupon.applyToAll,
      products: coupon.products.map(p => p.productId),
    });
  } catch (err) {
    console.error(err);
    return fail("Серверийн алдаа.", 500);
  }
}