// 📁 app/api/cron/cleanup-promos/route.ts
// GET /api/cron/cleanup-promos
// Хугацаа нь дууссан боловч ашиглагдаагүй promo code-уудыг устгана.
// Vercel Cron эсвэл гадаад cron service-ээр дуудагдана.
// Жишээ vercel.json: { "crons": [{ "path": "/api/cron/cleanup-promos", "schedule": "0 * * * *" }] }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.coupon.deleteMany({
      where: {
        sentToEmail: { not: null },   // promo mail-аар явуулсан
        usedCount: 0,                 // ашиглагдаагүй
        expiresAt: { lt: new Date() }, // хугацаа дууссан
      },
    });

    console.log(`[cleanup-promos] Устгасан promo code: ${result.count}`);
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (err) {
    console.error("[cleanup-promos] error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
