// lib/category-tree.ts
// Category tree utility — flat list → nested tree

export type CategoryNode = {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  parentId: string | null
  children: CategoryNode[]
  _count?: { products: number }
}

/**
 * Flat category array-г nested tree болгоно
 * Prisma-с flat авч энд tree болгох нь query-г хялбар байлгана
 */
export function buildCategoryTree(flat: CategoryNode[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()

  // Бүгдийг map-д хийх
  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] })
  }

  const roots: CategoryNode[] = []

  for (const cat of map.values()) {
    if (cat.parentId) {
      const parent = map.get(cat.parentId)
      if (parent) {
        parent.children.push(cat)
        // sortOrder-оор эрэмбэлэх
        parent.children.sort((a, b) => a.sortOrder - b.sortOrder)
      }
    } else {
      roots.push(cat)
    }
  }

  return roots.sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Category болон түүний бүх descendant-уудын ID-г буцаана
 * (Sub-tree-ийн бүх product-уудыг татахад хэрэглэнэ)
 */
export function getDescendantIds(
  categoryId: string,
  flat: CategoryNode[]
): string[] {
  const ids: string[] = [categoryId]
  const children = flat.filter((c) => c.parentId === categoryId)
  for (const child of children) {
    ids.push(...getDescendantIds(child.id, flat))
  }
  return ids
}

/**
 * Category-ийн breadcrumb path буцаана
 * Жишээ: ["Эрэгтэй", "Хувцас", "Цамц"]
 */
export function getCategoryPath(
  categoryId: string,
  flat: CategoryNode[]
): CategoryNode[] {
  const path: CategoryNode[] = []
  let current = flat.find((c) => c.id === categoryId)
  while (current) {
    path.unshift(current)
    current = current.parentId
      ? flat.find((c) => c.id === current!.parentId)
      : undefined
  }
  return path
}