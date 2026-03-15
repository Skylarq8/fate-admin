// 📁 app/api/categories/route.ts
// app/api/categories/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

// ─── GET /api/categories ──────────────────────────────────────────────────────
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return ok(categories);
}

// ─── POST /api/categories ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body as { name?: string };

    if (!name?.trim()) return fail("name шаардлагатай.");

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return fail("Ийм нэртэй category аль хэдийн байна.");

    const category = await prisma.category.create({
      data: { name: name.trim(), slug },
    });
    return ok(category, 201);
  } catch (err) {
    console.error(err);
    return fail("Серверийн алдаа.", 500);
  }
}