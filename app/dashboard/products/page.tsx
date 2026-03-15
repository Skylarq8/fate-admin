// 📁 app/admin/products/page.tsx
"use client"

import { useEffect, useState } from "react"
import AddProductDrawer from "@/components/admin/AddProductDrawer"
import ProductDetailModal, { Product } from "@/components/admin/ProductDetailModal"
import EditProductDrawer from "@/components/admin/EditProductDrawer"

interface Category { id: string; name: string }

export default function ProductsPage() {
  const [products,   setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<Product | null>(null)
  const [editing,    setEditing]    = useState<Product | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    const res  = await fetch("/api/products")
    const data = await res.json()
    setProducts(data.data ?? [])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const res  = await fetch("/api/categories")
    const data = await res.json()
    setCategories(data.data ?? [])
  }

  useEffect(() => { fetchProducts(); fetchCategories() }, [])

  const formatPrice = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"

  return (
    <div className="py-4 px-1 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Products</h1>
        <AddProductDrawer categories={categories} onSuccess={fetchProducts} />
      </div>

      {loading ? (
        <div className="text-white/40 text-sm">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-white/40 text-sm">Бараа байхгүй байна.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="text-white/40 text-sm pb-2">Нийт {products.length} бараа байна.</div>
          <div className="hidden md:block rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-white">
              <thead className="bg-slate-800 text-white/50 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Зураг</th>
                  <th className="px-4 py-3 text-left">Нэр</th>
                  <th className="px-4 py-3 text-left">Үнэ</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map(product => {
                  const primary = product.images.find(i => i.isPrimary) ?? product.images[0]
                  return (
                    <tr key={product.id} onClick={() => setSelected(product)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        {primary
                          ? <img src={primary.url} className="w-12 h-12 object-cover rounded-lg" />
                          : <div className="w-12 h-12 bg-slate-700 rounded-lg" />}
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
                          {product.categories.slice(0, 2).map(({ category }) => (
                            <span key={category.id} className="bg-slate-700 text-white/70 text-xs px-2 py-0.5 rounded-full">
                              {category.name}
                            </span>
                          ))}
                          {product.categories.length > 2 && (
                            <span className="text-white/30 text-xs">+{product.categories.length - 2}</span>
                          )}
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
              const primary = product.images.find(i => i.isPrimary) ?? product.images[0]
              return (
                <div key={product.id} onClick={() => setSelected(product)}
                  className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3 cursor-pointer active:bg-slate-700 transition-colors">
                  {primary
                    ? <img src={primary.url} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-16 h-16 bg-slate-700 rounded-lg flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white text-sm truncate">{product.title}</p>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                        product.status === "active"
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>{product.status}</span>
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
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {product.categories.slice(0, 2).map(({ category }) => (
                        <span key={category.id} className="bg-slate-700 text-white/60 text-xs px-2 py-0.5 rounded-full">
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && !editing && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(selected)}
          onUpdated={(p) => {
            setProducts(prev => prev.map(x => x.id === p.id ? p : x))
            setSelected(p)
          }}
          onDeleted={() => {
            setSelected(null)
            fetchProducts()
          }}
          categories={categories}
        />
      )}

      {/* Edit Drawer — page дээр render, modal-аас гадна */}
      {editing && (
        <EditProductDrawer
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSuccess={(updated) => {
            setProducts(prev => prev.map(x => x.id === updated.id ? updated : x))
            setSelected(updated)
            setEditing(null)
          }}
          onDeleted={(_id) => {
            setEditing(null)
            setSelected(null)
            fetchProducts()
          }}
        />
      )}
    </div>
  )
}