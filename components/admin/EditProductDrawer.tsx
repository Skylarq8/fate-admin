// 📁 components/admin/EditProductDrawer.tsx
"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { ChevronDown, X, Loader2, Trash2, Star, ImageIcon, Plus, GripVertical } from "lucide-react"
import { Product, VariantOption } from "@/components/admin/ProductDetailModal"

interface Category { id: string; name: string }
interface Props {
  product: Product
  categories: Category[]
  onClose: () => void
  onSuccess: (updated: Product) => void
  onDeleted?: (id: string) => void
}

const SIZE_OPTIONS  = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]
const COLOR_OPTIONS = ["Хар", "Цагаан", "Саарал", "Улаан", "Цэнхэр", "Ногоон", "Шар", "Улбар шар", "Ягаан"]


export default function EditProductDrawer({ product, categories, onClose, onSuccess, onDeleted }: Props) {
  const { toasts, remove, success, error } = useToast()

  const fmt    = (n: number) => new Intl.NumberFormat("mn-MN").format(n)
  const parse  = (s: string) => Number(s.replace(/\D/g, ""))
  const fmtInp = (s: string) => { const n = s.replace(/\D/g, ""); return n ? new Intl.NumberFormat("mn-MN").format(Number(n)) : "" }

  const [title,           setTitle]           = useState(product.title)
  const [description,     setDescription]     = useState(product.description)
  const [price,           setPrice]           = useState(fmt(product.price))
  const [finalPrice,      setFinalPrice]      = useState(product.finalPrice ? fmt(product.finalPrice) : "")
  const [discountEnabled, setDiscountEnabled] = useState(product.discountEnabled)
  const [discountEndsAt,  setDiscountEndsAt]  = useState(
    product.discountEndsAt ? new Date(product.discountEndsAt).toISOString().slice(0, 16) : ""
  )
  const [status,        setStatus]        = useState<"active" | "inactive">(product.status)
  const [sizes,         setSizes]         = useState<string[]>(product.sizes)
  const [colors,        setColors]        = useState<string[]>(product.colors)
  const [selectedCats,  setSelectedCats]  = useState<string[]>(product.categories.map(c => c.category.id))
  const [categoryOpen,  setCategoryOpen]  = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [images,        setImages]        = useState(product.images ?? [])
  const [variants,      setVariants]      = useState<VariantOption[]>(product.variants ?? [])
  const [varLoading,    setVarLoading]    = useState(false)
  const [variantInputs, setVariantInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    // variants татах
    fetch(`/api/products/${product.id}/variants`)
      .then(r => r.json())
      .then(d => setVariants(d.data ?? []))
  }, [product.id])

  useEffect(() => {
    const map: Record<string, string> = {}
    variants.forEach(v => {
      map[v.id] = v.values.join(", ")
    })
    setVariantInputs(map)
  }, [variants])

  const saveVariants = async (newVariants: VariantOption[]) => {
    setVarLoading(true)
    await fetch(`/api/products/${product.id}/variants`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variants: newVariants }),
    })
    success("Variants амжилттай хадгалагдлаа!")
    setVarLoading(false)
  }

  const addVariant = () => {
    const newV = {
      id: `temp-${Date.now()}`,
      label: "",
      values: [],
      order: variants.length
    }
    const newVariants = [...variants, newV]
    setVariants(newVariants)
    saveVariants(newVariants) // 🔥 нэм
  }

  const updateVariantLabel = (id: string, label: string) => {
    const newVariants = variants.map(v =>
      v.id === id ? { ...v, label } : v
    )
    setVariants(newVariants)
    saveVariants(newVariants) // 🔥 нэм
  }

  const updateVariantValues = (id: string, raw: string) => {
    const values = raw.split(",").map(s => s.trim()).filter(Boolean)
    const newVariants = variants.map(v =>
      v.id === id ? { ...v, values } : v
    )
    setVariants(newVariants)
    saveVariants(newVariants) // 🔥 нэм
  }

  const removeVariant = (id: string) => {
    const newV = variants.filter(v => v.id !== id)
    setVariants(newV)
    saveVariants(newV)
  }
  const [imgLoading,    setImgLoading]    = useState<string | null>(null)

  useEffect(() => { setImages(product.images ?? []) }, [product.id])

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

  const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val])

  // ── Delete ────────────────────────────────────────────────────────────────
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

  // ── Save ──────────────────────────────────────────────────────────────────
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
    formData.append("sizes",           JSON.stringify(sizes))
    formData.append("colors",          JSON.stringify(colors))
    formData.append("categories",      JSON.stringify(selectedCats))
    if (discountEnabled) {
      formData.append("finalPrice",    String(parse(finalPrice)))
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

  return (
    <>
      <Sheet open onOpenChange={v => { if (!v) onClose() }}>
        <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto bg-slate-900 text-white border-slate-700"
          onOpenAutoFocus={e => e.preventDefault()}>
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Edit Product</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-8">

            {/* Name */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>

            {/* Categories */}
            <div className="space-y-1">
              <Label>Category</Label>
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
              <button type="button" onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between text-white/40 text-sm">
                Add category <ChevronDown size={14} />
              </button>
              {categoryOpen && (
                <div className="border border-slate-700 rounded-lg bg-slate-800 max-h-40 overflow-y-auto p-2 space-y-1">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-700 p-1 rounded">
                      <Checkbox checked={selectedCats.includes(cat.id)} onCheckedChange={() => toggleChip(cat.id, selectedCats, setSelectedCats)} />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map(s => (
                  <button key={s} type="button" onClick={() => toggleChip(s, sizes, setSizes)}
                    className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                      sizes.includes(s) ? "bg-white text-slate-900 border-white" : "bg-slate-800 border-slate-700 text-white/60"
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} type="button" onClick={() => toggleChip(c, colors, setColors)}
                    className={`px-3 py-1 rounded-md text-sm border capitalize transition-colors ${
                      colors.includes(c) ? "bg-white text-slate-900 border-white" : "bg-slate-800 border-slate-700 text-white/60"
                    }`}>{c}</button>
                ))}
              </div>
            </div>

            {/* ── Custom Variants ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Custom Variants</Label>
                <button onClick={addVariant}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors">
                  <Plus size={12} /> Нэмэх
                </button>
              </div>
              <p className="text-white/30 text-xs">Sizes/Colors-оос гадна нэмэлт сонголт. Жишээ: Хамгаалалт → Байгаа, Байхгүй</p>
              {variants.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-3">Variant байхгүй</p>
              ) : (
                <div className="space-y-2">
                  {variants.map(v => (
                    <div key={v.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={v.label}
                          onChange={e => updateVariantLabel(v.id, e.target.value)}
                          placeholder="Label (жишээ: Хамгаалалт)"
                          className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm px-2.5 py-2 rounded-lg outline-none focus:border-violet-500"
                        />
                        <button onClick={() => removeVariant(v.id)}
                          className="text-white/30 hover:text-red-400 p-1 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        value={variantInputs[v.id] ?? ""}
                        onChange={e => {
                          const val = e.target.value
                          setVariantInputs(prev => ({
                            ...prev,
                            [v.id]: val
                          }))
                        }}
                        onBlur={() => {
                          const raw = variantInputs[v.id] || ""
                          const values = raw.split(",").map(s => s.trim()).filter(Boolean)
                          const newVariants = variants.map(vr =>
                            vr.id === v.id ? { ...vr, values } : vr
                          )
                          setVariants(newVariants)
                          saveVariants(newVariants)
                        }}
                        placeholder="Утгууд таслалаар (жишээ: Байгаа, Байхгүй)"
                        className="w-full bg-slate-700 border border-slate-600 text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-violet-500"
                      />
                      {v.values.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {v.values.map(val => (
                            <span key={val} className="bg-slate-700 text-white/60 text-xs px-2 py-0.5 rounded-full">{val}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => saveVariants(variants)}
                    disabled={varLoading}
                    className="w-full text-xs py-2 border border-slate-600 hover:border-slate-500 text-white/50 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5">
                    {varLoading ? <><Loader2 size={12} className="animate-spin" /> Хадгалж байна...</> : "Variants хадгалах"}
                  </button>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="relative">
                <Input type="text" value={price} onChange={e => setPrice(fmtInp(e.target.value))} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <p className="text-white text-sm font-medium">Status</p>
              <button onClick={() => setStatus(s => s === "active" ? "inactive" : "active")}
                className={`relative w-12 h-6 rounded-full transition-colors ${status === "active" ? "bg-green-500" : "bg-slate-600"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${status === "active" ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {/* Discount toggle */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <p className="text-white text-sm font-medium">Discount</p>
              <button onClick={() => setDiscountEnabled(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors ${discountEnabled ? "bg-blue-500" : "bg-slate-600"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${discountEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {discountEnabled && (
              <div className="space-y-4 border border-slate-700 p-4 rounded-xl">
                <div className="space-y-2">
                  <Label>Final Price</Label>
                  <div className="relative">
                    <Input type="text" value={finalPrice} onChange={e => setFinalPrice(fmtInp(e.target.value))} placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discount Ends At</Label>
                  <Input type="datetime-local" value={discountEndsAt} onChange={e => setDiscountEndsAt(e.target.value)} />
                </div>
              </div>
            )}
            {/* ── Зургийн variant color ── */}
            {images.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-1.5"><ImageIcon size={14} /> Зургийн өнгө тохиргоо</Label>
                <p className="text-white/30 text-xs">Зургийн хажууд өнгө сонгоход тэр өнгөний бараа сонгогдоход харагдана</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[...images].sort((a, b) => a.order - b.order).map(img => (
                    <div key={img.id} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl p-2">
                      <img src={img.url} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSetPrimary(img.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                              img.isPrimary
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "text-white/30 hover:text-white/60 border border-transparent hover:border-slate-600"
                            }`}>
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
                          {product.colors.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <Button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-slate-950 hover:bg-slate-800">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Saving...</> : "Save Changes"}
            </Button>

            {/* Delete */}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl text-sm transition-colors">
                <Trash2 size={15} /> Delete Product
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                <p className="text-red-300 text-sm text-center">Устгахдаа итгэлтэй байна уу?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-slate-800 text-white/60 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
                    Болих
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
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