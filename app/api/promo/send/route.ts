// 📁 app/api/promo/send/route.ts
// POST /api/promo/send
// Хэрэглэгчийн имэйл рүү нэг удаа ашиглах, 24 цаг хүчинтэй promo code үүсгэж илгээнэ.
//
// Body: { email, discountValue, discountType }
// Хязгаарлалт:
//   - Нэг имэйл дээр нэгээс илүү идэвхтэй promo code байж болохгүй
//   - usageLimit: 1 (нэг л удаа ашиглана)
//   - expiresAt: now + 24 цаг

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";
import { resend, buildPromoEmailHtml } from "@/lib/resend";

const FROM_EMAIL = process.env.PROMO_FROM_EMAIL || "noreply@yourdomain.com";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ambiguous char-уудыг хасав (0,O,I,1)
  let code = "FATE-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, discountValue, discountType } = body as {
      email: string;
      discountValue: number;
      discountType: "percentage" | "fixed";
    };

    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail("Зөв имэйл хаяг оруулна уу.");
    }
    if (!discountValue || discountValue <= 0) {
      return fail("discountValue 0-с их байх ёстой.");
    }
    if (!["percentage", "fixed"].includes(discountType)) {
      return fail("discountType нь 'percentage' эсвэл 'fixed' байх ёстой.");
    }
    if (discountType === "percentage" && discountValue > 100) {
      return fail("Хувийн хөнгөлөлт 100-с хэтрэхгүй байх ёстой.");
    }

    // ── Давхардал шалгах: энэ имэйлд идэвхтэй promo code байгаа эсэх ─────────
    const existing = await prisma.coupon.findFirst({
      where: {
        sentToEmail: email.toLowerCase(),
        usedCount: 0,           // ашиглагдаагүй
        expiresAt: { gt: new Date() }, // хугацаа дуусаагүй
      },
    });

    if (existing) {
      return fail(
        `Энэ имэйл хаяг дээр аль хэдийн идэвхтэй промо код байна (${existing.code}). Дуусах хугацаа: ${existing.expiresAt?.toISOString()}.`,
        409
      );
    }

    // ── Unique code үүсгэх ────────────────────────────────────────────────────
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.coupon.findUnique({ where: { code } });
      if (!exists) break;
      code = generateCode();
      attempts++;
    }

    // ── Coupon үүсгэх ─────────────────────────────────────────────────────────
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 цаг

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        usageLimit: 1,
        usedCount: 0,
        expiresAt,
        applyToAll: true,
        active: true,
        sentToEmail: email.toLowerCase(),
      },
    });

    // ── Email илгээх ──────────────────────────────────────────────────────────
    const html = buildPromoEmailHtml({
      code,
      discountValue,
      discountType,
      expiresAt,
    });

    const { error: mailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Таны хувийн ${discountType === "percentage" ? discountValue + "%" : discountValue.toLocaleString() + "₮"} хөнгөлөлтийн код`,
      html,
    });

    if (mailError) {
      // Mail алдаатай бол coupon-г буцааж устгана
      await prisma.coupon.delete({ where: { id: coupon.id } });
      console.error("[promo/send] Resend error:", mailError);
      return fail("Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.", 500);
    }

    console.log(`[promo/send] Promo code ${code} → ${email}`);
    return ok({ message: "Промо код амжилттай илгээлээ.", expiresAt });
  } catch (err) {
    console.error("[promo/send] error:", err);
    return fail(String(err), 500);
  }
}
