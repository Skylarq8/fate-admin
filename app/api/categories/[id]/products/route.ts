// app/api/categories/[id]/products/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api-response"
import { getDescendantIds } from "@/lib/category-tree"

// ─── GET /api/categories/:id/products ────────────────────────────────────────
// ?includeChildren=true  → sub-tree-ийн бүх product (default: true)
// ?includeChildren=false → зөвхөн энэ category-ийн шууд product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const includeChildren = searchParams.get("includeChildren") !== "false"

    // Category оршин байгаа эсэх
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    })
    if (!category) return fail("Category олдсонгүй.", 404)

    let categoryIds: string[] = [id]

    if (includeChildren && category.children.length > 0) {
      // Бүх descendant ID-г flat array-аас тооцоолно
      const allCategories = await prisma.category.findMany({
        select: { id: true, parentId: true },
      })
      categoryIds = getDescendantIds(id, allCategories as any)
    }

    const productCategories = await prisma.productCategory.findMany({
      where: { categoryId: { in: categoryIds } },
      include: {
        product: {
          include: {
            images: {
              orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
            },
            categories: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true, parentId: true },
                },
              },
            },
          },
        },
      },
    })

    // Давхардсан product-уудыг арилгах (олон sub-category-д байвал)
    const seen = new Set<string>()
    const products = productCategories
      .map((pc) => pc.product)
      .filter((p) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })

    return ok({
      category,
      products,
      total: products.length,
    })
  } catch (err: any) {
    console.error("[GET /api/categories/:id/products]", err.message)
    return fail("Серверийн алдаа.", 500)
  }
}