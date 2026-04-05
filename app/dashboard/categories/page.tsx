// 📁 app/dashboard/categories/page.tsx
"use client"

import { useEffect, useState } from "react"
import { ChevronRight, FolderOpen, Folder, Plus, Pencil, Trash2, Check, X, Tag, ArrowLeft } from "lucide-react"
import ProductDetailModal, { Product } from "@/components/admin/ProductDetailModal"
import EditProductDrawer from "@/components/admin/EditProductDrawer"
import AddCategoryModal from "@/components/admin/AddCategoryModal"

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  _count: { products: number }
  children: Category[]
}

function EditInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(value)
  return (
    <div className="flex items-center gap-1.5 flex-1" onClick={e => e.stopPropagation()}>
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel() }}
        autoFocus
        className="flex-1 bg-slate-700 border border-violet-500/50 text-white text-sm px-2.5 py-1 rounded-lg outline-none min-w-0" />
      <button onClick={() => onSave(val)} className="text-green-400 hover:text-green-300 p-1"><Check size={14} /></button>
      <button onClick={onCancel} className="text-white/40 hover:text-white p-1"><X size={14} /></button>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories,      setCategories]      = useState<Category[]>([])
  const [loading,         setLoading]         = useState(true)
  const [expanded,        setExpanded]        = useState<Set<string>>(new Set())
  const [editingId,       setEditingId]       = useState<string | null>(null)
  const [selectedCatId,   setSelectedCatId]   = useState<string | null>(null)
  const [selectedCatName, setSelectedCatName] = useState<string>("")
  const [products,        setProducts]        = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingProduct,  setEditingProduct]  = useState<Product | null>(null)
  const [allCategories,   setAllCategories]   = useState<{ id: string; name: string }[]>([])
  const [showProducts,    setShowProducts]    = useState(false) // mobile: products panel

  const fetchCategories = async () => {
    setLoading(true)
    const res  = await fetch("/api/categories")
    const data = await res.json()
    const cats = data.data ?? []
    setCategories(cats)
    const flat: { id: string; name: string }[] = []
    const flatten = (list: Category[]) => list.forEach(c => { flat.push({ id: c.id, name: c.name }); flatten(c.children ?? []) })
    flatten(cats)
    setAllCategories(flat)
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const fetchProducts = async (cat: Category) => {
    setSelectedCatId(cat.id)
    setSelectedCatName(cat.slug)
    setProducts([])
    setLoadingProducts(true)
    setShowProducts(true)
    try {
      const res  = await fetch(`/api/categories/${cat.id}/products`)
      const data = await res.json()
      setProducts(data.data?.products ?? [])
    } finally { setLoadingProducts(false) }
  }

  const countProductsRecursive = (cat: Category): number => {
    let count = cat._count.products
    if (cat.children?.length) {
      count += cat.children.reduce((acc, c) => acc + countProductsRecursive(c), 0)
    }
    return count
  }

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleRename = async (id: string, name: string) => {
    if (!name.trim()) return
    await fetch(`/api/categories/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    setEditingId(null)
    fetchCategories()
  }

  const handleDelete = async (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`"${cat.name}" устгах уу?`)) return
    await fetch(`/api/categories/${cat.id}`, { method: "DELETE" })
    if (selectedCatId === cat.id) { setSelectedCatId(null); setProducts([]); setShowProducts(false) }
    fetchCategories()
  }

  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"

  // ── Tree row ──────────────────────────────────────────────────────────────
  const TreeRow = ({ cat, depth = 0 }: { cat: Category; depth?: number }) => {
    const isExpanded  = expanded.has(cat.id)
    const hasChildren = (cat.children?.length ?? 0) > 0
    const isEditing   = editingId === cat.id
    const isSelected  = selectedCatId === cat.id

    return (
      <div>
        <div
          onClick={() => !isEditing && fetchProducts(cat)}
          className={`group flex items-center gap-2.5 py-2.5 pr-200 rounded-xl cursor-pointer transition-all border
            ${isSelected
              ? "bg-violet-500/10 border-violet-500/20 text-white"
              : "border-transparent hover:bg-slate-800/50 text-white/70 hover:text-white"
            }`}
          style={{ paddingLeft: `${10 + depth * 18}px` }}
        >
          {/* expand arrow */}
          <button onClick={e => hasChildren && toggleExpand(cat.id, e)}
            className={`flex-shrink-0 w-4 transition-all ${hasChildren ? "text-white/70 hover:text-white" : "opacity-0 pointer-events-none"}`}>
            <ChevronRight size={20} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </button>

          {/* icon */}
          {hasChildren
            ? <FolderOpen size={18} className={isSelected ? "text-violet-400 flex-shrink-0" : "text-white/30 flex-shrink-0"} />
            : <Folder    size={18} className={isSelected ? "text-violet-400 flex-shrink-0" : "text-white/20 flex-shrink-0"} />
          }

          {/* name */}
          {isEditing ? (
            <EditInput value={cat.name} onSave={v => handleRename(cat.id, v)} onCancel={() => setEditingId(null)} />
          ) : (
            <>
              <span className="flex-1 text-sm">{cat.name}</span>
              <span className="text-white/70 text-[14px] flex-shrink-0">{countProductsRecursive(cat)}</span>
            </>
          )}

          {/* actions on hover */}
          {/* {!isEditing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={e => e.stopPropagation()}>
              <AddCategoryModal
                onSuccess={() => { fetchCategories(); setExpanded(p => new Set(p).add(cat.id)) }}
              />
              <button onClick={e => { e.stopPropagation(); setEditingId(cat.id) }}
                className="p-1 text-white/20 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                <Pencil size={12} />
              </button>
              <button onClick={e => handleDelete(cat, e)}
                className="p-1 text-white/20 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          )} */}
        </div>

        {/* children */}
        {isExpanded && cat.children?.map(child => (
          <TreeRow key={child.id} cat={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  // ── Products panel ────────────────────────────────────────────────────────
  const ProductsPanel = () => (
    <div className="flex-1 min-w-0">
      {!selectedCatId ? (
        <div className="hidden md:flex flex-col items-center justify-center h-64 text-white/20 space-y-3">
          <Tag size={36} className="opacity-30" />
          <p className="text-sm">Зүүн талаас category сонгоно уу</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setShowProducts(false)} className="md:hidden text-white/70 hover:text-white p-1">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-white font-bold text-lg">{selectedCatName}</h2>
              <p className="text-white/40 text-sm">{loadingProducts ? "Уншиж байна..." : `${products.length} бараа`}</p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl animate-pulse" />)}</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/20 space-y-2">
              <p className="text-sm">Бараа байхгүй байна</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-white">
                  <thead className="bg-slate-800 text-white/50 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Зураг</th>
                      <th className="px-4 py-3 text-left">Нэр</th>
                      <th className="px-4 py-3 text-left">Үнэ</th>
                      <th className="px-4 py-3 text-left">Sizes</th>
                      <th className="px-4 py-3 text-left">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {products.map(product => {
                      const img = product.images.find(i => i.isPrimary) ?? product.images[0]
                      return (
                        <tr key={product.id} onClick={() => setSelectedProduct(product)}
                          className="hover:bg-slate-800/60 cursor-pointer transition-colors">
                          <td className="px-4 py-3">
                            {img ? <img src={img.url} className="w-12 h-12 object-cover rounded-lg" />
                                 : <div className="w-12 h-12 bg-slate-700 rounded-lg" />}
                          </td>
                          <td className="px-4 py-3 font-medium">{product.title}</td>
                          <td className="px-4 py-3">
                            {product.discountEnabled && product.finalPrice ? (
                              <div>
                                <div className="font-medium">{fmt(product.finalPrice)}</div>
                                <div className="text-white/30 line-through text-xs">{fmt(product.price)}</div>
                              </div>
                            ) : fmt(product.price)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {product.sizes.slice(0, 3).map(s => (
                                <span key={s} className="bg-slate-800 border border-slate-700 text-white/60 text-xs px-2 py-0.5 rounded">{s}</span>
                              ))}
                              {product.sizes.length > 3 && <span className="text-white/30 text-xs">+{product.sizes.length - 3}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${
                              product.status === "active"
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}>{product.status}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {products.map(product => {
                  const img = product.images.find(i => i.isPrimary) ?? product.images[0]
                  return (
                    <div key={product.id} onClick={() => setSelectedProduct(product)}
                      className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3 cursor-pointer active:bg-slate-700 transition-colors">
                      {img ? <img src={img.url} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                           : <div className="w-16 h-16 bg-slate-700 rounded-lg flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{product.title}</p>
                        <p className="text-white/60 text-sm mt-0.5">
                          {product.discountEnabled && product.finalPrice ? fmt(product.finalPrice) : fmt(product.price)}
                        </p>
                        {product.sizes.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {product.sizes.slice(0, 3).map(s => (
                              <span key={s} className="bg-slate-700 text-white/50 text-xs px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        product.status === "active"
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>{product.status}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="py-4 px-1 md:p-6 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-white">Ангиллууд</h1>
        <AddCategoryModal onSuccess={fetchCategories} />
      </div>

      {/* Layout */}
      <div className="flex gap-5">

        {/* ── Tree sidebar ── */}
        <div className={`${showProducts ? "hidden md:block" : "block"} w-full md:w-46 lg:w-46 flex-shrink-0`}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-3 space-y-1.5">
                {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-slate-800 rounded-lg animate-pulse" />)}
              </div>
            ) : categories.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm space-y-2">
                <FolderOpen size={28} className="mx-auto opacity-30" />
                <p>Category байхгүй</p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {categories
                  .slice()
                  .reverse()
                  .map(cat => <TreeRow key={cat.id} cat={cat} />)
                }
              </div>
            )}
          </div>
        </div>

        {/* ── Products panel ── */}
        <div className={`${showProducts ? "block" : "hidden md:block"} flex-1 min-w-0`}>
          <ProductsPanel />
        </div>
      </div>

      {/* Modals */}
      {selectedProduct && !editingProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={() => setEditingProduct(selectedProduct)}
          onUpdated={p => { setProducts(prev => prev.map(x => x.id === p.id ? p : x)); setSelectedProduct(p) }}
          onDeleted={() => { setProducts(prev => prev.filter(p => p.id !== selectedProduct.id)); setSelectedProduct(null) }}
          categories={allCategories}
        />
      )}
      {editingProduct && (
        <EditProductDrawer
          product={editingProduct}
          categories={allCategories}
          onClose={() => setEditingProduct(null)}
          onSuccess={updated => { setProducts(prev => prev.map(x => x.id === updated.id ? updated : x)); setSelectedProduct(updated); setEditingProduct(null) }}
          onDeleted={() => { setProducts(prev => prev.filter(p => p.id !== editingProduct.id)); setEditingProduct(null); setSelectedProduct(null) }}
        />
      )}
    </div>
  )
}