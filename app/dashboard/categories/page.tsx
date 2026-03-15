// 📁 app/admin/categories/page.tsx
"use client"

import { useEffect, useState } from "react"
import { ChevronRight, X, Tag, Boxes } from "lucide-react"
import AddCategoryModal from "@/components/admin/AddCategoryModal"
import ProductDetailModal, { Product } from "@/components/admin/ProductDetailModal"

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

export default function CategoriesPage() {
  const [categories,        setCategories]        = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [selectedCat,       setSelectedCat]       = useState<Category | null>(null)
  const [products,          setProducts]          = useState<Product[]>([])
  const [loadingProducts,   setLoadingProducts]   = useState(false)
  const [selectedProduct,   setSelectedProduct]   = useState<Product | null>(null)
  const [allCategories,     setAllCategories]     = useState<{ id: string; name: string }[]>([])

  const fetchCategories = async () => {
    setLoadingCategories(true)
    const res  = await fetch("/api/categories")
    const data = await res.json()
    setCategories(data.data ?? [])
    setAllCategories((data.data ?? []).map((c: Category) => ({ id: c.id, name: c.name })))
    setLoadingCategories(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openCategory = async (cat: Category) => {
    setSelectedCat(cat)
    setProducts([])
    setLoadingProducts(true)
    try {
      const res  = await fetch(`/api/categories/${cat.id}/products`)
      const data = await res.json()
      setProducts(data.data?.products ?? [])
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const formatPrice = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"

  return (
    <div className="py-4 px-1 md:p-6 min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Categories</h1>
          {selectedCat && (
            <div className="flex items-center gap-1.5 mt-1 text-xs md:text-sm text-white/40">
              <button onClick={() => setSelectedCat(null)} className="hover:text-white transition-colors">
                All
              </button>
              <ChevronRight size={12} />
              <span className="text-white">{selectedCat.name}</span>
            </div>
          )}
        </div>
        {!selectedCat && <AddCategoryModal onSuccess={fetchCategories} />}
        {selectedCat && (
          <button
            onClick={() => setSelectedCat(null)}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
          >
            <X size={14} /> Буцах
          </button>
        )}
      </div>

      {/* ── Category list ── */}
      {!selectedCat && (
        <>
          {loadingCategories ? (
            <div className="text-white/40 text-sm">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-white/40 text-sm">Category байхгүй байна.</div>
          ) : (
            <>
              <div className="text-white/40 text-sm pb-2">Нийт {categories.length} category байна.</div>
              {/* Desktop table */}
              <div className="hidden md:block rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-white">
                  <thead className="bg-slate-800 text-white/50 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Нэр</th>
                      <th className="px-4 py-3 text-left">Slug</th>
                      <th className="px-4 py-3 text-left">Бараа</th>
                      <th className="px-4 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {categories.map(cat => (
                      <tr
                        key={cat.id}
                        onClick={() => openCategory(cat)}
                        className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center">
                              <Tag size={14} className="text-white/40" />
                            </div>
                            <span className="font-medium">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/40 font-mono text-xs">{cat.slug}</td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-800 border border-slate-700 text-white/60 text-xs px-2.5 py-1 rounded-full">
                            {cat._count.products} бараа
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/30">
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-2">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => openCategory(cat)}
                    className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-4 cursor-pointer active:bg-slate-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag size={16} className="text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{cat.name}</p>
                      <p className="text-white/40 text-xs font-mono">{cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-700 text-white/50 text-xs px-2.5 py-1 rounded-full">
                        {cat._count.products}
                      </span>
                      <ChevronRight size={16} className="text-white/30" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Products of selected category ── */}
      {selectedCat && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Boxes size={16} className="text-white/40" />
            <span className="text-white/60 text-sm">
              {loadingProducts ? "Loading..." : `${products.length} бараа`}
            </span>
          </div>

          {loadingProducts ? (
            <div className="text-white/40 text-sm">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-white/40 text-sm">Энэ category-д бараа байхгүй байна.</div>
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
                      const primary = product.images.find(i => i.isPrimary) ?? product.images[0]
                      return (
                        <tr
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            {primary
                              ? <img src={primary.url} className="w-12 h-12 object-cover rounded-lg" />
                              : <div className="w-12 h-12 bg-slate-700 rounded-lg" />
                            }
                          </td>
                          <td className="px-4 py-3 font-medium">{product.title}</td>
                          <td className="px-4 py-3">
                            {product.discountEnabled && product.finalPrice ? (
                              <div>
                                <div className="font-medium">{formatPrice(product.finalPrice)}</div>
                                <div className="text-white/30 line-through text-xs">{formatPrice(product.price)}</div>
                              </div>
                            ) : formatPrice(product.price)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {product.sizes.slice(0, 3).map(s => (
                                <span key={s} className="bg-slate-800 border border-slate-700 text-white/60 text-xs px-2 py-0.5 rounded">
                                  {s}
                                </span>
                              ))}
                              {product.sizes.length > 3 && (
                                <span className="text-white/30 text-xs">+{product.sizes.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${
                              product.status === "active"
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {products.map(product => {
                  const primary = product.images.find(i => i.isPrimary) ?? product.images[0]
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3 cursor-pointer active:bg-slate-700 transition-colors"
                    >
                      {primary
                        ? <img src={primary.url} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                        : <div className="w-16 h-16 bg-slate-700 rounded-lg flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-white text-sm truncate">{product.title}</p>
                          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                            product.status === "active"
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}>
                            {product.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.discountEnabled && product.finalPrice ? (
                            <>
                              <span className="text-white font-semibold text-sm">{formatPrice(product.finalPrice)}</span>
                              <span className="text-white/30 line-through text-xs">{formatPrice(product.price)}</span>
                            </>
                          ) : (
                            <span className="text-white/80 text-sm">{formatPrice(product.price)}</span>
                          )}
                        </div>
                        {product.sizes.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {product.sizes.slice(0, 3).map(s => (
                              <span key={s} className="bg-slate-700 border border-slate-600 text-white/50 text-xs px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {product.sizes.length > 3 && (
                              <span className="text-white/30 text-xs">+{product.sizes.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onUpdated={(p) => setProducts(prev => prev.map(x => x.id === p.id ? p : x))} categories={allCategories} />
    </div>
  )
}