// 📁 app/api/products/by-gender/route.ts
// GET /api/products/by-gender?slug=eregtei
// Өгөгдсөн gender root category болон түүний бүх children дотор байгаа
// бүтээгдэхүүнийг буцаана.
//
// Query params:
//   slug     — gender root category-ийн slug (жишээ: eregtei, emegtei) [шаардлагатай]
//   filter   — discount | newest | oldest
//   search   — барааны нэрээр хайх
//   page     — хуудас (default: 1)
//   limit    — нэг хуудасны барааны тоо (default: 20, max: 100)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";
import { getDescendantIds } from "@/lib/category-tree";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const slug   = searchParams.get("slug");
    const filter = searchParams.get("filter");
    const search = searchParams.get("search");
    const page   = Math.max(1, parseInt(searchParams.get("page")  || "1",  10));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));

    const debug = searchParams.get("debug") === "true";

    if (!slug) {
      // debug mode: байгаа бүх root category-г харуулна
      const roots = await prisma.category.findMany({
        where: { parentId: null },
        select: { id: true, name: true, slug: true },
        orderBy: { sortOrder: "asc" },
      });
      return fail(`slug шаардлагатай. Байгаа root category-ууд: ${roots.map(r => `"${r.slug}" (${r.name})`).join(", ")}`);
    }

    // ── 1. Category олох (parentId-г шалгахгүй, slug-аар л хайна) ───────────
    const rootCategory = await prisma.category.findFirst({
      where: { slug },
    });

    if (!rootCategory) {
      // slug таарахгүй бол байгаа root category-уудыг харуулна
      const roots = await prisma.category.findMany({
        where: { parentId: null },
        select: { id: true, name: true, slug: true },
        orderBy: { sortOrder: "asc" },
      });
      return fail(
        `"${slug}" slug олдсонгүй. Байгаа root category-ууд: ${roots.map(r => `"${r.slug}" (${r.name})`).join(", ")}`,
        404
      );
    }

    if (debug) {
      // Зөвхөн category бүтцийг шалгахад хэрэглэнэ
      const allCats = await prisma.category.findMany({ select: { id: true, parentId: true, name: true, slug: true } });
      const ids = getDescendantIds(rootCategory.id, allCats as any);
      const matched = allCats.filter(c => ids.includes(c.id));
      return ok({ rootCategory, descendantCategories: matched, totalCategoryIds: ids.length });
    }

    // ── 2. Бүх descendant category ID ───────────────────────────────────────
    const allCategories = await prisma.category.findMany({
      select: { id: true, parentId: true },
    });

    const categoryIds = getDescendantIds(rootCategory.id, allCategories as any);

    // ── 3. Тэдгээр category-д байгаа product ID татах ────────────────────────
    const productCategories = await prisma.productCategory.findMany({
      where: { categoryId: { in: categoryIds } },
      select: { productId: true },
    });

    const productIds = [...new Set(productCategories.map((pc) => pc.productId))];

    if (!productIds.length) {
      return ok({ products: [], total: 0, page, limit, totalPages: 0 });
    }

    // ── 4. Where + OrderBy ───────────────────────────────────────────────────
    const where: any = {
      id:     { in: productIds },
      status: "active",
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    };

    let orderBy: any = { createdAt: "desc" };

    switch (filter) {
      case "discount":
        where.discountEnabled = true;
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
    }

    // ── 5. Pagination ────────────────────────────────────────────────────────
    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip:  (page - 1) * limit,
        take:  limit,
        include: {
          images:     { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
          categories: { include: { category: true } },
          variants:   { orderBy: { order: "asc" } },
        },
      }),
    ]);

    return ok({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[products/by-gender] GET error:", err);
    return fail(String(err), 500);
  }
}
