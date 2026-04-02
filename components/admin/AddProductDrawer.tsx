// 📁 components/admin/AddProductDrawer.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { ChevronDown, X, Loader2, Plus } from "lucide-react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Category {
  id: string
  name: string
  parentId: string | null
}

type Variant = {
  label: string
  values: string[]
}

interface AddProductDrawerProps {
  categories: Category[]
  onSuccess?: () => void
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SIZE_OPTIONS  = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
const COLOR_OPTIONS = ["Хар", "Цагаан", "Саарал", "Улаан", "Цэнхэр", "Ногоон", "Шар", "Улбар шар", "Ягаан"]

// ─────────────────────────────────────────────
// CustomValueGroup — reusable inline list editor
// ─────────────────────────────────────────────
interface CustomValueGroupProps {
  /** "Custom Size" or "Custom Color" */
  label: string
  values: string[]
  onChange: (values: string[]) => void
  onClose: () => void
  placeholder?: string
}

function CustomValueGroup({
  label,
  values,
  onChange,
  onClose,
  placeholder = "Enter value",
}: CustomValueGroupProps) {
  const addField    = () => onChange([...values, ""])
  const removeField = (i: number) => onChange(values.filter((_, idx) => idx !== i))
  const updateField = (i: number, val: string) =>
    onChange(values.map((v, idx) => (idx === i ? val : v)))

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{label}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-white/30 hover:text-red-400 transition-colors"
          aria-label={`Remove ${label} group`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Input rows */}
      <div className="space-y-1.5">
        {values.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={val}
              onChange={e => updateField(i, e.target.value)}
              placeholder={placeholder}
              aria-label={`${label} value ${i + 1}`}
              className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 transition-colors placeholder:text-white/20"
            />
            <button
              type="button"
              onClick={() => removeField(i)}
              disabled={values.length === 1}
              aria-label="Remove value"
              className="text-white/30 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add another */}
      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
      >
        <Plus size={12} />
        Add another
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Drawer
// ─────────────────────────────────────────────
export default function AddProductDrawer({ categories, onSuccess }: AddProductDrawerProps) {
  const { toasts, remove, success, error } = useToast()

  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Core fields ──
  const [title,       setTitle]       = useState("")
  const [description, setDescription] = useState("")
  const [price,       setPrice]       = useState("")
  const [finalPrice,  setFinalPrice]  = useState("")
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountEndsAt,  setDiscountEndsAt]  = useState("")

  // ── Predefined selections ──
  const [sizes,       setSizes]       = useState<string[]>([])
  const [colors,      setColors]      = useState<string[]>([])

  // ── Custom additions ──
  const [customSizes,  setCustomSizes]  = useState<string[]>([])
  const [showCustomSize,  setShowCustomSize]  = useState(false)
  const [customColors, setCustomColors] = useState<string[]>([])
  const [showCustomColor, setShowCustomColor] = useState(false)

  // ── Categories / Images / Variants ──
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [images,     setImages]     = useState<File[]>([])
  const [variants,   setVariants]   = useState<Variant[]>([])
  const [imageColors, setImageColors] = useState<{ [color: string]: number }>({})
  const [primaryIndex, setPrimaryIndex] = useState(0)

  // ── Derived: merged arrays for submission ──
  const allSizes  = [...sizes,  ...customSizes.filter(Boolean)]
  const allColors = [...colors, ...customColors.filter(Boolean)]

  useEffect(() => {
    const color = allColors.find(c => imageColors[c] !== undefined)
    if (color) setPrimaryIndex(imageColors[color])
  }, [imageColors, allColors])

  // ── Variant updaters ──
  const addVariant = () =>
    setVariants(prev => [...prev, { label: "", values: [""] }])

  const removeVariant = (vi: number) =>
    setVariants(prev => prev.filter((_, i) => i !== vi))

  const updateVariantLabel = (vi: number, label: string) =>
    setVariants(prev => prev.map((v, i) => i === vi ? { ...v, label } : v))

  const addVariantValue = (vi: number) =>
    setVariants(prev => prev.map((v, i) => i === vi ? { ...v, values: [...v.values, ""] } : v))

  const updateVariantValue = (vi: number, vali: number, text: string) =>
    setVariants(prev =>
      prev.map((v, i) =>
        i === vi
          ? { ...v, values: v.values.map((val, j) => j === vali ? text : val) }
          : v
      )
    )

  const removeVariantValue = (vi: number, vali: number) =>
    setVariants(prev =>
      prev.map((v, i) =>
        i === vi ? { ...v, values: v.values.filter((_, j) => j !== vali) } : v
      )
    )

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const getCategoryLabel = (cat: Category): string => {
    const names: string[] = []
    let current: Category | undefined = cat
    while (current) {
      names.unshift(current.name)
      current = categories.find(c => c.id === current!.parentId)
    }
    return names.join(" / ")
  }

  const formatPrice = (val: string) => {
    const num = val.replace(/\D/g, "")
    return num ? new Intl.NumberFormat("mn-MN").format(Number(num)) : ""
  }
  const parsePrice = (val: string) => Number(val.replace(/\D/g, ""))

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )

  const toggleChip = (
    val: string,
    list: string[],
    setter: (v: string[]) => void
  ) => setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setImages(prev => [...prev, ...Array.from(e.target.files!)])
  }

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(""); setFinalPrice("")
    setDiscountEnabled(false); setDiscountEndsAt("")
    setSizes([]); setColors([])
    setCustomSizes([]); setShowCustomSize(false)
    setCustomColors([]); setShowCustomColor(false)
    setSelectedCategories([]); setImages([])
    setVariants([]); setImageColors({}); setPrimaryIndex(0)
  }

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim())                   return error("Барааны нэр оруулна уу.")
    if (!description.trim())             return error("Тайлбар оруулна уу.")
    if (!price)                          return error("Үнэ оруулна уу.")
    if (images.length === 0)             return error("Дор хаяж 1 зураг оруулна уу.")
    if (selectedCategories.length === 0) return error("Category сонгоно уу.")
    if (discountEnabled) {
      if (!finalPrice)     return error("Хямдарсан үнэ оруулна уу.")
      if (!discountEndsAt) return error("Хямдрал дуусах хугацаа оруулна уу.")
      if (parsePrice(finalPrice) >= parsePrice(price))
        return error("Хямдарсан үнэ нь үндсэн үнээс бага байх ёстой.")
    }

    const formData = new FormData()
    formData.append("title",           title.trim())
    formData.append("description",     description.trim())
    formData.append("price",           String(parsePrice(price)))
    formData.append("discountEnabled", String(discountEnabled))
    // Merge predefined + custom before sending
    formData.append("sizes",           JSON.stringify(allSizes))
    formData.append("colors",          JSON.stringify(allColors))
    formData.append("variants",        JSON.stringify(variants))
    formData.append("categories",      JSON.stringify(selectedCategories))
    formData.append("imageColors",     JSON.stringify(imageColors))
    formData.append("primaryIndex",    String(primaryIndex))
    images.forEach(img => formData.append("images", img))
    if (discountEnabled) {
      formData.append("finalPrice",     String(parsePrice(finalPrice)))
      formData.append("discountEndsAt", new Date(discountEndsAt).toISOString())
    }

    try {
      setLoading(true)
      const res  = await fetch("/api/products", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      success("Бараа амжилттай нэмэгдлээ! 🎉")
      setTimeout(() => { resetForm(); setOpen(false); onSuccess?.() }, 1200)
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
      <Button onClick={() => setOpen(true)} className="rounded-sm bg-white/90 text-slate-900">
        Add Product
      </Button>

      <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm() }}>
        <SheetContent
          side="right"
          className="w-full sm:w-[420px] overflow-y-auto bg-slate-900 text-white border-slate-700"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Add Product</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-8">

            {/* ── Images ── */}
            <div className="space-y-2">
              <Label>Images</Label>
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800">
                <span className="text-sm text-white/40">Click to upload images</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative rounded-md overflow-hidden border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPrimaryIndex(i)}
                        className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded z-10 ${
                          primaryIndex === i ? "bg-amber-500 text-white" : "bg-black/60 text-white/60"
                        }`}
                      >
                        {primaryIndex === i ? "Primary" : "Set"}
                      </button>
                      <img src={URL.createObjectURL(img)} className="w-full h-24 object-cover" alt="" />
                      {allColors.length > 0 && (
                        <select
                          value={Object.entries(imageColors).find(([, idx]) => idx === i)?.[0] ?? ""}
                          onChange={e => {
                            const color = e.target.value
                            if (!color) return
                            setImageColors(prev => ({ ...prev, [color]: i }))
                          }}
                          className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/70 text-white rounded px-1 py-0.5"
                        >
                          <option value="">No color</option>
                          {allColors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                      <X
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded cursor-pointer"
                        size={18}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Name ── */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product name" />
            </div>

            {/* ── Description ── */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
            </div>

            {/* ── Categories ── */}
            <div className="space-y-1">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(id => {
                  const cat = categories.find(c => c.id === id)
                  return (
                    <div key={id} className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-md text-sm">
                      {cat ? getCategoryLabel(cat) : ""}
                      <X onClick={() => toggleCategory(id)} className="text-red-500 cursor-pointer" size={14} />
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between text-white/40 text-sm"
              >
                Add category <ChevronDown size={14} />
              </button>
              {categoryOpen && (
                <div className="border border-slate-700 rounded-lg bg-slate-800 max-h-40 overflow-y-auto p-2 space-y-1">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-700 p-1 rounded">
                      <Checkbox checked={selectedCategories.includes(cat.id)} onCheckedChange={() => toggleCategory(cat.id)} />
                      <span className="text-sm">{getCategoryLabel(cat)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── Sizes ── */}
            <div className="space-y-2">
              <Label>Sizes</Label>

              {/* Predefined chips */}
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map(s => (
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

              {/* Custom size group */}
              {showCustomSize && (
                <CustomValueGroup
                  label="Custom Size"
                  values={customSizes.length > 0 ? customSizes : [""]}
                  onChange={setCustomSizes}
                  onClose={() => { setShowCustomSize(false); setCustomSizes([]) }}
                  placeholder="e.g. One Size, 34, 38…"
                />
              )}

              {/* Chips for entered custom sizes */}
              {customSizes.filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customSizes.filter(Boolean).map((s, i) => (
                    <span key={i} className="flex items-center gap-1 bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 text-xs px-2.5 py-1 rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {!showCustomSize && (
                <button
                  type="button"
                  onClick={() => { setShowCustomSize(true); setCustomSizes([""]) }}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                >
                  <Plus size={12} />
                  Add Custom Size
                </button>
              )}
            </div>

            {/* ── Colors ── */}
            <div className="space-y-2">
              <Label>Colors</Label>

              {/* Predefined chips */}
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
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

              {/* Custom color group */}
              {showCustomColor && (
                <CustomValueGroup
                  label="Custom Color"
                  values={customColors.length > 0 ? customColors : [""]}
                  onChange={setCustomColors}
                  onClose={() => { setShowCustomColor(false); setCustomColors([]) }}
                  placeholder="e.g. Navy, Coral, Olive…"
                />
              )}

              {/* Chips for entered custom colors */}
              {customColors.filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customColors.filter(Boolean).map((c, i) => (
                    <span key={i} className="flex items-center gap-1 bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 text-xs px-2.5 py-1 rounded-md capitalize">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {!showCustomColor && (
                <button
                  type="button"
                  onClick={() => { setShowCustomColor(true); setCustomColors([""]) }}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                >
                  <Plus size={12} />
                  Add Custom Color
                </button>
              )}
            </div>

            {/* ── Variants ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
              </div>

              {variants.length === 0 && (
                <p className="text-white/25 text-xs">Variant байхгүй</p>
              )}

              {variants.map((variant, vi) => (
                <div
                  key={vi}
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2.5"
                >
                  {/* Label input */}
                  <input
                    value={variant.label}
                    onChange={e => updateVariantLabel(vi, e.target.value)}
                    placeholder="Variant label (e.g. Material, Fit…)"
                    aria-label="Variant label"
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
                  />

                  {/* Value rows */}
                  <div className="space-y-1.5">
                    {variant.values.map((val, vali) => (
                      <div key={vali} className="flex items-center gap-2">
                        <input
                          value={val}
                          onChange={e => updateVariantValue(vi, vali, e.target.value)}
                          placeholder={`Value ${vali + 1}`}
                          aria-label={`${variant.label || "Variant"} value ${vali + 1}`}
                          className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantValue(vi, vali)}
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
                      onClick={() => addVariantValue(vi)}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                    >
                      <Plus size={11} />
                      Add Value
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(vi)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Remove Variant
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Variant button — always visible at the bottom */}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 w-full justify-center transition-colors"
              >
                <Plus size={12} />
                Add Variant
              </button>
            </div>

            {/* ── Price ── */}
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={price}
                  onChange={e => setPrice(formatPrice(e.target.value))}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
              </div>
            </div>

            {/* ── Discount toggle ── */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <div>
                <p className="text-white text-sm font-medium">Discount</p>
                <p className="text-white/40 text-xs mt-0.5">Хямдрал идэвхжүүлэх</p>
              </div>
              <button
                type="button"
                onClick={() => setDiscountEnabled(p => !p)}
                className={`relative w-12 h-6 rounded-full transition-colors ${discountEnabled ? "bg-blue-500" : "bg-slate-600"}`}
                aria-pressed={discountEnabled}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${discountEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {discountEnabled && (
              <div className="space-y-4 border border-slate-700 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label>Final Price</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={finalPrice}
                      onChange={e => setFinalPrice(formatPrice(e.target.value))}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discount Ends At</Label>
                  <Input
                    type="datetime-local"
                    value={discountEndsAt}
                    onChange={e => setDiscountEndsAt(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 py-5 bg-slate-950 hover:bg-slate-800"
            >
              {loading
                ? <><Loader2 className="animate-spin mr-2" size={16} />Uploading...</>
                : "Submit"
              }
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}