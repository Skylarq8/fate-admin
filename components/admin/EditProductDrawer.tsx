// 📁 components/admin/EditProductDrawer.tsx
"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { ChevronDown, X, Loader2, Trash2 } from "lucide-react"
import { Product } from "@/components/admin/ProductDetailModal"

interface Category { id: string; name: string }
interface Props {
  product: Product
  categories: Category[]
  onClose: () => void
  onSuccess: (updated: Product) => void
  onDeleted?: (id: string) => void
}

const SIZE_OPTIONS  = ["XS","S","M","L","XL","2XL","3XL"]
const COLOR_OPTIONS = ["black","white","red","blue","green","yellow","gray","pink"]

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
  const [status,       setStatus]       = useState<"active" | "inactive">(product.status)
  const [sizes,        setSizes]        = useState<string[]>(product.sizes)
  const [colors,       setColors]       = useState<string[]>(product.colors)
  const [selectedCats, setSelectedCats] = useState<string[]>(product.categories.map(c => c.category.id))
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val])

    // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res  = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
      const data = await res.json()
      console.log("DELETE status:", res.status, "body:", data)
      if (!res.ok) { error(data.message || "Устгахад алдаа гарлаа."); return }
      success("Бараа устгагдлаа.")
      setTimeout(() => { onDeleted?.(product.id); onClose() }, 800)
    } catch (err) {
      console.error("DELETE fetch error:", err)
      error("Сүлжээний алдаа гарлаа.")
    } finally {
      setDeleting(false)
    }
  }

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
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      success("Амжилттай хадгалагдлаа!")
      setTimeout(() => onSuccess(data.data), 1000)
    } catch {
      error("Сүлжээний алдаа гарлаа.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Sheet open onOpenChange={v => { if (!v) onClose() }}>
        <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto bg-slate-900 text-white border-slate-700" onOpenAutoFocus={(e) => e.preventDefault()}>
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
              <div>
                <p className="text-white text-sm font-medium">Status</p>
                {/* <p className="text-white/40 text-xs mt-0.5">Барааг идэвхтэй эсэхийг тохируулна</p> */}
              </div>
              <button
                onClick={() => setStatus(s => s === "active" ? "inactive" : "active")}
                className={`relative w-12 h-6 rounded-full transition-colors ${status === "active" ? "bg-green-500" : "bg-slate-600"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${status === "active" ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {/* Discount toggle */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <div>
                <p className="text-white text-sm font-medium">Discount</p>
                {/* <p className="text-white/40 text-xs mt-0.5">Хямдрал идэвхжүүлэх</p> */}
              </div>
              <button
                onClick={() => setDiscountEnabled(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors ${discountEnabled ? "bg-blue-500" : "bg-slate-600"}`}
              >
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