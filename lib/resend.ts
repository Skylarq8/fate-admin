// 📁 lib/resend.ts
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Promo mail-ийн HTML template
export function buildPromoEmailHtml(opts: {
  code: string;
  discountValue: number;
  discountType: "percentage" | "fixed";
  expiresAt: Date;
}): string {
  const discount =
    opts.discountType === "percentage"
      ? `${opts.discountValue}%`
      : `${opts.discountValue.toLocaleString()}₮`;

  const expiresStr = opts.expiresAt.toLocaleString("mn-MN", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Таны промо код</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#111;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px;font-weight:700;">FATE</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#111;">Таны хувийн промо код бэлэн боллоо!</h2>
              <p style="margin:0 0 28px;color:#555;font-size:15px;line-height:1.6;">
                Доорх кодыг захиалгаа баталгаажуулахдаа ашиглан <strong>${discount}</strong> хөнгөлөлт аваарай.
              </p>

              <!-- Code box -->
              <div style="background:#f8f8f8;border:2px dashed #ddd;border-radius:8px;padding:20px;text-align:center;margin-bottom:28px;">
                <span style="font-size:28px;font-weight:800;letter-spacing:4px;color:#111;">${opts.code}</span>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="color:#888;font-size:13px;">Хөнгөлөлт</td>
                  <td style="text-align:right;font-size:13px;color:#111;font-weight:600;">${discount}</td>
                </tr>
                <tr>
                  <td style="color:#888;font-size:13px;padding-top:8px;">Дуусах хугацаа</td>
                  <td style="text-align:right;font-size:13px;color:#e53e3e;font-weight:600;padding-top:8px;">${expiresStr}</td>
                </tr>
                <tr>
                  <td style="color:#888;font-size:13px;padding-top:8px;">Ашиглах боломж</td>
                  <td style="text-align:right;font-size:13px;color:#111;padding-top:8px;">1 удаа</td>
                </tr>
              </table>

              <p style="margin:0;color:#aaa;font-size:12px;line-height:1.6;">
                ⚠️ Энэ код зөвхөн нэг удаа ашиглагдах бөгөөд <strong>${expiresStr}</strong>-д автоматаар устана.<br/>
                Хэрэв та энэ кодыг хүсээгүй бол энэ имэйлийг үл тоомсорлоорой.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#bbb;font-size:12px;">© 2025 FATE. Бүх эрх хуулиар хамгаалагдсан.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
