// 📁 app/api/categories/[id]/products/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
    })
    if (!category) return fail("Category олдсонгүй.", 404)

    const productCategories = await prisma.productCategory.findMany({
      where: { categoryId: id },
      include: {
        product: {
          include: {
            images:     { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
            categories: { include: { category: true } },
          },
        },
      },
    })

    const products = productCategories.map((pc) => pc.product)
    return ok({ category, products })
  } catch (err: any) {
    console.error("[categories/id/products] error:", err.message)
    return fail("Серверийн алдаа.", 500)
  }
}