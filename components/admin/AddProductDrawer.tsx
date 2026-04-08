// 📁 components/admin/AddProductDrawer.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { ChevronDown, X, Loader2, Plus, ImageIcon, Star } from "lucide-react"

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

/** A file the user picked but hasn't uploaded yet */
interface PendingImage {
  /** Unique key for React reconciliation */
  key: string
  file: File
  /** Object URL for preview — revoke on unmount */
  previewUrl: string
}

interface AddProductDrawerProps {
  categories: Category[]
  onSuccess?: () => void
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SIZE_OPTIONS        = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
const COLOR_OPTIONS       = ["Хар", "Цагаан", "Саарал", "Улаан", "Цэнхэр", "Ногоон", "Шар", "Улбар шар", "Ягаан"]
const ACCEPTED_TYPES      = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_FILE_SIZE       = 10 * 1024 * 1024  // 10 MB
const MAX_FILE_SIZE_LABEL = "10 MB"

// ─────────────────────────────────────────────
// GridAddCell — fits inside the image grid as the last cell
// Supports click-to-browse + drag-and-drop
// ─────────────────────────────────────────────
interface GridAddCellProps {
  onFiles:    (files: File[]) => void
  onRejected: (reasons: string[]) => void
  disabled?:  boolean
}

function GridAddCell({ onFiles, onRejected, disabled }: GridAddCellProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback((raw: FileList | null) => {
    if (!raw || raw.length === 0) return
    const valid:    File[]   = []
    const rejected: string[] = []

    Array.from(raw).forEach(f => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        rejected.push(`"${f.name}" — зөвшөөрөгдөөгүй төрөл`)
      } else if (f.size > MAX_FILE_SIZE) {
        rejected.push(`"${f.name}" — ${MAX_FILE_SIZE_LABEL}-аас их`)
      } else {
        valid.push(f)
      }
    })

    if (rejected.length) onRejected(rejected)
    if (valid.length)    onFiles(valid)
  }, [onFiles, onRejected])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    processFiles(e.dataTransfer.files)
  }, [disabled, processFiles])

  return (
    <div
      onDragEnter={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragOver={e  => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={e => { e.preventDefault(); setDragging(false) }}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      aria-label="Зураг нэмэх"
      className={[
        "aspect-square rounded-xl border-2 border-dashed flex flex-col",
        "items-center justify-center gap-1.5 cursor-pointer select-none",
        "transition-all duration-150",
        disabled
          ? "opacity-40 cursor-not-allowed border-slate-700 bg-transparent"
          : dragging
            ? "border-violet-400 bg-violet-500/10"
            : "border-slate-600 bg-slate-800/40 hover:border-slate-400 hover:bg-slate-800/70",
      ].join(" ")}
    >
      <Plus
        size={20}
        strokeWidth={1.8}
        className={dragging ? "text-violet-400" : "text-white/50"}
      />
      <span className="text-[10px] text-white/50 text-center leading-tight px-1">
        Зураг нэмэх
      </span>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={e => { processFiles(e.target.files); e.target.value = "" }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// CustomValueGroup — reusable inline list editor
// ─────────────────────────────────────────────
interface CustomValueGroupProps {
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

      <div className="space-y-1.5">
        {values.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={val}
              onChange={e => updateField(i, e.target.value)}
              placeholder={placeholder}
              aria-label={`${label} value ${i + 1}`}
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 transition-colors placeholder:text-white/20"
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

      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
      >
        <Plus size={12} />
        Нэмэлт утга нэмэх
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
  const [title,           setTitle]           = useState("")
  const [description,     setDescription]     = useState("")
  const [price,           setPrice]           = useState("")
  const [finalPrice,      setFinalPrice]      = useState("")
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountEndsAt,  setDiscountEndsAt]  = useState("")

  // ── Predefined selections ──
  const [sizes,  setSizes]  = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])

  // ── Custom additions ──
  const [customSizes,     setCustomSizes]     = useState<string[]>([])
  const [showCustomSize,  setShowCustomSize]  = useState(false)
  const [customColors,    setCustomColors]    = useState<string[]>([])
  const [showCustomColor, setShowCustomColor] = useState(false)

  // ── Categories / Variants ──
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryOpen,       setCategoryOpen]       = useState(false)
  const [variants,           setVariants]           = useState<Variant[]>([])

  // ── Image state (PendingImage — matches EditProductDrawer pattern) ──
  const [pendingImages,  setPendingImages]  = useState<PendingImage[]>([])
  const [primaryKey,     setPrimaryKey]     = useState<string | null>(null)
  // imageColors: maps color name → pending image key
  const [imageColors,    setImageColors]    = useState<Record<string, string>>({})

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => { pendingImages.forEach(p => URL.revokeObjectURL(p.previewUrl)) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ──
  const allSizes  = [...sizes,  ...customSizes.filter(Boolean)]
  const allColors = [...colors, ...customColors.filter(Boolean)]

  // ─────────────────────────────────────────────
  // Image handlers
  // ─────────────────────────────────────────────
  const handleNewFiles = useCallback((files: File[]) => {
    const newPending: PendingImage[] = files.map(file => ({
      key:        `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPendingImages(prev => {
      const updated = [...prev, ...newPending]
      // Auto-set first image as primary if none set yet
      if (!primaryKey && updated.length > 0) setPrimaryKey(updated[0].key)
      return updated
    })
  }, [primaryKey])

  const handleRejectedFiles = useCallback((reasons: string[]) => {
    const first = reasons[0]
    const extra = reasons.length > 1 ? ` (болон ${reasons.length - 1} файл)` : ""
    error(`${first}${extra}`)
  }, [error])

  const removePendingImage = (key: string) => {
    setPendingImages(prev => {
      const target = prev.find(p => p.key === key)
      if (target) URL.revokeObjectURL(target.previewUrl)
      const updated = prev.filter(p => p.key !== key)
      // If removed image was primary, promote the next one
      if (primaryKey === key) {
        setPrimaryKey(updated.length > 0 ? updated[0].key : null)
      }
      return updated
    })
    // Remove any color mapping pointing to this key
    setImageColors(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(c => { if (next[c] === key) delete next[c] })
      return next
    })
  }

  // ─────────────────────────────────────────────
  // Variant updaters
  // ─────────────────────────────────────────────
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
        i === vi ? { ...v, values: v.values.map((val, j) => j === vali ? text : val) } : v
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

  const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val])

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(""); setFinalPrice("")
    setDiscountEnabled(false); setDiscountEndsAt("")
    setSizes([]); setColors([])
    setCustomSizes([]); setShowCustomSize(false)
    setCustomColors([]); setShowCustomColor(false)
    setSelectedCategories([])
    pendingImages.forEach(p => URL.revokeObjectURL(p.previewUrl))
    setPendingImages([]); setPrimaryKey(null); setImageColors({})
    setVariants([])
  }

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim())                   return error("Барааны нэр оруулна уу.")
    if (!description.trim())             return error("Тайлбар оруулна уу.")
    if (!price)                          return error("Үнэ оруулна уу.")
    if (pendingImages.length === 0)      return error("Дор хаяж 1 зураг оруулна уу.")
    if (selectedCategories.length === 0) return error("Category сонгоно уу.")
    if (discountEnabled) {
      if (!finalPrice)     return error("Хямдарсан үнэ оруулна уу.")
      if (!discountEndsAt) return error("Хямдрал дуусах хугацаа оруулна уу.")
      if (parsePrice(finalPrice) >= parsePrice(price))
        return error("Хямдарсан үнэ нь үндсэн үнээс бага байх ёстой.")
    }

    // Build imageColors as { color: fileIndex } and primaryIndex for the API
    const primaryIndex = pendingImages.findIndex(p => p.key === primaryKey)
    const imageColorsForApi: Record<string, number> = {}
    Object.entries(imageColors).forEach(([color, key]) => {
      const idx = pendingImages.findIndex(p => p.key === key)
      if (idx !== -1) imageColorsForApi[color] = idx
    })

    const formData = new FormData()
    formData.append("title",           title.trim())
    formData.append("description",     description.trim())
    formData.append("price",           String(parsePrice(price)))
    formData.append("discountEnabled", String(discountEnabled))
    formData.append("sizes",           JSON.stringify(allSizes))
    formData.append("colors",          JSON.stringify(allColors))
    formData.append("variants",        JSON.stringify(variants))
    formData.append("categories",      JSON.stringify(selectedCategories))
    formData.append("imageColors",     JSON.stringify(imageColorsForApi))
    formData.append("primaryIndex",    String(primaryIndex >= 0 ? primaryIndex : 0))
    pendingImages.forEach(p => formData.append("images", p.file))
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
        Бараа нэмэх
      </Button>

      <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm() }}>
        <SheetContent
          side="right"
          className="w-full sm:w-[420px] overflow-y-auto bg-slate-900 text-white border-slate-700"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Бараа нэмэх</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-8">

            {/* ── Product Images ── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon size={14} /> Барааны зурагууд
                {pendingImages.length > 0 && (
                  <span className="text-white/30 font-normal text-xs">({pendingImages.length})</span>
                )}
              </Label>

              {/* Image grid — always rendered; GridAddCell is the last slot */}
              <div className="grid grid-cols-3 gap-2">

                {pendingImages.map(p => {
                  const isPrimary = p.key === primaryKey
                  // Find color mapped to this image
                  const mappedColor = Object.entries(imageColors).find(([, k]) => k === p.key)?.[0] ?? ""

                  return (
                    <div
                      key={p.key}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-800"
                    >
                      <img
                        src={p.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      {/* Primary badge — top-left (mobile always visible) */}
                      {isPrimary && (
                        <div className="absolute top-1 left-1 bg-amber-500/90 text-amber-950 text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 pointer-events-none z-10">
                          <Star size={7} className="fill-current" /> Primary
                        </div>
                      )}

                      {/* Mobile X — top-right */}
                      <button
                        type="button"
                        onClick={() => removePendingImage(p.key)}
                        aria-label="Хасах"
                        className="md:hidden absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-white active:opacity-60 z-20"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>

                      {/* Mobile Set primary — top-left (only when not primary) */}
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryKey(p.key)}
                          aria-label="Primary болгох"
                          className="md:hidden absolute top-1 left-1 h-5 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center gap-0.5 px-1.5 text-white text-[9px] font-medium active:opacity-60 z-20"
                        >
                          <Star size={9} /> Set
                        </button>
                      )}

                      {/* Color select — always at bottom-1, never conflicts with badge */}
                      {allColors.length > 0 && (
                        <select
                          value={mappedColor}
                          onChange={e => {
                            const color = e.target.value
                            setImageColors(prev => {
                              const next = { ...prev }
                              // Remove old binding for this image key
                              Object.keys(next).forEach(c => {
                                if (next[c] === p.key) delete next[c]
                              })
                              // Set new binding
                              if (color) next[color] = p.key
                              return next
                            })
                          }}
                          onClick={e => e.stopPropagation()}
                          className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/70 text-white rounded px-1 py-0.5 z-20"
                        >
                          <option value="">Өнгө холбоогүй</option>
                          {allColors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}

                      {/* Desktop hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-1.5">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryKey(p.key)}
                            title="Primary болгох"
                            className="w-7 h-7 bg-white/10 hover:bg-amber-500/80 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Star size={12} className="text-white" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePendingImage(p.key)}
                          title="Хасах"
                          className="w-7 h-7 bg-white/10 hover:bg-red-500/80 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Add cell — always last */}
                <GridAddCell
                  onFiles={handleNewFiles}
                  onRejected={handleRejectedFiles}
                  disabled={loading}
                />
              </div>
            </div>

            {/* ── Name ── */}
            <div className="space-y-2">
              <Label>Нэр</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Барааны нэр" />
            </div>

            {/* ── Description ── */}
            <div className="space-y-2">
              <Label>Тайлбар</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Тайлбар" />
            </div>

            {/* ── Categories ── */}
            <div className="space-y-1">
              <Label>Категори</Label>
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
                Категори нэмэх <ChevronDown size={14} />
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
              <Label>Хэмжээ</Label>
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

              {showCustomSize && (
                <CustomValueGroup
                  label="Нэмэлт хэмжээ"
                  values={customSizes.length > 0 ? customSizes : [""]}
                  onChange={setCustomSizes}
                  onClose={() => { setShowCustomSize(false); setCustomSizes([]) }}
                  placeholder="хэмжээ оруулна уу"
                />
              )}

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
                  <Plus size={12} /> Нэмэлтээр хэмжээ нэмэх
                </button>
              )}
            </div>

            {/* ── Colors ── */}
            <div className="space-y-2">
              <Label>Өнгө</Label>
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

              {showCustomColor && (
                <CustomValueGroup
                  label="Нэмэлт өнгө"
                  values={customColors.length > 0 ? customColors : [""]}
                  onChange={setCustomColors}
                  onClose={() => { setShowCustomColor(false); setCustomColors([]) }}
                  placeholder="өнгө оруулна уу"
                />
              )}

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
                  <Plus size={12} /> Нэмэлтээр өнгө нэмэх
                </button>
              )}
            </div>

            {/* ── Variants ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
              </div>

              {variants.length === 0 && (
                <p className="text-white/25 text-xs">Variants байхгүй</p>
              )}

              {variants.map((variant, vi) => (
                <div
                  key={vi}
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2.5"
                >
                  <input
                    value={variant.label}
                    onChange={e => updateVariantLabel(vi, e.target.value)}
                    placeholder="Variants нэр (жишээ: Материал, Fit…)"
                    aria-label="Variants нэр"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
                  />

                  <div className="space-y-1.5">
                    {variant.values.map((val, vali) => (
                      <div key={vali} className="flex items-center gap-2">
                        <input
                          value={val}
                          onChange={e => updateVariantValue(vi, vali, e.target.value)}
                          placeholder={`Утга ${vali + 1}`}
                          aria-label={`${variant.label || "Variant"} value ${vali + 1}`}
                          className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
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

                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => addVariantValue(vi)}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                    >
                      <Plus size={11} /> Утга нэмэх
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariant(vi)}
                      className="text-xs text-red-500/70 hover:text-red-500 transition-colors"
                    >
                      Variants устгах
                    </button>
                  </div>
                </div>
              ))}

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
              <Label>Үнэ</Label>
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
                className={`relative w-12 h-6 rounded-full transition-colors ${discountEnabled ? "bg-green-500" : "bg-slate-600"}`}
                aria-pressed={discountEnabled}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${discountEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {discountEnabled && (
              <div className="space-y-4 border border-slate-700 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label>Эцсийн үнэ</Label>
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
                  <Label>Хямдрал дуусах огноо</Label>
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
                ? <><Loader2 className="animate-spin mr-2" size={16} />Нэмж байна...</>
                : "Бараа нэмэх"
              }
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}