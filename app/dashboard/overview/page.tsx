// 📁 app/dashboard/overview/page.tsx
"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Package, Tag, TrendingUp, Clock, CheckCircle, Truck } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  customerName: string
  totalAmount: number
  status: "pending" | "confirmed" | "delivered"
  createdAt: string
}

interface Stats {
  totalRevenue:    number
  totalOrders:     number
  totalProducts:   number
  totalCategories: number
  pendingOrders:   number
  confirmedOrders: number
  deliveredOrders: number
  recentOrders:    Order[]
}

const STATUS_CONFIG = {
  pending:   { statusLabel: "Хүлээгдэж буй", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <Clock       size={12} /> },
  confirmed: { statusLabel: "Баталгаажсан",  color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-500/30", icon: <CheckCircle size={12} /> },
  delivered: { statusLabel: "Хүргэгдсэн",    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30",icon: <Truck       size={12} /> },
}

export default function OverviewPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, productsRes, categoriesRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/products"),
          fetch("/api/categories"),
        ])
        const [ordersData, productsData, categoriesData] = await Promise.all([
          ordersRes.json(), productsRes.json(), categoriesRes.json(),
        ])

        const orders: Order[] = ordersData.data ?? []
        setStats({
          totalRevenue:    orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0),
          totalOrders:     orders.length,
          totalProducts:   (productsData.data   ?? []).length,
          totalCategories: (categoriesData.data ?? []).length,
          pendingOrders:   orders.filter(o => o.status === "pending").length,
          confirmedOrders: orders.filter(o => o.status === "confirmed").length,
          deliveredOrders: orders.filter(o => o.status === "delivered").length,
          recentOrders:    orders.slice(0, 6),
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"

  if (loading) return <div className="p-6 text-white/40 text-sm">Loading...</div>
  if (!stats)  return null

  return (
    <div className="py-4 px-1 md:p-6 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-white">Overview</h1>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { statusLabel: "Нийт орлого",   value: fmt(stats.totalRevenue),          icon: <TrendingUp   size={20} />, color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
          { statusLabel: "Нийт захиалга", value: String(stats.totalOrders),        icon: <ShoppingCart size={20} />, color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
          { statusLabel: "Нийт бараа",    value: String(stats.totalProducts),      icon: <Package      size={20} />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          { statusLabel: "Category",      value: String(stats.totalCategories),    icon: <Tag          size={20} />, color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
        ].map(card => (
          <div key={card.statusLabel} className={`rounded-xl border p-4 ${card.bg} ${card.border}`}>
            <div className={`${card.color} mb-3`}>{card.icon}</div>
            <p className="text-xl md:text-2xl font-bold text-white">{card.value}</p>
            <p className="text-white/40 text-xs mt-1">{card.statusLabel}</p>
          </div>
        ))}
      </div>

      {/* ── Order status cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: stats.pendingOrders,   ...STATUS_CONFIG.pending   },
          { value: stats.confirmedOrders, ...STATUS_CONFIG.confirmed },
          { value: stats.deliveredOrders, ...STATUS_CONFIG.delivered },
        ].map(card => (
          <div key={card.statusLabel} className={`rounded-xl border p-4 ${card.bg} ${card.border}`}>
            <div className={`${card.color} mb-2`}>{card.icon}</div>
            <p className={`text-xl md:text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-white/40 text-xs mt-1">{card.statusLabel}</p>
          </div>
        ))}
      </div>

      {/* ── Recent orders ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Сүүлийн захиалгууд</h2>
          <Link href="/dashboard/orders" className="text-white/40 hover:text-white text-xs transition-colors">
            Бүгдийг харах →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="text-white/30 text-sm">Захиалга байхгүй байна.</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm text-white">
                <thead className="bg-slate-800 text-white/50 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Нэр</th>
                    <th className="px-4 py-3 text-left">Дүн</th>
                    <th className="px-4 py-3 text-left">Огноо</th>
                    <th className="px-4 py-3 text-left">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stats.recentOrders.map(order => {
                    const s = STATUS_CONFIG[order.status]
                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-white/30 text-xs">#{order.id.slice(-8).toUpperCase()}</td>
                        <td className="px-4 py-3 font-medium">{order.customerName}</td>
                        <td className="px-4 py-3 font-semibold">{fmt(order.totalAmount)}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{new Date(order.createdAt).toLocaleDateString("mn-MN")}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 w-fit ${s.bg} ${s.color} ${s.border}`}>
                            {s.icon} {s.statusLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2">
              {stats.recentOrders.map(order => {
                const s = STATUS_CONFIG[order.status]
                return (
                  <div key={order.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{order.customerName}</p>
                      <p className="text-white/30 text-xs font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-semibold text-sm">{fmt(order.totalAmount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${s.bg} ${s.color} ${s.border}`}>
                        {s.statusLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}