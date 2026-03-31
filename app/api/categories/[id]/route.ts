// app/api/categories/[id]/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api-response"

type Ctx = { params: Promise<{ id: string }> }

// ─── GET /api/categories/:id ──────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,               // parent мэдээлэл
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            children: {
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            },
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
    })

    if (!category) return fail("Category олдсонгүй.", 404)
    return ok(category)
  } catch (err) {
    console.error("[GET /api/categories/:id]", err)
    return fail("Серверийн алдаа.", 500)
  }
}

// ─── PATCH /api/categories/:id ────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, parentId, imageUrl, sortOrder, isActive } = body as {
      name?: string
      parentId?: string | null
      imageUrl?: string | null
      sortOrder?: number
      isActive?: boolean
    }

    // Өөрийгөө parent болгох оролдлогоос хамгаалах
    if (parentId === id) {
      return fail("Category өөрийгөө parent болгож болохгүй.")
    }

    // parentId нь одоогийн category-ийн child мөн эсэхийг шалгах
    // (circular reference)
    if (parentId) {
      const isCircular = await checkCircular(id, parentId)
      if (isCircular) {
        return fail("Circular reference үүсэх тул parentId буруу байна.")
      }
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) {
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-а-яөүё]/gi, "")
      data.name = name.trim()
      data.slug = slug
    }
    if (parentId !== undefined) data.parentId = parentId
    if (imageUrl !== undefined) data.imageUrl = imageUrl
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    if (isActive !== undefined) data.isActive = isActive

    const category = await prisma.category.update({
      where: { id },
      data,
    })

    return ok(category)
  } catch (err: any) {
    if (err.code === "P2025") return fail("Category олдсонгүй.", 404)
    console.error("[PATCH /api/categories/:id]", err)
    return fail("Серверийн алдаа.", 500)
  }
}

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params

    // Children байвал устгахаас өмнө шалгах
    const childCount = await prisma.category.count({
      where: { parentId: id },
    })

    if (childCount > 0) {
      return fail(
        `Энэ category-д ${childCount} дэд category байна. Эхлээд тэдгээрийг устгана уу.`,
        409
      )
    }

    // Product холбоос байвал сануулах
    const productCount = await prisma.productCategory.count({
      where: { categoryId: id },
    })

    if (productCount > 0) {
      return fail(
        `Энэ category-д ${productCount} product холбоотой байна. Эхлээд product-уудын category-г солино уу.`,
        409
      )
    }

    await prisma.category.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (err: any) {
    if (err.code === "P2025") return fail("Category олдсонгүй.", 404)
    console.error("[DELETE /api/categories/:id]", err)
    return fail("Серверийн алдаа.", 500)
  }
}

// ─── Circular reference шалгах helper ────────────────────────────────────────
async function checkCircular(
  categoryId: string,
  newParentId: string
): Promise<boolean> {
  let current: string | null = newParentId

  while (current !== null) {
    if (current === categoryId) return true
    const row: { parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: current },
        select: { parentId: true },
      })
    current = row?.parentId ?? null
  }

  return false
}