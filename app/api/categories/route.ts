// app/api/categories/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { ok, fail } from "@/lib/api-response"
import { buildCategoryTree } from "@/lib/category-tree"

// ─── GET /api/categories ──────────────────────────────────────────────────────
// ?flat=true  → flat array (admin select dropdown-д)
// ?flat=false → nested tree (default, frontend-д)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const flat = searchParams.get("flat") === "true"

    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
      },
    })

    if (flat) {
      // Admin dropdown, product form-д ашиглана
      return ok(categories)
    }

    // Nested tree
    const tree = buildCategoryTree(categories as any)
    return ok(tree)
  } catch (err) {
    console.error("[GET /api/categories]", err)
    return fail("Серверийн алдаа.", 500)
  }
}

// ─── POST /api/categories ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, parentId, imageUrl, sortOrder } = body

    if (!name?.trim()) return fail("name шаардлагатай.")

    let parentSlug = ""

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      })

      if (!parent) return fail("Parent category олдсонгүй.", 404)

      parentSlug = parent.slug
    }

    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-а-яөүё]/gi, "")

    const slug = parentSlug
      ? `${parentSlug}-${baseSlug}`
      : baseSlug

    const existing = await prisma.category.findFirst({
      where: {
        slug,
        parentId: parentId ?? null,
      },
    })

    if (existing) {
      return fail("Энэ parent дотор ийм category байна.")
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        parentId: parentId ?? null,
        imageUrl: imageUrl ?? null,
        sortOrder: sortOrder ?? 0,
      },
    })

    return ok(category, 201)
  } catch (err) {
    console.error("[POST /api/categories]", err)
    return fail("Серверийн алдаа.", 500)
  }
}