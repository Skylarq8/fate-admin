// 📁 components/admin/EditProductDrawer.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { ChevronDown, X, Loader2, Trash2, Star, ImageIcon, Plus } from "lucide-react"
import { Product, VariantOption } from "@/components/admin/ProductDetailModal"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Category {
  id: string
  name: string
  parentId: string | null
}

// Local variant type — flat, without DB fields like `id` / `order`
type Variant = {
  id: string      // temp-* for new ones, real id for existing
  label: string
  values: string[]
  order: number
}

interface Props {
  product: Product
  categories: Category[]
  onClose: () => void
  onSuccess: (updated: Product) => void
  onDeleted?: (id: string) => void
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SIZE_OPTIONS  = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
const COLOR_OPTIONS = ["Хар", "Цагаан", "Саарал", "Улаан", "Цэнхэр", "Ногоон", "Шар", "Улбар шар", "Ягаан"]

// ─────────────────────────────────────────────
// InlineCustomInput — single-field "Add Custom" input
// Commits value on Enter or blur; closes on Escape or empty blur
// ─────────────────────────────────────────────
interface InlineCustomInputProps {
  placeholder: string
  existing: string[]             // to prevent duplicates
  onCommit: (value: string) => void
  onClose: () => void
}

function InlineCustomInput({ placeholder, existing, onCommit, onClose }: InlineCustomInputProps) {
  const [val, setVal] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus() }, [])

  const commit = () => {
    const trimmed = val.trim()
    if (trimmed && !existing.includes(trimmed)) {
      onCommit(trimmed)
    }
    onClose()
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter")  { e.preventDefault(); commit() }
          if (e.key === "Escape") { onClose() }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
      />
      <button
        type="button"
        onMouseDown={e => e.preventDefault()} // prevent blur before click
        onClick={onClose}
        className="text-white/30 hover:text-white/60 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function EditProductDrawer({ product, categories, onClose, onSuccess, onDeleted }: Props) {
  const { toasts, remove, success, error } = useToast()

  const fmt    = (n: number) => new Intl.NumberFormat("mn-MN").format(n)
  const parse  = (s: string) => Number(s.replace(/\D/g, ""))
  const fmtInp = (s: string) => { const n = s.replace(/\D/g, ""); return n ? new Intl.NumberFormat("mn-MN").format(Number(n)) : "" }

  // ── Core fields ──
  const [title,           setTitle]           = useState(product.title)
  const [description,     setDescription]     = useState(product.description)
  const [price,           setPrice]           = useState(fmt(product.price))
  const [finalPrice,      setFinalPrice]      = useState(product.finalPrice ? fmt(product.finalPrice) : "")
  const [discountEnabled, setDiscountEnabled] = useState(product.discountEnabled)
  const [discountEndsAt,  setDiscountEndsAt]  = useState(
    product.discountEndsAt ? new Date(product.discountEndsAt).toISOString().slice(0, 16) : ""
  )
  const [status, setStatus] = useState<"active" | "inactive">(product.status)

  // ── Sizes — predefined selection + custom additions ──
  // Separate out what came from the product: predefined vs custom
  const [sizes,           setSizes]           = useState<string[]>(product.sizes)
  const [customSizes,     setCustomSizes]     = useState<string[]>(
    // Any size not in SIZE_OPTIONS is already a custom value
    product.sizes.filter(s => !SIZE_OPTIONS.includes(s))
  )
  const [showCustomSize,  setShowCustomSize]  = useState(false)

  // ── Colors — same pattern ──
  const [colors,          setColors]          = useState<string[]>(product.colors)
  const [customColors,    setCustomColors]    = useState<string[]>(
    product.colors.filter(c => !COLOR_OPTIONS.includes(c))
  )
  const [showCustomColor, setShowCustomColor] = useState(false)

  // ── All selectable options (predefined + custom) ──
  const allSizeOptions  = [...SIZE_OPTIONS,  ...customSizes.filter(s => !SIZE_OPTIONS.includes(s))]
  const allColorOptions = [...COLOR_OPTIONS, ...customColors.filter(c => !COLOR_OPTIONS.includes(c))]

  // ── Categories ──
  const [selectedCats,  setSelectedCats]  = useState<string[]>(product.categories.map(c => c.category.id))
  const [categoryOpen,  setCategoryOpen]  = useState(false)

  // ── UI state ──
  const [loading,       setLoading]       = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgLoading,    setImgLoading]    = useState<string | null>(null)
  const [images,        setImages]        = useState(product.images ?? [])

  // ── Variants ──
  const [variants,   setVariants]   = useState<Variant[]>([])
  const [varLoading, setVarLoading] = useState(false)

  // Fetch existing variants on mount
  useEffect(() => {
    fetch(`/api/products/${product.id}/variants`)
      .then(r => r.json())
      .then(d => setVariants(d.data ?? []))
  }, [product.id])

  useEffect(() => { setImages(product.images ?? []) }, [product.id])

  const getCategoryLabel = (cat: Category): string => {
    const names: string[] = []
    let current: Category | undefined = cat
    while (current) {
      names.unshift(current.name)
      current = categories.find(c => c.id === current!.parentId)
    }
    return names.join(" / ")
  }

  // ─────────────────────────────────────────────
  // Variant persistence
  // ─────────────────────────────────────────────
  const saveVariants = async (next: Variant[]) => {
    setVarLoading(true)
    await fetch(`/api/products/${product.id}/variants`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variants: next }),
    })
    setVarLoading(false)
  }

  // ── Variant updaters (mirror AddProductDrawer, but each calls saveVariants) ──
  const addVariant = () => {
    const next: Variant[] = [
      ...variants,
      { id: `temp-${Date.now()}`, label: "", values: [""], order: variants.length },
    ]
    setVariants(next)
    saveVariants(next)
  }

  const removeVariant = (id: string) => {
    const next = variants.filter(v => v.id !== id)
    setVariants(next)
    saveVariants(next)
  }

  const updateVariantLabel = (id: string, label: string) => {
    const next = variants.map(v => v.id === id ? { ...v, label } : v)
    setVariants(next)
    saveVariants(next)
  }

  const addVariantValue = (id: string) => {
    const next = variants.map(v => v.id === id ? { ...v, values: [...v.values, ""] } : v)
    setVariants(next)
    saveVariants(next)
  }

  const updateVariantValue = (id: string, vali: number, text: string) => {
    const next = variants.map(v =>
      v.id === id
        ? { ...v, values: v.values.map((val, j) => j === vali ? text : val) }
        : v
    )
    setVariants(next)
    // Don't save on every keystroke — save on blur (see input onBlur below)
  }

  const flushVariantValue = (id: string) => {
    // Called onBlur to persist the current in-memory state
    saveVariants(variants)
  }

  const removeVariantValue = (id: string, vali: number) => {
    const next = variants.map(v =>
      v.id === id ? { ...v, values: v.values.filter((_, j) => j !== vali) } : v
    )
    setVariants(next)
    saveVariants(next)
  }

  // ─────────────────────────────────────────────
  // Custom size / color helpers
  // ─────────────────────────────────────────────
  const addCustomSize = (val: string) => {
    if (!customSizes.includes(val)) setCustomSizes(prev => [...prev, val])
    // Auto-select it
    if (!sizes.includes(val)) setSizes(prev => [...prev, val])
  }

  const addCustomColor = (val: string) => {
    if (!customColors.includes(val)) setCustomColors(prev => [...prev, val])
    if (!colors.includes(val)) setColors(prev => [...prev, val])
  }

  const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val])

  // ─────────────────────────────────────────────
  // Image handlers
  // ─────────────────────────────────────────────
  const handleSetPrimary = async (imageId: string) => {
    setImgLoading(imageId)
    await fetch(`/api/products/${product.id}/images/${imageId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrimary: true }),
    })
    setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === imageId })))
    setImgLoading(null)
  }

  const handleSetVariantColor = async (imageId: string, color: string) => {
    await fetch(`/api/products/${product.id}/images/${imageId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantColor: color }),
    })
    setImages(prev => prev.map(img => img.id === imageId ? { ...img, variantColor: color } : img))
  }

  // ─────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res  = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { error(data.message || "Устгахад алдаа гарлаа."); return }
      onDeleted?.(product.id)
      onClose()
    } catch {
      error("Сүлжээний алдаа гарлаа.")
    } finally {
      setDeleting(false)
    }
  }

  // ─────────────────────────────────────────────
  // Save
  // ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim())       return error("Нэр оруулна уу.")
    if (!description.trim()) return error("Тайлбар оруулна уу.")
    if (!price)              return error("Үнэ оруулна уу.")
    if (discountEnabled) {
      if (!finalPrice)     return error("Хямдарсан үнэ оруулна уу.")
      if (!discountEndsAt) return error("Хямдрал дуусах хугацаа оруулна уу.")
      if (parse(finalPrice) >= parse(price)) return error("Хямдарсан үнэ нь үндсэн үнээс бага байх ёстой.")
    }

    const formData = new FormData()
    formData.append("title",           title.trim())
    formData.append("description",     description.trim())
    formData.append("price",           String(parse(price)))
    formData.append("status",          status)
    formData.append("discountEnabled", String(discountEnabled))
    // sizes/colors already include custom values via allSizeOptions/allColorOptions selection
    formData.append("sizes",           JSON.stringify(sizes))
    formData.append("colors",          JSON.stringify(colors))
    formData.append("categories",      JSON.stringify(selectedCats))
    if (discountEnabled) {
      formData.append("finalPrice",     String(parse(finalPrice)))
      formData.append("discountEndsAt", new Date(discountEndsAt).toISOString())
    }

    try {
      setLoading(true)
      const res  = await fetch(`/api/products/${product.id}`, { method: "PATCH", body: formData })
      const data = await res.json()
      if (!res.ok) { error(data.message || "Алдаа гарлаа."); return }
      success("Амжилттай хадгалагдлаа!")
      setTimeout(() => onSuccess(data.data), 900)
    } catch {
      error("Сүлжээний алдаа гарлаа.")
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <>
      <Sheet open onOpenChange={v => { if (!v) onClose() }}>
        <SheetContent
          side="right"
          className="w-full sm:w-[440px] overflow-y-auto bg-slate-900 text-white border-slate-700"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Бараа засах</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-8">

            {/* ── Name ── */}
            <div className="space-y-2">
              <Label>Нэр</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* ── Description ── */}
            <div className="space-y-2">
              <Label>Тайлбар</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>

            {/* ── Categories ── */}
            <div className="space-y-1">
              <Label>Категори</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCats.map(id => {
                  const cat = categories.find(c => c.id === id)
                  return (
                    <div key={id} className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-md text-sm">
                      {cat?.name}
                      <X onClick={() => toggleChip(id, selectedCats, setSelectedCats)} className="text-red-500 cursor-pointer" size={14} />
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between text-white/40 text-sm"
              >
                Категори нэмэх <ChevronDown size={14} />
              </button>
              {categoryOpen && (
                <div className="border border-slate-700 rounded-lg bg-slate-800 max-h-40 overflow-y-auto p-2 space-y-1">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-700 p-1 rounded">
                      <Checkbox
                        checked={selectedCats.includes(cat.id)}
                        onCheckedChange={() => toggleChip(cat.id, selectedCats, setSelectedCats)}
                      />
                      <span className="text-sm">{getCategoryLabel(cat)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── Sizes ── */}
            <div className="space-y-2">
              <Label>Хэмжээ</Label>

              {/* All chips: predefined + custom */}
              <div className="flex flex-wrap gap-2">
                {allSizeOptions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleChip(s, sizes, setSizes)}
                    className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                      sizes.includes(s)
                        ? "bg-white text-slate-900 border-white"
                        : "bg-slate-800 border-slate-700 text-white/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Inline custom input */}
              {showCustomSize && (
                <InlineCustomInput
                  placeholder="e.g. One Size, 34, 38…"
                  existing={allSizeOptions}
                  onCommit={addCustomSize}
                  onClose={() => setShowCustomSize(false)}
                />
              )}

              {!showCustomSize && (
                <button
                  type="button"
                  onClick={() => setShowCustomSize(true)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                >
                  <Plus size={12} /> Нэмэлтээр хэмжээ нэмэх
                </button>
              )}
            </div>

            {/* ── Colors ── */}
            <div className="space-y-2">
              <Label>Өнгө</Label>

              <div className="flex flex-wrap gap-2">
                {allColorOptions.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChip(c, colors, setColors)}
                    className={`px-3 py-1 rounded-md text-sm border capitalize transition-colors ${
                      colors.includes(c)
                        ? "bg-white text-slate-900 border-white"
                        : "bg-slate-800 border-slate-700 text-white/60"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {showCustomColor && (
                <InlineCustomInput
                  placeholder="e.g. Navy, Coral, Olive…"
                  existing={allColorOptions}
                  onCommit={addCustomColor}
                  onClose={() => setShowCustomColor(false)}
                />
              )}

              {!showCustomColor && (
                <button
                  type="button"
                  onClick={() => setShowCustomColor(true)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                >
                  <Plus size={12} /> Нэмэлтээр өнгө нэмэх
                </button>
              )}
            </div>

            {/* ── Variants ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                {varLoading && <Loader2 size={12} className="animate-spin text-white/40" />}
              </div>
              <p className="text-white/30 text-xs -mt-1">
                Sizes/Colors-оос гадна нэмэлт сонголт. Жишээ: Хамгаалалт → Байгаа, Байхгүй
              </p>

              {variants.length === 0 && (
                <p className="text-white/25 text-xs">Variant байхгүй</p>
              )}

              {variants.map(variant => (
                <div
                  key={variant.id}
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2.5"
                >
                  {/* Label input */}
                  <input
                    value={variant.label}
                    onChange={e => updateVariantLabel(variant.id, e.target.value)}
                    placeholder="Variants нэр (жишээ: Материал, Fit…)"
                    aria-label="Variant label"
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
                  />

                  {/* Value rows */}
                  <div className="space-y-1.5">
                    {variant.values.map((val, vali) => (
                      <div key={vali} className="flex items-center gap-2">
                        <input
                          value={val}
                          onChange={e => updateVariantValue(variant.id, vali, e.target.value)}
                          onBlur={() => flushVariantValue(variant.id)}
                          placeholder={`Утга ${vali + 1}`}
                          aria-label={`${variant.label || "Variant"} value ${vali + 1}`}
                          className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantValue(variant.id, vali)}
                          disabled={variant.values.length === 1}
                          aria-label="Remove value"
                          className="text-white/30 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => addVariantValue(variant.id)}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                    >
                      <Plus size={11} /> Утга нэмэх
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="text-xs text-red-500/70 hover:text-red-500 transition-colors"
                    >
                      Variants устгах
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Variant */}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 w-full justify-center transition-colors"
              >
                <Plus size={12} /> Variants нэмэх
              </button>
            </div>

            {/* ── Price ── */}
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="relative">
                <Input type="text" value={price} onChange={e => setPrice(fmtInp(e.target.value))} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
              </div>
            </div>

            {/* ── Status toggle ── */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <p className="text-white text-sm font-medium">Status</p>
              <button
                type="button"
                onClick={() => setStatus(s => s === "active" ? "inactive" : "active")}
                className={`relative w-12 h-6 rounded-full transition-colors ${status === "active" ? "bg-green-500" : "bg-slate-600"}`}
                aria-pressed={status === "active"}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${status === "active" ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {/* ── Discount toggle ── */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <p className="text-white text-sm font-medium">Хямдрал</p>
              <button
                type="button"
                onClick={() => setDiscountEnabled(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors ${discountEnabled ? "bg-green-500" : "bg-slate-600"}`}
                aria-pressed={discountEnabled}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${discountEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {discountEnabled && (
              <div className="space-y-4 border border-slate-700 p-4 rounded-xl">
                <div className="space-y-2">
                  <Label>Эцсийн үнэ</Label>
                  <div className="relative">
                    <Input type="text" value={finalPrice} onChange={e => setFinalPrice(fmtInp(e.target.value))} placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Хямдрал дуусах огноо</Label>
                  <Input type="datetime-local" value={discountEndsAt} onChange={e => setDiscountEndsAt(e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Image variant color config ── */}
            {images.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-1.5">
                  <ImageIcon size={14} /> Зургийн өнгө тохиргоо
                </Label>
                <p className="text-white/30 text-xs">
                  Зургийн хажууд өнгө сонгоход тэр өнгөний бараа сонгогдоход харагдана
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[...images].sort((a, b) => a.order - b.order).map(img => (
                    <div key={img.id} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl p-2">
                      <img src={img.url} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" alt="" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(img.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                              img.isPrimary
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "text-white/30 hover:text-white/60 border border-transparent hover:border-slate-600"
                            }`}
                          >
                            {imgLoading === img.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Star size={11} className={img.isPrimary ? "fill-amber-400" : ""} />
                            }
                            {img.isPrimary ? "Primary" : "Primary болгох"}
                          </button>
                        </div>
                        <select
                          value={(img as any).variantColor ?? ""}
                          onChange={e => handleSetVariantColor(img.id, e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1 rounded-lg outline-none"
                        >
                          <option value="">— Өнгө холбоогүй —</option>
                          {/* Show all colors including custom ones */}
                          {colors.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Save ── */}
            <Button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-slate-950 hover:bg-slate-800">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Хадгалаж байна...</> : "Хадгалах"}
            </Button>

            {/* ── Delete ── */}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Trash2 size={15} /> Бараа устгах
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                <p className="text-red-300 text-sm text-center">Устгахдаа итгэлтэй байна уу?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-slate-800 text-white/60 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                  >
                    Болих
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : "Устгах"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </SheetContent>
      </Sheet>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}