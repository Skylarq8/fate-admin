// 📁 components/admin/AddCouponDrawer.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { Loader2, X, Infinity } from "lucide-react"

interface CatalogProduct { id: string; title: string }
interface Props { onSuccess?: () => void }

export default function AddCouponDrawer({ onSuccess }: Props) {
  const { toasts, remove, success, error } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [isLimited, setIsLimited] = useState(false)
  const [usageLimit, setUsageLimit] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [applyToAll, setApplyToAll] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)

  const [touched, setTouched] = useState({
    code: false,
    discountValue: false,
    usageLimit: false,
  })

  const usageLimitNum = Number(usageLimit.replace(/\D/g, ""))
  const errors = {
    code: touched.code && !code.trim() ? "Coupon код оруулна уу." : "",
    discountValue: touched.discountValue && !discountValue ? "Хөнгөлөлтийн утга оруулна уу." : "",
    usageLimit:
      isLimited && touched.usageLimit && (usageLimitNum < 1 || !usageLimit)
        ? "Хамгийн багадаа 1 удаа ашигдаж болно."
        : "",
    products: !applyToAll && selectedProducts.length === 0 ? "Хамгийн багадаа 1 бараа сонгоно уу." : "",
  }

  const isValid = code.trim() && discountValue && (errors.usageLimit === "") && (applyToAll || selectedProducts.length > 0)

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
    setCode("")
    setDiscountValue("")
    setIsLimited(false)
    setUsageLimit("")
    setExpiresAt("")
    setDiscountType("percentage")
    setApplyToAll(true)
    setSelectedProducts([])
    setSearchQuery("")
    setTouched({ code: false, discountValue: false, usageLimit: false })
  }

  const handleSubmit = async () => {
    setTouched({ code: true, discountValue: true, usageLimit: true })

    if (!isValid) return

    const val = Number(discountValue.replace(/\D/g, ""))
    if (discountType === "percentage" && (val < 1 || val > 100)) {
      return error("Хувь нь 1-100 байх ёстой.")
    }

    const limitVal = isLimited ? Number(usageLimit.replace(/\D/g, "")) : null
    if (isLimited && (!limitVal || limitVal < 1)) {
      return error("Хамгийн багадаа 1 удаа ашигдаж болно.")
    }

    try {
      setLoading(true)
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: val,
          usageLimit: limitVal,
          expiresAt: expiresAt || null,
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
        Купон нэмэх
      </Button>

      <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
        <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto bg-slate-900 text-white border-slate-700">
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Купон нэмэх</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 px-5 pb-8">
            {/* Code */}
            <div className="space-y-2">
              <Label>Coupon код</Label>
              <Input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onBlur={() => setTouched(p => ({ ...p, code: true }))}
                placeholder="SUMMER20"
                className="font-mono uppercase"
              />
              {errors.code && <p className="text-red-400 text-xs">{errors.code}</p>}
            </div>

            {/* Discount type */}
            <div className="space-y-2">
              <Label>Хөнгөлөлтийн төрөл</Label>
              <div className="flex gap-2">
                {[
                  { key: "percentage", label: "Хувиар (%)" },
                  { key: "fixed", label: "Мөнгөөр (₮)" },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setDiscountType(t.key as "percentage" | "fixed"); setDiscountValue("") }}
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
              <Label>{discountType === "percentage" ? "Хувь (1-100)" : "Хөнгөлөлтийн дүн"}</Label>
              <div className="relative">
                <Input
                  value={discountValue}
                  onChange={e => setDiscountValue(
                    discountType === "percentage"
                      ? e.target.value.replace(/\D/g, "")
                      : fmtInp(e.target.value)
                  )}
                  onBlur={() => setTouched(p => ({ ...p, discountValue: true }))}
                  placeholder={discountType === "percentage" ? "20" : "10,000"}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  {discountType === "percentage" ? "%" : "₮"}
                </span>
              </div>
              {errors.discountValue && <p className="text-red-400 text-xs">{errors.discountValue}</p>}
            </div>

            {/* Usage limit toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ашигллах тоог хязгаарлах</Label>
                <Switch checked={isLimited} onCheckedChange={setIsLimited} />
              </div>
              {isLimited && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "")
                      setUsageLimit(v ? v : "")
                    }}
                    onBlur={() => setTouched(p => ({ ...p, usageLimit: true }))}
                    placeholder="1"
                  />
                  <p className="text-white/40 text-xs">
                    Энэ купон хэдэн удаа ашигдаж болохыг заана.
                  </p>
                  {errors.usageLimit && <p className="text-red-400 text-xs">{errors.usageLimit}</p>}
                </div>
              )}
              {!isLimited && (
                <p className="text-white/40 text-xs flex items-center gap-1">
                  <Infinity size={12} />
                  Хязгааргүй ашиглалт
                </p>
              )}
            </div>

            {/* Expires at */}
            <div className="space-y-2">
              <Label>Дуусах огноо (заавал биш)</Label>
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
                  { val: true, label: "Бүх бараанд" },
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
                {errors.products && <p className="text-red-400 text-xs">{errors.products}</p>}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !isValid}
              className="w-full py-5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="animate-spin mr-2" size={16} /> Купон үүсгэж байна...</>
                : "Купон үүсгэх"
              }
            </Button>

          </div>
        </SheetContent>
      </Sheet>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}