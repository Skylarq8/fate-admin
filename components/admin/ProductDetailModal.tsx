"use client"

import { useState, useEffect } from "react"
import { X, Tag, Palette, Ruler, Clock, Pencil } from "lucide-react"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"

// ─── Types ─────────────────────────────────────────────────────────
interface ProductImage {
  id: string; url: string; isPrimary: boolean; order: number
}

interface Category {
  category: { id: string; name: string }
}

export interface VariantOption {
  id: string
  label: string
  values: string[]
  order: number
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
  variants?: VariantOption[]
}

interface Props {
  product: Product | null
  onClose: () => void
  onEdit?: () => void
  categories: { id: string; name: string }[]
}

export default function ProductDetailModal({ product, onClose, onEdit, categories }: Props) {
  const { toasts, remove } = useToast()
  const [activeImage, setActiveImage] = useState<ProductImage | null>(null)
  const [remainingTime, setRemainingTime] = useState<{
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
} | null>(null)

  if (!product) return null

  const displayImage =
    activeImage ??
    product.images.find(i => i.isPrimary) ??
    product.images[0]

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("mn-MN").format(n) + "₮"

  useEffect(() => {
    if (!product?.discountEndsAt) return

    const interval = setInterval(() => {
      if (!product?.discountEndsAt) return
      const end = new Date(product.discountEndsAt).getTime()
      const now = Date.now()
      const diff = end - now

      if (diff <= 0) {
        setRemainingTime(null)
        clearInterval(interval)
        return
      }

      setRemainingTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        totalMs: diff,
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [product])

  return (
    <>
      <div
        className="fixed inset-0 z-50 px-8 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Top actions ── */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-full"
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-full p-1.5"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">

            {/* ── Image ── */}
            {product.images.length > 0 && (
              <div className="space-y-2">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-800 relative">
                  <img
                    src={displayImage?.url}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>

                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {[...product.images].sort((a, b) => a.order - b.order).map(img => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(img)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border transition ${
                          displayImage?.id === img.id
                            ? "border-white"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img.url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Title + Status ── */}
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white leading-tight">
                {product.title}
              </h2>

              <span
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  product.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                {product.status}
              </span>
            </div>

            {/* ── Description ── */}
            <p className="text-white/60 text-sm leading-relaxed">
              {product.description}
            </p>

            {/* ── Price ── */}
            <div className="flex items-center gap-3">
              {product.discountEnabled && product.finalPrice ? (
                <>
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(product.finalPrice)}
                  </span>
                  <span className="text-white/40 line-through text-base">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    -{Math.round((1 - product.finalPrice / product.price) * 100)}%
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-white">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {product.discountEnabled && product.discountEndsAt && remainingTime && (
              <div
                className={`text-[14px] px-2.5 py-1 rounded-lg inline-block font-medium
                ${
                  remainingTime.totalMs < 1000 * 60 * 60 * 24
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                }`}
              >
                ⏳ {remainingTime.days}д {remainingTime.hours}ц {remainingTime.minutes}м {remainingTime.seconds}с
              </div>
            )}
            {/* ── Divider ── */}
            <div className="border-t border-slate-800 pt-4 space-y-4">

              {/* Sizes */}
              {product.sizes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-white/90 flex items-center gap-1">
                    <Ruler size={12} /> Sizes
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map(s => (
                      <span key={s} className="px-3 py-1 text-sm bg-slate-800 border border-slate-700 rounded-md text-white/90">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-white/90 flex items-center gap-1">
                    <Palette size={12} /> Colors
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {product.colors.map(c => (
                      <span key={c} className="px-3 py-1 text-sm bg-slate-800 border border-slate-700 rounded-md capitalize text-white/90">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Variants ── */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-white/40 uppercase tracking-wide">
                    Variants
                  </p>

                  {product.variants.map(v => (
                    <div key={v.id} className="space-y-1.5">
                      <p className="text-sm text-white font-medium">
                        {v.label}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        {v.values.map(val => (
                          <span
                            key={val}
                            className="px-3 py-1 text-sm rounded-lg bg-slate-800 border border-slate-700 text-white/80"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Categories ── */}
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center pt-2">
                <Tag size={13} className="text-white/40" />
                {product.categories.map(({ category }) => (
                  <span key={category.id} className="text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-white/70">
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            {/* Date */}
            <p className="text-xs text-white/30">
              Үүсгэсэн: {new Date(product.createdAt).toLocaleDateString("mn-MN")}
            </p>

          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}