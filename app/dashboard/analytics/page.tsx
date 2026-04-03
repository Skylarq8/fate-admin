// 📁 app/dashboard/analytics/page.tsx
"use client"

import { useEffect, useState } from "react"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────
interface Order {
  id: string
  totalAmount: number
  status: "pending" | "confirmed" | "delivered"
  createdAt: string
}

interface ProductImage { isPrimary: boolean; url: string }
interface Product {
  id: string
  title: string
  price: number
  finalPrice: number | null
  discountEnabled: boolean
  images: ProductImage[]
  categories: { category: { name: string } }[]
  _orderCount?: number
}

interface OrderItem {
  productId: string
  quantity: number
}

interface OrderWithItems extends Order {
  items: OrderItem[]
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_COLORS = { pending: "#f59e0b", confirmed: "#3b82f6", delivered: "#22c55e" }
const STATUS_LABELS = { pending: "Хүлээгдэж буй", confirmed: "Баталгаажсан", delivered: "Хүргэгдсэн" }

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm shadow-xl">
      {label && <p className="text-white/50 text-xs mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === "Орлого" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [orders,   setOrders]   = useState<OrderWithItems[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
    ]).then(([o, p]) => {
      setOrders(o.data ?? [])
      setProducts(p.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="py-6 px-1 text-white/40 text-sm">Loading...</div>

  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"
  const today = new Date()

  // ── 1. Order status donut ──────────────────────────────────────────────────
  const statusData = (["pending", "confirmed", "delivered"] as const)
    .map(s => ({ name: STATUS_LABELS[s], value: orders.filter(o => o.status === s).length, color: STATUS_COLORS[s] }))
    .filter(d => d.value > 0)

  // ── 2. Daily orders — last 14 days ────────────────────────────────────────
  const dailyOrderMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    dailyOrderMap[d.toLocaleDateString("mn-MN")] = 0
  }
  orders.forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString("mn-MN")
    if (dailyOrderMap[d] !== undefined) dailyOrderMap[d]++
  })
  const dailyOrderData = Object.entries(dailyOrderMap).map(([date, count]) => ({ date: date.slice(5), Захиалга: count }))

  // ── 3. Daily revenue — last 14 days ──────────────────────────────────────
  const dailyRevenueMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    dailyRevenueMap[d.toLocaleDateString("mn-MN")] = 0
  }
  orders.filter(o => o.status === "delivered").forEach(o => {
    const d = new Date(o.createdAt).toLocaleDateString("mn-MN")
    if (dailyRevenueMap[d] !== undefined) dailyRevenueMap[d] += o.totalAmount
  })
  const revenueData = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({ date: date.slice(5), Орлого: revenue }))

  // ── 4. Most/least ordered products ───────────────────────────────────────
  const productOrderCount: Record<string, number> = {}
  orders.forEach(o => {
    (o.items ?? []).forEach(item => {
      productOrderCount[item.productId] = (productOrderCount[item.productId] ?? 0) + item.quantity
    })
  })

  const productsWithCount = products.map(p => ({
    ...p,
    count: productOrderCount[p.id] ?? 0,
  }))

  const top5    = [...productsWithCount].sort((a, b) => b.count - a.count).slice(0, 5)
  const bottom5 = [...productsWithCount].sort((a, b) => a.count - b.count).slice(0, 5)

  const tickFmt = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000   ? `${(v / 1_000).toFixed(0)}K`
    : String(v)

  // ─── Product rank row ───────────────────────────────────────────────────
  const ProductRow = ({ product, rank, type }: { product: typeof top5[0]; rank: number; type: "top" | "bottom" }) => {
    const img = product.images?.find(i => i.isPrimary) ?? product.images?.[0]
    const price = product.discountEnabled && product.finalPrice ? product.finalPrice : product.price
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
        <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${
          type === "top" ? "text-green-400" : "text-white/20"
        }`}>{rank}</span>
        {img
          ? <img src={img.url} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
          : <div className="w-10 h-10 bg-slate-700 rounded-lg flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{product.title}</p>
          <p className="text-white/40 text-xs">{fmt(price)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${type === "top" ? "text-green-400" : "text-white/30"}`}>
            {product.count}
          </p>
          <p className="text-white/30 text-xs">ширхэг</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 px-1 md:p-6 space-y-6 pb-16">
      <h1 className="text-xl md:text-2xl font-bold text-white">Статистик</h1>

      {/* ── Row 1: Donut + Daily orders ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1">Захиалгын статус</h3>
          <p className="text-white/30 text-xs mb-4">Нийт {orders.length} захиалга</p>
          {statusData.length === 0 ? (
            <p className="text-white/30 text-sm py-10 text-center">Захиалга байхгүй.</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span className="text-white/60 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1">Өдрийн захиалга</h3>
          <p className="text-white/30 text-xs mb-4">Сүүлийн 14 хоног</p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={dailyOrderData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Захиалга" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Revenue line ── */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-1">Орлогын динамик</h3>
        <p className="text-white/30 text-xs mb-4">Сүүлийн 14 хоног · зөвхөн хүргэгдсэн захиалга</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} />
            <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={tickFmt} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Орлого" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row 3: Top & bottom products ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Most ordered */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-400" />
            <h3 className="text-white font-semibold">Их зарагдсан бараа</h3>
          </div>
          {top5.every(p => p.count === 0) ? (
            <p className="text-white/30 text-sm py-6 text-center">Захиалга байхгүй.</p>
          ) : (
            <div>
              {top5.map((p, i) => <ProductRow key={p.id} product={p} rank={i + 1} type="top" />)}
            </div>
          )}
        </div>

        {/* Least ordered */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-red-500" />
            <h3 className="text-white font-semibold">Бага зарагдсан бараа</h3>
          </div>
          {products.length === 0 ? (
            <p className="text-white/30 text-sm py-6 text-center">Бараа байхгүй.</p>
          ) : (
            <div>
              {bottom5.map((p, i) => <ProductRow key={p.id} product={p} rank={i + 1} type="bottom" />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}