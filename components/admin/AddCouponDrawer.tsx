// 📁 components/admin/AddCouponDrawer.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { Loader2, X } from "lucide-react"

interface CatalogProduct { id: string; title: string }
interface Props { onSuccess?: () => void }

export default function AddCouponDrawer({ onSuccess }: Props) {
  const { toasts, remove, success, error } = useToast()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const [code,             setCode]             = useState("")
  const [discountType,     setDiscountType]     = useState<"percent" | "amount">("percent")
  const [discountValue,    setDiscountValue]    = useState("")
  const [expiresAt,        setExpiresAt]        = useState("")
  const [applyToAll,       setApplyToAll]       = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [catalog,          setCatalog]          = useState<CatalogProduct[]>([])
  const [searchQuery,      setSearchQuery]      = useState("")
  const [searchOpen,       setSearchOpen]       = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const fmtInp = (s: string) => {
    const n = s.replace(/\D/g, "")
    return n ? new Intl.NumberFormat("mn-MN").format(Number(n)) : ""
  }

  const filtered = catalog.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedProducts.includes(p.id)
  )

  useEffect(() => {
    if (!open) return
    fetch("/api/products").then(r => r.json()).then(d => setCatalog(d.data ?? []))
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const reset = () => {
    setCode(""); setDiscountValue(""); setExpiresAt("")
    setApplyToAll(true); setSelectedProducts([]); setSearchQuery("")
    setDiscountType("percent")
  }

  const handleSubmit = async () => {
    if (!code.trim())   return error("Coupon код оруулна уу.")
    if (!discountValue) return error("Хөнгөлөлтийн утга оруулна уу.")
    if (!expiresAt)     return error("Дуусах огноо оруулна уу.")
    if (!applyToAll && selectedProducts.length === 0)
      return error("Дор хаяж 1 бараа сонгоно уу.")

    const val = Number(discountValue.replace(/\D/g, ""))
    if (discountType === "percent" && (val < 1 || val > 100))
      return error("Хувь нь 1-100 байх ёстой.")

    try {
      setLoading(true)
      const res = await fetch("/api/coupons", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code:            code.trim().toUpperCase(),
          discountPercent: discountType === "percent" ? val : undefined,
          discountAmount:  discountType === "amount"  ? val : undefined,
          expiresAt:       new Date(expiresAt).toISOString(),
          applyToAll,
          products: applyToAll ? undefined : selectedProducts,
        }),
      })
      const data = await res.json()
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      success(`"${code.toUpperCase()}" coupon нэмэгдлээ! 🎉`)
      reset()
      setTimeout(() => { setOpen(false); onSuccess?.() }, 1000)
    } catch {
      error("Сүлжээний алдаа гарлаа.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-sm bg-white/90 text-slate-900">
        Add Coupon
      </Button>

      <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
        <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto bg-slate-900 text-white border-slate-700">
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Add Coupon</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 px-5 pb-8">

            {/* Code */}
            <div className="space-y-2">
              <Label>Coupon код</Label>
              <Input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="font-mono uppercase"
              />
            </div>

            {/* Discount type */}
            <div className="space-y-2">
              <Label>Хөнгөлөлтийн төрөл</Label>
              <div className="flex gap-2">
                {[
                  { key: "percent", label: "Хувиар (%)" },
                  { key: "amount",  label: "Мөнгөөр (₮)" },
                ].map(t => (
                  <button key={t.key}
                    onClick={() => { setDiscountType(t.key as "percent" | "amount"); setDiscountValue("") }}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                      discountType === t.key
                        ? "bg-white text-slate-900 border-white"
                        : "bg-slate-800 border-slate-700 text-white/60 hover:border-slate-500"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount value */}
            <div className="space-y-2">
              <Label>{discountType === "percent" ? "Хувь (1-100)" : "Хөнгөлөлтийн дүн"}</Label>
              <div className="relative">
                <Input
                  value={discountValue}
                  onChange={e => setDiscountValue(
                    discountType === "percent"
                      ? e.target.value.replace(/\D/g, "")
                      : fmtInp(e.target.value)
                  )}
                  placeholder={discountType === "percent" ? "20" : "10,000"}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  {discountType === "percent" ? "%" : "₮"}
                </span>
              </div>
            </div>

            {/* Expires at */}
            <div className="space-y-2">
              <Label>Дуусах огноо</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>

            {/* Apply to */}
            <div className="space-y-2">
              <Label>Хамрах хүрээ</Label>
              <div className="flex gap-2">
                {[
                  { val: true,  label: "Бүх бараанд" },
                  { val: false, label: "Тодорхой бараанд" },
                ].map(t => (
                  <button key={String(t.val)} onClick={() => setApplyToAll(t.val)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                      applyToAll === t.val
                        ? "bg-white text-slate-900 border-white"
                        : "bg-slate-800 border-slate-700 text-white/60 hover:border-slate-500"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product selector */}
            {!applyToAll && (
              <div className="space-y-2">
                <Label>Бараа сонгох</Label>

                {/* selected chips */}
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map(id => {
                      const p = catalog.find(c => c.id === id)
                      return (
                        <div key={id} className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-xs text-white">
                          {p?.title ?? id}
                          <button
                            onClick={() => setSelectedProducts(prev => prev.filter(i => i !== id))}
                            className="text-white/40 hover:text-red-400 transition-colors ml-1">
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* search */}
                <div ref={searchRef} className="relative">
                  <Input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Бараа хайх..."
                  />
                  {searchOpen && searchQuery.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-20 max-h-48 overflow-y-auto">
                      {filtered.length === 0
                        ? <p className="text-white/30 text-sm px-3 py-3">Бараа олдсонгүй.</p>
                        : filtered.map(p => (
                            <button key={p.id}
                              onClick={() => {
                                setSelectedProducts(prev => [...prev, p.id])
                                setSearchQuery(""); setSearchOpen(false)
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-slate-700 transition-colors">
                              {p.title}
                            </button>
                          ))
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <Button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-slate-950 hover:bg-slate-800">
              {loading
                ? <><Loader2 className="animate-spin mr-2" size={16} /> Creating...</>
                : "Create Coupon"
              }
            </Button>

          </div>
        </SheetContent>
      </Sheet>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}