// 📁 app/admin/orders/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { X, User, Phone, Mail, MapPin, Package, ChevronDown, Loader2, Pencil } from "lucide-react"
import AddOrderDrawer from "@/components/admin/AddOrderDrawer"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import EditOrderDrawer, { Order, OrderStatus } from "@/components/admin/EditOrderDrawer"

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "Хүлээгдэж буй", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  confirmed: { label: "Баталгаажсан",  color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-500/30"  },
  delivered: { label: "Хүргэгдсэн",    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
}

// ─── StatusDropdown ──────────────────────────────────────────────────────────
function StatusDropdown({ order, onUpdated, onToast }: { order: Order; onUpdated: (o: Order) => void; onToast?: (msg: string, type: "success"|"error") => void }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cfg = STATUS_CONFIG[order.status]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const update = async (status: OrderStatus) => {
    if (status === order.status) return setOpen(false)
    setLoading(true); setOpen(false)
    try {
      const res  = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok) { onUpdated(data.data); onToast?.(STATUS_CONFIG[status].label + " болгон өөрчлөгдлөө ✓", "success") }
      else onToast?.(data.message || "Алдаа гарлаа.", "error")
    } finally { setLoading(false) }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(v => !v)} disabled={loading}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${cfg.bg} ${cfg.color} ${cfg.border}`}>
        {loading ? <Loader2 size={12} className="animate-spin" /> : cfg.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-20 min-w-[148px]">
          {(Object.entries(STATUS_CONFIG) as [OrderStatus, typeof STATUS_CONFIG[OrderStatus]][]).map(([key, s]) => (
            <button key={key} onClick={() => update(key)}
              className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-slate-700 transition-colors ${key === order.status ? s.color + " font-semibold" : "text-white/70"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${key === "pending" ? "bg-amber-400" : key === "confirmed" ? "bg-blue-400" : "bg-green-400"}`} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── OrderDetailModal ────────────────────────────────────────────────────────
function OrderDetailModal({ order: initial, onClose, onUpdated, onDeleted }: {
  order: Order; onClose: () => void; onUpdated: (o: Order) => void; onDeleted: (id: string) => void
}) {
  const { toasts, remove, success, error } = useToast()
  const [order,    setOrder]    = useState(initial)
  const [editOpen, setEditOpen] = useState(false)
  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"
  const handleUpdated = (updated: Order) => { setOrder(updated); onUpdated(updated) }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={editOpen ? undefined : onClose}>
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={editOpen ? undefined : onClose}
            className={`bg-slate-800 hover:bg-slate-700 text-white rounded-full p-1.5 transition-colors ${editOpen ? "opacity-30 cursor-not-allowed" : ""}`}>
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="pr-10">
            <p className="text-white/30 text-xs font-mono mb-1">#{order.id.slice(-8).toUpperCase()}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-white">{order.customerName}</h2>
              <div onClick={e => e.stopPropagation()}>
                <StatusDropdown order={order} onUpdated={handleUpdated} onToast={(msg, type) => type === "success" ? success(msg) : error(msg)} />
              </div>
            </div>
            <p className="text-white/30 text-xs mt-1">{new Date(order.createdAt).toLocaleString("mn-MN")}</p>
          </div>

          {/* Customer info */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-white/40 text-xs uppercase tracking-wider">Хэрэглэгчийн мэдээлэл</p>
            {[
              { icon: <User size={14} />,   val: order.customerName    },
              { icon: <Phone size={14} />,  val: order.phone           },
              { icon: <Mail size={14} />,   val: order.email           },
              { icon: <MapPin size={14} />, val: order.shippingAddress },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-white">
                <span className="text-white/40 mt-0.5 flex-shrink-0">{r.icon}</span>
                <span className="leading-snug">{r.val}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Package size={12} /> Захиалсан бараа
            </p>
            {order.items.length === 0 && <p className="text-white/30 text-sm">Бараа байхгүй.</p>}
            {order.items.map(item => {
              const img = item.product.images.find(i => i.isPrimary) ?? item.product.images[0]
              return (
                <div key={item.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                  {img ? <img src={img.url} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                       : <div className="w-14 h-14 bg-slate-700 rounded-lg flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.product.title}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {item.size  && <span className="bg-slate-700 text-white/50 text-xs px-2 py-0.5 rounded">{item.size}</span>}
                      {item.color && <span className="bg-slate-700 text-white/50 text-xs px-2 py-0.5 rounded capitalize">{item.color}</span>}
                      <span className="bg-slate-700 text-white/50 text-xs px-2 py-0.5 rounded">{item.quantity} ширхэг</span>
                    </div>
                    <p className="text-white/40 text-xs mt-1">{fmt(item.unitPrice)} × {item.quantity}</p>
                  </div>
                  <p className="text-white font-semibold text-sm flex-shrink-0">{fmt(item.unitPrice * item.quantity)}</p>
                </div>
              )
            })}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center border-t border-slate-700 pt-4">
            <span className="text-white/60 text-sm">Нийт дүн</span>
            <span className="text-white text-xl font-bold">{fmt(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
    {editOpen && (
      <EditOrderDrawer
        order={order}
        onClose={() => setEditOpen(false)}
        onSuccess={updated => { handleUpdated(updated); setEditOpen(false) }}
        onDeleted={id => { onDeleted(id); onClose() }}
      />
    )}
    <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { toasts, remove, success, error } = useToast()
  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const res  = await fetch("/api/orders")
    const data = await res.json()
    setOrders(data.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"

  const handleUpdated = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    if (selected?.id === updated.id) setSelected(updated)
  }

  return (
    <div className="py-4 px-1 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Orders</h1>
        <AddOrderDrawer onSuccess={fetchOrders} />
      </div>


      {/* ── Stats cards ── */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 mb-4 md:mb-6">
          {[
            {
              label: "Нийт захиалга",
              value: orders.length,
              sub:   null,
              color: "text-white",
              bg:    "bg-slate-800/60",
              border:"border-slate-700",
            },
            {
              label: "Хүлээгдэж буй",
              value: orders.filter(o => o.status === "pending").length,
              sub:   orders.filter(o => o.status === "pending").reduce((s,o) => s + o.totalAmount, 0),
              color: "text-amber-400",
              bg:    "bg-amber-500/5",
              border:"border-amber-500/20",
            },
            {
              label: "Баталгаажсан",
              value: orders.filter(o => o.status === "confirmed").length,
              sub:   orders.filter(o => o.status === "confirmed").reduce((s,o) => s + o.totalAmount, 0),
              color: "text-blue-400",
              bg:    "bg-blue-500/5",
              border:"border-blue-500/20",
            },
            {
              label: "Хүргэгдсэн",
              value: orders.filter(o => o.status === "delivered").length,
              sub:   orders.filter(o => o.status === "delivered").reduce((s,o) => s + o.totalAmount, 0),
              color: "text-green-400",
              bg:    "bg-green-500/5",
              border:"border-green-500/20",
            },
          ].map(card => (
            <div key={card.label} className={`rounded-xl border p-4 ${card.bg} ${card.border}`}>
              <p className="text-white/40 text-xs mb-2">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              {card.sub !== null && (
                <p className="text-white/30 text-xs mt-1">{fmt(card.sub)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-white/40 text-sm">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-white/40 text-sm">Захиалга байхгүй байна.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-white">
              <thead className="bg-slate-800 text-white/50 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Нэр</th>
                  <th className="px-4 py-3 text-left">Утас</th>
                  <th className="px-4 py-3 text-left">Нийт дүн</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-white/30 text-xs cursor-pointer" onClick={() => setSelected(order)}>
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium cursor-pointer" onClick={() => setSelected(order)}>{order.customerName}</td>
                    <td className="px-4 py-3 text-white/60 cursor-pointer" onClick={() => setSelected(order)}>{order.phone}</td>
                    <td className="px-4 py-3 font-semibold cursor-pointer" onClick={() => setSelected(order)}>{fmt(order.totalAmount)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <StatusDropdown order={order} onUpdated={handleUpdated} onToast={(msg, type) => type === "success" ? success(msg) : error(msg)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setSelected(order)}>
                  <div>
                    <p className="text-white/30 text-xs font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-white font-medium mt-0.5">{order.customerName}</p>
                    <p className="text-white/50 text-xs mt-0.5">{order.phone}</p>
                  </div>
                  <p className="text-white font-semibold text-sm flex-shrink-0">{fmt(order.totalAmount)}</p>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <StatusDropdown order={order} onUpdated={handleUpdated} onToast={(msg, type) => type === "success" ? success(msg) : error(msg)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} onDeleted={id => { setOrders(prev => prev.filter(o => o.id !== id)); setSelected(null); fetchOrders() }} />
      )}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  )
}