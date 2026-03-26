// 📁 components/admin/AddProductDrawer.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { ChevronDown, X, Loader2 } from "lucide-react"

interface Category { id: string; name: string }

interface AddProductDrawerProps {
  categories: Category[]
  onSuccess?: () => void
}

const SIZE_OPTIONS  = ["XS","S","M","L","XL","2XL","3XL"]
const COLOR_OPTIONS = ["black","white","red","blue","green","yellow","gray","pink"]

export default function AddProductDrawer({ categories, onSuccess }: AddProductDrawerProps) {
  const { toasts, remove, success, error } = useToast()

  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [title,       setTitle]       = useState("")
  const [description, setDescription] = useState("")
  const [price,       setPrice]       = useState("")
  const [finalPrice,  setFinalPrice]  = useState("")
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountEndsAt,  setDiscountEndsAt]  = useState("")
  const [sizes,       setSizes]       = useState<string[]>([])
  const [colors,      setColors]      = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [images, setImages] = useState<File[]>([])

  const formatPrice = (val: string) => {
    const num = val.replace(/\D/g, "")
    return num ? new Intl.NumberFormat("mn-MN").format(Number(num)) : ""
  }
  const parsePrice = (val: string) => Number(val.replace(/\D/g, ""))

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const toggleChip = (val: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setImages(prev => [...prev, ...Array.from(e.target.files!)])
  }

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(""); setFinalPrice("")
    setDiscountEnabled(false); setDiscountEndsAt("")
    setSizes([]); setColors([]); setSelectedCategories([]); setImages([])
  }

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
    formData.append("sizes",           JSON.stringify(sizes))
    formData.append("colors",          JSON.stringify(colors))
    formData.append("categories",      JSON.stringify(selectedCategories))
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

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-sm bg-white/90 text-slate-900">
        Add Product
      </Button>

      <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm() }}>
        <SheetContent side="right" className="w-full sm:w-[420px] overflow-y-auto bg-slate-900 text-white border-slate-700" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Add Product</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-8">
            {/* Images */}
            <div className="space-y-2">
              <Label>Images</Label>
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800">
                <span className="text-sm text-white/40">Click to upload images</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative rounded-md overflow-hidden">
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded z-10">Primary</span>
                      )}
                      <img src={URL.createObjectURL(img)} className="w-full h-24 object-cover" />
                      <X onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded cursor-pointer" size={18} />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-white/30">Эхний зураг primary болно</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product name" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"/>
            </div>

            {/* Categories */}
            <div className="space-y-1">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(id => {
                  const cat = categories.find(c => c.id === id)
                  return (
                    <div key={id} className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-md text-sm">
                      {cat?.name}
                      <X onClick={() => toggleCategory(id)} className="text-red-500 cursor-pointer" size={14} />
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
                      <Checkbox checked={selectedCategories.includes(cat.id)} onCheckedChange={() => toggleCategory(cat.id)} />
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
                <Input type="text" value={price} onChange={e => setPrice(formatPrice(e.target.value))} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
              </div>
            </div>

            {/* Discount toggle */}
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <div>
                <p className="text-white text-sm font-medium">Discount</p>
                <p className="text-white/40 text-xs mt-0.5">Хямдрал идэвхжүүлэх</p>
              </div>
              <button
                onClick={(checked => setDiscountEnabled(!!checked))}
                className={`relative w-12 h-6 rounded-full transition-colors ${discountEnabled ? "bg-blue-500" : "bg-slate-600"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${discountEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {discountEnabled && (
              <div className="space-y-4 border border-slate-700 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label>Final Price</Label>
                  <div className="relative">
                    <Input type="text" value={finalPrice} onChange={e => setFinalPrice(formatPrice(e.target.value))} placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">₮</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discount Ends At</Label>
                  <Input type="datetime-local" value={discountEndsAt} onChange={e => setDiscountEndsAt(e.target.value)} />
                </div>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="w-full mt-2 py-5 bg-slate-950 hover:bg-slate-800">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Uploading...</> : "Submit"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}