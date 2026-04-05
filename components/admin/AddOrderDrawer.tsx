// 📁 components/admin/AddOrderDrawer.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { Loader2, Package, Trash2, X } from "lucide-react"
import { VariantOption } from "./ProductDetailModal"

// ─── Types ─────────────────────────────────────────────────────────────────
interface ProductImage { id: string; url: string; isPrimary: boolean }

interface CatalogProduct {
  id: string
  title: string
  price: number
  finalPrice: number | null
  discountEnabled: boolean
  sizes: string[]
  colors: string[]
  images: ProductImage[]
  variants?: VariantOption[]
}

interface CartItem {
  product: CatalogProduct
  quantity: number
  size: string
  color: string
  selectedVariants: { [key: string]: string }
}

interface Props {
  onSuccess?: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function AddOrderDrawer({ onSuccess }: Props) {
  const { toasts, remove, success, error } = useToast()

  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  // customer fields
  const [customerName,    setCustomerName]    = useState("")
  const [phone,           setPhone]           = useState("")
  const [email,           setEmail]           = useState("")
  const [shippingAddress, setShippingAddress] = useState("")

  // product search + cart
  const [catalog,     setCatalog]     = useState<CatalogProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [cart,        setCart]        = useState<CartItem[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  const fmt    = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"
  const unitOf = (p: CatalogProduct) => p.discountEnabled && p.finalPrice ? p.finalPrice : p.price

  const filtered = catalog.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAmount = cart.reduce((sum, c) => sum + unitOf(c.product) * c.quantity, 0)

  // fetch catalog when drawer opens
  useEffect(() => {
    if (!open) return
    fetch("/api/products")
      .then(r => r.json())
      .then(d => setCatalog(d.data ?? []))
  }, [open])

  // close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (product: CatalogProduct) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        return prev.map(c =>
          c.product.id === product.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      // 👇 default variant values
      const defaultVariants: Record<string, string> = {}
        product.variants?.forEach(v => {
          if (v.values.length > 0) {
            defaultVariants[v.label] = v.values[0]
          }
      })
      return [
        ...prev,
        {
          product,
          quantity: 1,
          size: product.sizes[0] ?? "",
          color: product.colors[0] ?? "",
          selectedVariants: defaultVariants, // 👈 ADD
        },
      ]
    })

    setSearchQuery("")
    setSearchOpen(false)
  }

  const updateVariant = (id: string, label: string, value: string) => {
    setCart(prev =>
      prev.map(c =>
        c.product.id === id
          ? {
              ...c,
              selectedVariants: {
                ...c.selectedVariants,
                [label]: value,
              },
            }
          : c
      )
    )
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.product.id !== id))

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: qty } : c))
  }

  const updateSize  = (id: string, size: string)  => setCart(prev => prev.map(c => c.product.id === id ? { ...c, size }  : c))
  const updateColor = (id: string, color: string) => setCart(prev => prev.map(c => c.product.id === id ? { ...c, color } : c))

  // ── reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setCustomerName(""); setPhone(""); setEmail(""); setShippingAddress("")
    setCart([]); setSearchQuery("")
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerName.trim())    return error("Нэр оруулна уу.")
    if (!phone.trim())           return error("Утасны дугаар оруулна уу.")
    if (!email.trim())           return error("И-мэйл оруулна уу.")
    if (!shippingAddress.trim()) return error("Хүргэлтийн хаяг оруулна уу.")
    if (cart.length === 0)       return error("Дор хаяж 1 бараа нэмнэ үү.")

    try {
      setLoading(true)
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email,
          shippingAddress,
          items: cart.map(c => ({
            productId: c.product.id,
            quantity:  c.quantity,
            size:      c.size  || undefined,
            color:     c.color || undefined,
            variants: Object.keys(c.selectedVariants).length > 0 
            ? Object.entries(c.selectedVariants).map(([k,v]) => ({ [k]: v }))
            : [],
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      success("Захиалга амжилттай нэмэгдлээ! 🎉")
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
        Захиалга нэмэх
      </Button>

      <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
        <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto bg-slate-900 text-white border-slate-700" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Захиалга нэмэх</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 px-5 pb-8">

            {/* ── Customer info ── */}
            <div className="space-y-3">
              {/* <p className="text-white/40 text-xs uppercase tracking-wider">Хэрэглэгчийн мэдээлэл</p> */}

              <div className="space-y-2">
                <Label>Нэр</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Бадар-Ууган" />
              </div>
              <div className="space-y-2">
                <Label>Утас</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="99999999" />
              </div>
              <div className="space-y-2">
                <Label>И-мэйл</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" />
              </div>
              <div className="space-y-2">
                <Label>Хүргэлтийн хаяг</Label>
                <Input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="УБ, БГД, 26-р хороо..." />
              </div>
            </div>

            {/* ── Product search ── */}
            <div className="space-y-2">
              <p className="text-xs uppercase flex items-center gap-1.5">
                <Package size={15} /> 
                <Label>Бараа нэмэх</Label>
              </p>

              <div ref={searchRef} className="relative">
                <Input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Барааны нэрээр хайх..."
                />
                {searchOpen && searchQuery.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-20 max-h-52 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="text-white/30 text-sm px-3 py-3">Бараа олдсонгүй.</p>
                    ) : filtered.map(p => {
                      const img    = p.images.find(i => i.isPrimary) ?? p.images[0]
                      const inCart = cart.some(c => c.product.id === p.id)
                      return (
                        <button key={p.id} onClick={() => addToCart(p)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 transition-colors text-left">
                          {img
                            ? <img src={img.url} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            : <div className="w-10 h-10 bg-slate-700 rounded-lg flex-shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{p.title}</p>
                            <p className="text-white/40 text-xs">{fmt(unitOf(p))}</p>
                          </div>
                          {inCart && <span className="text-green-400 text-xs flex-shrink-0">✓ нэмэгдсэн</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Cart ── */}
              {cart.length > 0 && (
                <div className="space-y-2">
                  {cart.map(item => {
                    const img = item.product.images.find(i => i.isPrimary) ?? item.product.images[0]
                    return (
                      <div key={item.product.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2.5">
                        {/* product row */}
                        <div className="flex items-center gap-3">
                          {img
                            ? <img src={img.url} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                            : <div className="w-12 h-12 bg-slate-700 rounded-lg flex-shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.product.title}</p>
                            <p className="text-white/40 text-xs">{fmt(unitOf(item.product))}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)}
                            className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* size, color, qty */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.product.sizes.length > 0 && (
                            <select value={item.size} onChange={e => updateSize(item.product.id, e.target.value)}
                              className="bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1.5 rounded-lg focus:outline-none">
                              {item.product.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                          {item.product.colors.length > 0 && (
                            <select value={item.color} onChange={e => updateColor(item.product.id, e.target.value)}
                              className="bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1.5 rounded-lg capitalize focus:outline-none">
                              {item.product.colors.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                          {/* ── Variants ── */}
                          {(item.product.variants ?? []).map((v) => (
                            <div key={v.id} className="flex items-center gap-2">
                              <select
                                value={item.selectedVariants?.[v.label] || ""}
                                onChange={e =>
                                  updateVariant(item.product.id, v.label, e.target.value)
                                }
                                className="flex-1 bg-slate-700 border border-slate-600 text-white text-xs px-2 py-1.5 rounded-lg"
                              >
                                {v.values.map(val => (
                                  <option key={val} value={val}>
                                    {val}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                          {/* quantity +/- */}
                          <div className="flex items-center gap-1 ml-auto">
                            <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-base leading-none transition-colors">
                              −
                            </button>
                            <span className="text-white text-sm w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-base leading-none transition-colors">
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* total */}
                  <div className="flex justify-between items-center px-1 pt-2 border-t border-slate-700">
                    <span className="text-white/50 text-sm">Нийт дүн</span>
                    <span className="text-white font-bold">{fmt(totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Submit ── */}
            <Button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-slate-950 hover:bg-slate-800">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Захиалга үүсгэж байна...</> : "Захиалга нэмэх"}
            </Button>

          </div>
        </SheetContent>
      </Sheet>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}