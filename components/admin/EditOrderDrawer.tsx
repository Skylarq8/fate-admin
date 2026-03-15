// 📁 components/admin/EditOrderDrawer.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { Loader2, Package, Trash2 } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────
export type OrderStatus = "pending" | "confirmed" | "delivered"

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
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  size: string | null
  color: string | null
  product: CatalogProduct
}

export interface Order {
  id: string
  customerName: string
  phone: string
  email: string
  shippingAddress: string
  totalAmount: number
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
}

interface CartItem {
  product: CatalogProduct
  quantity: number
  size: string
  color: string
}

interface Props {
  order: Order
  onClose: () => void
  onSuccess: (updated: Order) => void
  onDeleted?: (id: string) => void
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "Хүлээгдэж буй", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  confirmed: { label: "Баталгаажсан",  color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-500/30"  },
  delivered: { label: "Хүргэгдсэн",    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EditOrderDrawer({ order, onClose, onSuccess, onDeleted }: Props) {
  const { toasts, remove, success, error } = useToast()
  const [loading,       setLoading]       = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // customer fields
  const [customerName,    setCustomerName]    = useState(order.customerName)
  const [phone,           setPhone]           = useState(order.phone)
  const [email,           setEmail]           = useState(order.email)
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress)
  const [status,          setStatus]          = useState<OrderStatus>(order.status)

  // cart — init from existing order items
  const [catalog,     setCatalog]     = useState<CatalogProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [cart,        setCart]        = useState<CartItem[]>(
    order.items.map(item => ({
      product:  item.product as CatalogProduct,
      quantity: item.quantity,
      size:     item.size  ?? "",
      color:    item.color ?? "",
    }))
  )
  const searchRef = useRef<HTMLDivElement>(null)

  const fmt    = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"
  const unitOf = (p: CatalogProduct) => p.discountEnabled && p.finalPrice ? p.finalPrice : p.price
  const totalAmount = cart.reduce((sum, c) => sum + unitOf(c.product) * c.quantity, 0)
  const filtered    = catalog.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(d => setCatalog(d.data ?? []))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (product: CatalogProduct) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { product, quantity: 1, size: product.sizes[0] ?? "", color: product.colors[0] ?? "" }]
    })
    setSearchQuery(""); setSearchOpen(false)
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.product.id !== id))

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: qty } : c))
  }

  const updateSize  = (id: string, size: string)  => setCart(prev => prev.map(c => c.product.id === id ? { ...c, size }  : c))
  const updateColor = (id: string, color: string) => setCart(prev => prev.map(c => c.product.id === id ? { ...c, color } : c))

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res  = await fetch(`/api/orders/${order.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { error(data.message || "Устгахад алдаа гарлаа."); return }
      success("Захиалга устгагдлаа.")
      setTimeout(() => { onDeleted?.(order.id); onClose() }, 800)
    } catch {
      error("Сүлжээний алдаа гарлаа.")
    } finally {
      setDeleting(false)
    }
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
      const res = await fetch(`/api/orders/${order.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email,
          shippingAddress,
          status,
          items: cart.map(c => ({
            productId: c.product.id,
            quantity:  c.quantity,
            size:      c.size  || undefined,
            color:     c.color || undefined,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      success("Амжилттай хадгалагдлаа! ✓")
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
        <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto bg-slate-900 text-white border-slate-700">
          <SheetHeader className="px-5 pb-4">
            <SheetTitle className="text-white text-lg">Edit Order</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 px-5 pb-8">

            {/* ── Status ── */}
            <div className="space-y-2">
              <p className="text-white/40 text-xs uppercase tracking-wider">Статус</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(STATUS_CONFIG) as [OrderStatus, typeof STATUS_CONFIG[OrderStatus]][]).map(([key, s]) => (
                  <button key={key} onClick={() => setStatus(key)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      status === key ? `${s.bg} ${s.color} ${s.border}` : "bg-slate-800 text-white/40 border-slate-700 hover:border-slate-500"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${key === "pending" ? "bg-amber-400" : key === "confirmed" ? "bg-blue-400" : "bg-green-400"}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Customer info ── */}
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wider">Хэрэглэгчийн мэдээлэл</p>
              {[
                { label: "Нэр",              val: customerName,    set: setCustomerName,    ph: "Бат-Эрдэнэ" },
                { label: "Утас",             val: phone,           set: setPhone,           ph: "99001234" },
                { label: "И-мэйл",           val: email,           set: setEmail,           ph: "example@mail.com" },
                { label: "Хүргэлтийн хаяг", val: shippingAddress, set: setShippingAddress, ph: "УБ, СБД..." },
              ].map(f => (
                <div key={f.label} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
                </div>
              ))}
            </div>

            {/* ── Products ── */}
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Package size={12} /> Захиалсан бараа
              </p>

              {/* search */}
              <div ref={searchRef} className="relative">
                <Input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Бараа хайж нэмэх..."
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
                          {img ? <img src={img.url} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                               : <div className="w-10 h-10 bg-slate-700 rounded-lg flex-shrink-0" />}
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

              {/* cart items */}
              {cart.length > 0 && (
                <div className="space-y-2">
                  {cart.map(item => {
                    const img = item.product.images.find(i => i.isPrimary) ?? item.product.images[0]
                    return (
                      <div key={item.product.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center gap-3">
                          {img ? <img src={img.url} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                               : <div className="w-12 h-12 bg-slate-700 rounded-lg flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.product.title}</p>
                            <p className="text-white/40 text-xs">{fmt(unitOf(item.product))}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)}
                            className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 size={15} />
                          </button>
                        </div>
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
                          <div className="flex items-center gap-1 ml-auto">
                            <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-base leading-none transition-colors">−</button>
                            <span className="text-white text-sm w-7 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center text-base leading-none transition-colors">+</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between items-center px-1 pt-2 border-t border-slate-700">
                    <span className="text-white/50 text-sm">Нийт дүн</span>
                    <span className="text-white font-bold">{fmt(totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Submit ── */}
            <Button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-slate-950 hover:bg-slate-800">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Saving...</> : "Save Changes"}
            </Button>

            {/* ── Delete ── */}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl text-sm transition-colors">
                <Trash2 size={15} /> Delete Order
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