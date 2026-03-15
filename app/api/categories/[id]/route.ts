// 📁 app/api/categories/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!category) return fail("Category олдсонгүй.", 404)
  return ok(category)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const { name } = await req.json() as { name?: string }
    if (!name?.trim()) return fail("name шаардлагатай.")
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-")
    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug },
    })
    return ok(category)
  } catch {
    return fail("Category олдсонгүй.", 404)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    await prisma.category.delete({ where: { id } })
    return ok({ deleted: true })
  } catch {
    return fail("Category олдсонгүй.", 404)
  }
}