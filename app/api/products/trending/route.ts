// 📁 app/api/products/trending/route.ts
// GET /api/products/trending?limit=10
// Хамгийн их захиалгасан (quantity нийлбэрээр) бүтээгдэхүүнийг буцаана

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

    // OrderItem-ийг productId-аар бүлэглэж, quantity нийлбэрийг тооцоолно
    const topItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    if (!topItems.length) return ok([]);

    const productIds = topItems.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "active" },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        categories: { include: { category: true } },
        variants: { orderBy: { order: "asc" } },
      },
    });

    // topItems-ийн эрэмбийг хадгалж, totalOrdered талбарыг нэмнэ
    const productMap = new Map(products.map((p) => [p.id, p]));

    const result = topItems
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return {
          ...product,
          totalOrdered: item._sum.quantity ?? 0,
        };
      })
      .filter(Boolean);

    return ok(result);
  } catch (err) {
    console.error("[products/trending] GET error:", err);
    return fail(String(err), 500);
  }
}
