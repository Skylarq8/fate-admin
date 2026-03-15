// 📁 components/admin/ProductDetailModal.tsx
"use client"

import { useState } from "react"
import { X, Tag, Palette, Ruler, Clock, Pencil } from "lucide-react"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductImage {
  id: string; url: string; isPrimary: boolean; order: number
}

interface Category {
  category: { id: string; name: string }
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  finalPrice: number | null
  discountEnabled: boolean
  discountEndsAt: string | null
  sizes: string[]
  colors: string[]
  status: "active" | "inactive"
  createdAt: string
  images: ProductImage[]
  categories: Category[]
}

interface Props {
  product: Product | null
  onClose: () => void
  onEdit?: () => void            // Edit товч дарахад гадна handler дуудна
  onUpdated?: (updated: Product) => void
  onDeleted?: (id: string) => void
  categories: { id: string; name: string }[]
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductDetailModal({ product, onClose, onEdit, onUpdated, onDeleted, categories }: Props) {
  const { toasts, remove } = useToast()
  const [activeImage, setActiveImage] = useState<ProductImage | null>(null)
  const [current,     setCurrent]     = useState<Product | null>(product)

  if (product && product.id !== current?.id) {
    setCurrent(product)
    setActiveImage(null)
  }

  if (!current) return null

  const displayImage = activeImage
    ?? current.images.find(i => i.isPrimary)
    ?? current.images[0]

  const formatPrice = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* top actions */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-full p-1.5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Images */}
            {current.images.length > 0 && (
              <div className="space-y-2">
                <div className="w-full h-56 md:h-64 rounded-xl overflow-hidden bg-slate-800">
                  <img src={displayImage?.url} alt={current.title} className="w-full h-full object-cover" />
                </div>
                {current.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[...current.images]
                      .sort((a, b) => a.order - b.order)
                      .map(img => (
                        <button
                          key={img.id}
                          onClick={() => setActiveImage(img)}
                          className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                            (activeImage?.id ?? current.images.find(i => i.isPrimary)?.id) === img.id
                              ? "border-white" : "border-transparent"
                          }`}
                        >
                          <img src={img.url} className="w-full h-full object-cover" />
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Title + status */}
            <div className="flex items-start justify-between gap-3 pr-24">
              <h2 className="text-xl font-semibold text-white">{current.title}</h2>
              <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border ${
                current.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {current.status}
              </span>
            </div>

            {/* Description */}
            <p className="text-white/60 text-sm leading-relaxed">{current.description}</p>

            {/* Price */}
            <div className="flex items-center gap-3">
              {current.discountEnabled && current.finalPrice ? (
                <>
                  <span className="text-2xl font-bold text-white">{formatPrice(current.finalPrice)}</span>
                  <span className="text-white/40 line-through text-lg">{formatPrice(current.price)}</span>
                  <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/30">
                    -{Math.round((1 - current.finalPrice / current.price) * 100)}%
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-white">{formatPrice(current.price)}</span>
              )}
            </div>

            {current.discountEnabled && current.discountEndsAt && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Clock size={14} />
                <span>Хямдрал дуусах: {new Date(current.discountEndsAt).toLocaleDateString("mn-MN")}</span>
              </div>
            )}

            {/* Categories */}
            {current.categories.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={14} className="text-white/40" />
                {current.categories.map(({ category }) => (
                  <span key={category.id} className="bg-slate-800 text-white/70 text-xs px-2.5 py-1 rounded-full border border-slate-700">
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            {/* Sizes */}
            {current.sizes.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-white/40 text-xs"><Ruler size={13} /> Sizes</div>
                <div className="flex gap-2 flex-wrap">
                  {current.sizes.map(s => (
                    <span key={s} className="bg-slate-800 text-white text-sm px-3 py-1 rounded-md border border-slate-700">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {current.colors.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-white/40 text-xs"><Palette size={13} /> Colors</div>
                <div className="flex gap-2 flex-wrap">
                  {current.colors.map(c => (
                    <span key={c} className="bg-slate-800 text-white/70 text-sm px-3 py-1 rounded-md border border-slate-700 capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-white/30 text-xs">
              Үүсгэсэн: {new Date(current.createdAt).toLocaleDateString("mn-MN")}
            </p>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}