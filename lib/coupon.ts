// 📁 lib/coupon.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
  };
  discountAmount?: number;
  message?: string;
}

export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<ValidateCouponResult> {
  if (!code || typeof cartTotal !== "number" || cartTotal < 0) {
    return { valid: false, message: "Invalid input" };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon) {
    return { valid: false, message: "Coupon олдсонгүй" };
  }
  if (!coupon.active) {
    return { valid: false, message: "Coupon идэвхгүй байна" };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, message: "Coupon хугацаа дууссан" };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: "Coupon ашигдсан хязгаарт хүрсэн" };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = cartTotal * (coupon.discountValue / 100);
  } else {
    discountAmount = Math.min(coupon.discountValue, cartTotal);
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
    discountAmount: Math.round(discountAmount),
  };
}

export async function processCouponWithTransaction(
  orderId: string,
  couponCode: string | null
): Promise<{ success: boolean; message: string }> {
  if (!couponCode) {
    return { success: true, message: "Coupon байхгүй" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        throw new Error("Coupon олдсонгүй");
      }

      if (!coupon.active) {
        throw new Error("Coupon идэвхгүй байна");
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new Error("Coupon хугацаа дууссан");
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new Error("Coupon ашигдсан хязгаарт хүрсэн");
      }

      const updated = await tx.coupon.update({
        where: { code: couponCode },
        data: { usedCount: { increment: 1 } },
      });

      // Promo code (sentToEmail-тэй, usageLimit: 1) ашиглагдсан тохиолдолд устгана
      const reachedLimit =
        updated.usageLimit !== null &&
        updated.usedCount >= updated.usageLimit;

      if (reachedLimit && updated.sentToEmail) {
        await tx.coupon.delete({ where: { id: updated.id } });
      }
    });

    return { success: true, message: "Coupon ашигдсан" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Алдаа гарлаа";
    console.error("[processCouponWithTransaction] error:", message);
    return { success: false, message };
  }
}

export async function processCouponOnOrderPayment(
  orderId: string,
  couponCode: string | null
): Promise<{ success: boolean; message: string }> {
  return processCouponWithTransaction(orderId, couponCode);
}