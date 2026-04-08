// 📁 components/admin/EditProductDrawer.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import {
  ChevronDown, X, Loader2, Trash2, Star,
  ImageIcon, Plus, Upload, AlertCircle,
} from "lucide-react"
import { Product, VariantOption } from "@/components/admin/ProductDetailModal"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Category {
  id: string
  name: string
  parentId: string | null
}

type Variant = {
  id: string
  label: string
  values: string[]
  order: number
}

/** Represents a committed image already in the DB */
interface ExistingImage {
  id: string
  url: string
  isPrimary: boolean
  order: number
  variantColor?: string | null
}

/** A file the user picked but hasn't uploaded yet */
interface PendingImage {
  /** Unique key for React reconciliation */
  key: string
  file: File
  /** Object URL for preview — revoke on unmount */
  previewUrl: string
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
const ACCEPTED_TYPES      = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_FILE_SIZE       = 10 * 1024 * 1024  // 10 MB
const MAX_FILE_SIZE_LABEL = "10 MB"

// ─────────────────────────────────────────────
// InlineCustomInput
// ─────────────────────────────────────────────
interface InlineCustomInputProps {
  placeholder: string
  existing: string[]
  onCommit: (value: string) => void
  onClose: () => void
}

function InlineCustomInput({ placeholder, existing, onCommit, onClose }: InlineCustomInputProps) {
  const [val, setVal] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus() }, [])

  const commit = () => {
    const trimmed = val.trim()
    if (trimmed && !existing.includes(trimmed)) onCommit(trimmed)
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
        onMouseDown={e => e.preventDefault()}
        onClick={onClose}
        className="text-white/30 hover:text-white/60 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// GridAddCell — fits inside the image grid as the last cell
// Supports click-to-browse + drag-and-drop
// Validates file type and size; calls onRejected for bad files
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
    // aspect-square matches sibling image cells in the same grid
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
// Main Component
// ─────────────────────────────────────────────
export default function EditProductDrawer({
  product,
  categories,
  onClose,
  onSuccess,
  onDeleted,
}: Props) {
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

  // ── Sizes / Colors ──
  const [sizes,           setSizes]           = useState<string[]>(product.sizes)
  const [customSizes,     setCustomSizes]     = useState<string[]>(product.sizes.filter(s => !SIZE_OPTIONS.includes(s)))
  const [showCustomSize,  setShowCustomSize]  = useState(false)
  const [colors,          setColors]          = useState<string[]>(product.colors)
  const [customColors,    setCustomColors]    = useState<string[]>(product.colors.filter(c => !COLOR_OPTIONS.includes(c)))
  const [showCustomColor, setShowCustomColor] = useState(false)

  const allSizeOptions  = [...SIZE_OPTIONS,  ...customSizes.filter(s => !SIZE_OPTIONS.includes(s))]
  const allColorOptions = [...COLOR_OPTIONS, ...customColors.filter(c => !COLOR_OPTIONS.includes(c))]

  // ── Categories ──
  const [selectedCats, setSelectedCats] = useState<string[]>(product.categories.map(c => c.category.id))
  const [categoryOpen, setCategoryOpen] = useState(false)

  // ── UI state ──
  const [loading,       setLoading]       = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgLoading,    setImgLoading]    = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)

  // ── Image state ──
  const [existingImages,  setExistingImages]  = useState<ExistingImage[]>(
    (product.images ?? []).map(img => ({
      id:           img.id,
      url:          img.url,
      isPrimary:    img.isPrimary,
      order:        img.order,
      variantColor: (img as any).variantColor ?? null,
    }))
  )
  const [removedImageIds, setRemovedImageIds] = useState<Set<string>>(new Set())
  const [pendingImages,   setPendingImages]   = useState<PendingImage[]>([])

  // ── Variants ──
  const [variants,   setVariants]   = useState<Variant[]>([])
  const [varLoading, setVarLoading] = useState(false)

  // Revoke object URLs when pending images change or on unmount
  useEffect(() => {
    return () => { pendingImages.forEach(p => URL.revokeObjectURL(p.previewUrl)) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch existing variants on mount
  useEffect(() => {
    fetch(`/api/products/${product.id}/variants`)
      .then(r => r.json())
      .then(d => setVariants(d.data ?? []))
  }, [product.id])

  useEffect(() => {
    setExistingImages(
      (product.images ?? []).map(img => ({
        id:           img.id,
        url:          img.url,
        isPrimary:    img.isPrimary,
        order:        img.order,
        variantColor: (img as any).variantColor ?? null,
      }))
    )
  }, [product.id])

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
    setVariants(prev =>
      prev.map(v =>
        v.id === id ? { ...v, values: v.values.map((val, j) => j === vali ? text : val) } : v
      )
    )
  }

  const flushVariantValue = () => { saveVariants(variants) }

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
    if (!sizes.includes(val)) setSizes(prev => [...prev, val])
  }

  const addCustomColor = (val: string) => {
    if (!customColors.includes(val)) setCustomColors(prev => [...prev, val])
    if (!colors.includes(val)) setColors(prev => [...prev, val])
  }

  const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val])

  // ─────────────────────────────────────────────
  // Image — existing
  // ─────────────────────────────────────────────
  const handleSetPrimary = async (imageId: string) => {
    // Optimistic: flip isPrimary AND bubble the chosen image to position 0
    // so the grid reorders instantly (critical for mobile UX).
    setExistingImages(prev => {
      const target = prev.find(img => img.id === imageId)
      if (!target) return prev
      const others = prev.filter(img => img.id !== imageId)
      return [
        { ...target, isPrimary: true, order: 0 },
        ...others.map((img, i) => ({ ...img, isPrimary: false, order: i + 1 })),
      ]
    })

    setImgLoading(imageId)
    try {
      await fetch(`/api/products/${product.id}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      })
    } catch {
      // Rollback: restore original isPrimary state from server on next load
      setExistingImages(prev =>
        prev.map(img => ({ ...img, isPrimary: img.id === imageId ? false : img.isPrimary }))
      )
    } finally {
      setImgLoading(null)
    }
  }

  const handleSetVariantColor = async (imageId: string, color: string) => {
    await fetch(`/api/products/${product.id}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantColor: color || null }),
    })
    setExistingImages(prev =>
      prev.map(img => img.id === imageId ? { ...img, variantColor: color || null } : img)
    )
  }

  /** Optimistic delete: hide immediately, confirm with API */
  const handleDeleteExistingImage = async (imageId: string) => {
    // Optimistic: remove from visible list
    setRemovedImageIds(prev => new Set([...prev, imageId]))

    try {
      const res = await fetch(`/api/products/${product.id}/images/${imageId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        // Rollback
        setRemovedImageIds(prev => {
          const next = new Set(prev)
          next.delete(imageId)
          return next
        })
        error("Зураг устгахад алдаа гарлаа.")
      }
    } catch {
      // Rollback
      setRemovedImageIds(prev => {
        const next = new Set(prev)
        next.delete(imageId)
        return next
      })
      error("Сүлжээний алдаа гарлаа.")
    }
  }

  // ─────────────────────────────────────────────
  // Image — pending (new)
  // ─────────────────────────────────────────────
  const handleNewFiles = useCallback((files: File[]) => {
    const newPending: PendingImage[] = files.map(file => ({
      key:        `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPendingImages(prev => [...prev, ...newPending])
  }, [])

  const handleRejectedFiles = useCallback((reasons: string[]) => {
    // Show the first rejection reason; if multiple files were rejected, note the count
    const first = reasons[0]
    const extra = reasons.length > 1 ? ` (болон ${reasons.length - 1} файл)` : ""
    error(`${first}${extra}`)
  }, [error])

  const removePendingImage = (key: string) => {
    setPendingImages(prev => {
      const target = prev.find(p => p.key === key)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter(p => p.key !== key)
    })
  }

  // ─────────────────────────────────────────────
  // Upload pending images → POST /api/products/[id]/images
  // Sends all files in one multipart request (matches existing API route).
  // Returns array of { url, publicId } objects from the server.
  // ─────────────────────────────────────────────
  const uploadPendingImages = async (): Promise<ExistingImage[]> => {
    if (pendingImages.length === 0) return []

    // Re-validate on the way out — belt-and-suspenders
    const valid = pendingImages.filter(
      p => ACCEPTED_TYPES.includes(p.file.type) && p.file.size <= MAX_FILE_SIZE
    )
    if (valid.length === 0) return []

    const fd = new FormData()
    valid.forEach(p => fd.append("images", p.file))

    const res = await fetch(`/api/products/${product.id}/images`, {
      method: "POST",
      body:   fd,
    })

    // Parse the body regardless of status so we can surface the server message
    const body = await res.json().catch(() => ({ message: "Серверийн хариу уншихад алдаа." }))

    if (!res.ok) {
      throw new Error(body.message || "Зураг оруулахад алдаа гарлаа.")
    }

    // The existing route returns { ok: true, data: { count } } via prisma.createMany
    // which doesn't return rows. Re-fetch the image list to get fresh data.
    const listRes = await fetch(`/api/products/${product.id}/images`)
    if (!listRes.ok) return []
    const listBody = await listRes.json().catch(() => ({ data: [] }))
    const allImages: ExistingImage[] = (listBody.data ?? []).map((img: any) => ({
      id:           img.id,
      url:          img.url,
      isPrimary:    img.isPrimary,
      order:        img.order,
      variantColor: img.variantColor ?? null,
    }))
    return allImages
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

    setLoading(true)
    try {
      // ── Step 1: upload pending images ──────────────────────────────
      // Done BEFORE the product PATCH so we never send dangling references.
      if (pendingImages.length > 0) {
        setUploading(true)
        try {
          const freshImages = await uploadPendingImages()
          // Replace local state with the authoritative server list so the
          // grid reflects real DB ids (important for subsequent edits).
          if (freshImages.length > 0) {
            setExistingImages(freshImages)
            setRemovedImageIds(new Set()) // already handled server-side
          }
          setPendingImages([])
        } catch (uploadErr: any) {
          // Surface the error but do NOT abort the product field save —
          // the user should still be able to save text changes.
          error(uploadErr.message || "Зураг оруулахад алдаа гарлаа.")
          // Fall through intentionally: save product fields anyway
        } finally {
          setUploading(false)
        }
      }

      // ── Step 2: patch core product fields ──────────────────────────
      const formData = new FormData()
      formData.append("title",           title.trim())
      formData.append("description",     description.trim())
      formData.append("price",           String(parse(price)))
      formData.append("status",          status)
      formData.append("discountEnabled", String(discountEnabled))
      formData.append("sizes",           JSON.stringify(sizes))
      formData.append("colors",          JSON.stringify(colors))
      formData.append("categories",      JSON.stringify(selectedCats))
      if (discountEnabled) {
        formData.append("finalPrice",     String(parse(finalPrice)))
        formData.append("discountEndsAt", new Date(discountEndsAt).toISOString())
      }

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
  // Derived
  // ─────────────────────────────────────────────
  const visibleExisting  = existingImages.filter(img => !removedImageIds.has(img.id))
  const totalImageCount  = visibleExisting.length + pendingImages.length
  const isBusy           = loading || uploading

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
            {/* Product Images */}
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon size={14} /> Зурагнууд
                  {totalImageCount > 0 && (
                    <span className="text-white/30 font-normal text-xs">({totalImageCount})</span>
                  )}
                </Label>
                {uploading && (
                  <div className="flex items-center gap-1.5 text-xs text-violet-400">
                    <Loader2 size={11} className="animate-spin" />
                    Оруулж байна…
                  </div>
                )}
              </div>

              {/* ── Image grid — always rendered; GridAddCell is the last slot ── */}
              <div className="grid grid-cols-3 gap-2">

                {/* ── Existing images ── */}
                {visibleExisting
                  .sort((a, b) => a.order - b.order)
                  .map(img => (
                    <div
                      key={img.id}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-800"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      {/* ── Primary badge: top-left, always visible ── */}
                      {img.isPrimary && (
                        <div className="absolute bottom-1 left-1 bg-amber-500/90 text-amber-950 text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 pointer-events-none z-10">
                          <Star size={7} className="fill-current" /> Primary
                        </div>
                      )}

                      {/* ════════════════════════════════════════
                          MOBILE — always-visible corner buttons
                          (md:hidden = only below 768 px)
                      ════════════════════════════════════════ */}

                      {/* Mobile X — top-right */}
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        aria-label="Зураг устгах"
                        className="md:hidden absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-white active:opacity-60 z-20"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>

                      {/* Mobile Set — bottom-left (avoids badge overlap) */}
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          disabled={imgLoading === img.id}
                          aria-label="Primary болгох"
                          className="md:hidden absolute bottom-1 left-1 h-5 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center gap-0.5 px-1.5 text-white text-[9px] font-medium active:opacity-60 disabled:opacity-40 z-20"
                        >
                          {imgLoading === img.id
                            ? <Loader2 size={9} className="animate-spin" />
                            : <Star size={9} />
                          }
                          Set
                        </button>
                      )}

                      {/* ════════════════════════════════════════
                          DESKTOP — hover overlay
                          (hidden md:flex = invisible on mobile)
                      ════════════════════════════════════════ */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-1.5">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(img.id)}
                            disabled={imgLoading === img.id}
                            title="Primary болгох"
                            className="w-7 h-7 bg-white/10 hover:bg-amber-500/80 rounded-lg flex items-center justify-center transition-colors"
                          >
                            {imgLoading === img.id
                              ? <Loader2 size={12} className="animate-spin text-white" />
                              : <Star size={12} className="text-white" />
                            }
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img.id)}
                          title="Зураг устгах"
                          className="w-7 h-7 bg-white/10 hover:bg-red-500/80 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))
                }

                {/* ── Pending (new, not yet uploaded) images ── */}
                {pendingImages.map(p => (
                  <div
                    key={p.key}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-violet-500/40 bg-slate-800"
                  >
                    <img
                      src={p.previewUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-80"
                    />

                    {/* "Шинэ" badge — top-left */}
                    <div className="absolute top-1 left-1 bg-violet-500/90 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md pointer-events-none z-10">
                      Шинэ
                    </div>

                    {/* Mobile X — top-right */}
                    <button
                      type="button"
                      onClick={() => removePendingImage(p.key)}
                      aria-label="Хасах"
                      className="md:hidden absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 backdrop-blur-sm flex items-center justify-center text-white active:opacity-60 z-20"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>

                    {/* Desktop hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
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
                ))}

                {/* ── Add cell — always last in the grid ── */}
                <GridAddCell
                  onFiles={handleNewFiles}
                  onRejected={handleRejectedFiles}
                  disabled={isBusy}/>
              </div>
              {/* Product Images End */}

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
                      {cat ? getCategoryLabel(cat) : ""}
                      <X onClick={() => toggleChip(id, selectedCats, setSelectedCats)} className="text-red-500/90 cursor-pointer" size={14} />
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
                  <input
                    value={variant.label}
                    onChange={e => updateVariantLabel(variant.id, e.target.value)}
                    placeholder="Variants нэр (жишээ: Материал, Fit…)"
                    aria-label="Variant label"
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-slate-400 placeholder:text-white/20 transition-colors"
                  />
                  <div className="space-y-1.5">
                    {variant.values.map((val, vali) => (
                      <div key={vali} className="flex items-center gap-2">
                        <input
                          value={val}
                          onChange={e => updateVariantValue(variant.id, vali, e.target.value)}
                          onBlur={flushVariantValue}
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

            {/* ══════════════════════════════════════════════
                IMAGE MANAGEMENT SECTION
            ══════════════════════════════════════════════ */}
            <div className="space-y-3">
              {/* ── Variant color config (only for visible existing images) ── */}
              {visibleExisting.length > 0 && colors.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-white/40 text-xs">
                    Зургийн өнгө холбоо — тэр өнгө сонгогдоход зураг харагдана
                  </p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {visibleExisting.sort((a, b) => a.order - b.order).map(img => (
                      <div
                        key={img.id}
                        className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl p-2"
                      >
                        <img src={img.url} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" alt="" />
                        <select
                          value={img.variantColor ?? ""}
                          onChange={e => handleSetVariantColor(img.id, e.target.value)}
                          className="flex-1 bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1 rounded-lg outline-none"
                        >
                          <option value="">— Өнгө холбоогүй —</option>
                          {colors.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* ══ end image section ══ */}

            {/* ── Save ── */}
            <Button
              onClick={handleSubmit}
              disabled={isBusy}
              className="w-full py-5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50"
            >
              {uploading
                ? <><Loader2 className="animate-spin mr-2" size={16} />Зураг оруулж байна…</>
                : loading
                  ? <><Loader2 className="animate-spin mr-2" size={16} />Хадгалаж байна…</>
                  : "Хадгалах"
              }
            </Button>

            {/* ── Delete product ── */}
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