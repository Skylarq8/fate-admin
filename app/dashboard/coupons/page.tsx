// 📁 app/dashboard/coupons/page.tsx
"use client"

import { useEffect, useState } from "react"
import { X, Trash2, Loader2, Tag, Infinity } from "lucide-react"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import AddCouponDrawer from "@/components/admin/AddCouponDrawer"

interface Coupon {
  id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  usageLimit: number | null
  usedCount: number
  expiresAt: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

function CouponDetailModal({ coupon: initial, onClose, onUpdated, onDeleted }: {
  coupon: Coupon
  onClose: () => void
  onUpdated: (c: Coupon) => void
  onDeleted: (id: string) => void
}) {
  const { toasts, remove, success, error } = useToast()
  const [coupon, setCoupon] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"
  const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false

  const toggleActive = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      })
      const data = await res.json()
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      setCoupon(data.data)
      onUpdated(data.data)
      success(data.data.active ? "Идэвхжүүлэгдлээ ✓" : "Идэвхгүй болгогдлоо ✓")
    } catch { error("Сүлжээний алдаа.") }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, { method: "DELETE" })
      if (!res.ok) return error("Устгахад алдаа гарлаа.")
      success("Coupon устгагдлаа.")
      setTimeout(() => { onDeleted(coupon.id); onClose() }, 800)
    } catch { error("Сүлжээний алдаа.") }
    finally { setDeleting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full p-1.5 transition-colors">
          <X size={16} />
        </button>

        <div className="p-6 space-y-5">
          <div className="pr-10">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-white font-mono">{coupon.code}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                !coupon.active || isExpired
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-green-500/10 text-green-400 border-green-500/30"
              }`}>
                {isExpired ? "Дууссан" : coupon.active ? "Идэвхтэй" : "Идэвхгүй"}
              </span>
            </div>
            <p className="text-white/30 text-xs mt-1">
              Үүсгэсэн: {new Date(coupon.createdAt).toLocaleDateString("mn-MN")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
              <p className="text-white/40 text-xs mb-1">Хөнгөлөлт</p>
              <p className="text-white font-bold text-lg">
                {coupon.discountType === "percentage" 
                  ? `${coupon.discountValue}%` 
                  : fmt(coupon.discountValue)
                }
              </p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
              <p className="text-white/40 text-xs mb-1">Ашигласан</p>
              <p className="text-white font-bold text-lg">
                {coupon.usageLimit 
                  ? `${coupon.usedCount} / ${coupon.usageLimit}`
                  : <span className="flex items-center gap-1 text-green-400">
                      <Infinity size={16} /> {coupon.usedCount}
                    </span>
                }
              </p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
            <p className="text-white/40 text-xs mb-1">Дуусах огноо</p>
            <p className={`font-medium text-sm ${isExpired ? "text-red-400" : "text-white"}`}>
              {coupon.expiresAt 
                ? new Date(coupon.expiresAt).toLocaleDateString("mn-MN")
                : "Хязгааргүй"
              }
            </p>
          </div>

          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
            <div>
              <p className="text-white text-sm font-medium">Идэвхтэй эсэх</p>
              <p className="text-white/40 text-xs mt-0.5">{coupon.active ? "Coupon одоо ашиглах боломжтой" : "Coupon идэвхгүй байна"}</p>
            </div>
            <button onClick={toggleActive} disabled={loading || isExpired}
              className={`relative w-12 h-6 rounded-full transition-colors ${coupon.active && !isExpired ? "bg-green-500" : "bg-slate-600"} ${isExpired ? "opacity-40 cursor-not-allowed" : ""}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${coupon.active && !isExpired ? "left-7" : "left-1"}`} />
            </button>
          </div>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl text-sm transition-colors">
              <Trash2 size={15} /> Устгах
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
      </div>
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  )
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Coupon | null>(null)

  const fetchCoupons = async () => {
    setLoading(true)
    const res = await fetch("/api/coupons")
    const data = await res.json()
    setCoupons(data.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchCoupons() }, [])

  const fmt = (n: number) => new Intl.NumberFormat("mn-MN").format(n) + "₮"

  const handleUpdated = (updated: Coupon) =>
    setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c))

  const handleDeleted = (id: string) =>
    setCoupons(prev => prev.filter(c => c.id !== id))

  const active = coupons.filter(c => c.active && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length
  const expired = coupons.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length
  const inactive = coupons.filter(c => !c.active && (!c.expiresAt || new Date(c.expiresAt) >= new Date())).length

  return (
    <div className="py-4 px-1 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Хөнгөлөлтийн купон</h1>
        <AddCouponDrawer onSuccess={fetchCoupons} />
      </div>

      {!loading && coupons.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Нийт", value: coupons.length, color: "text-white", bg: "bg-slate-800/60", border: "border-slate-700" },
            { label: "Идэвхтэй", value: active, color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" },
            { label: "Идэвхгүй", value: inactive, color: "text-white/40", bg: "bg-slate-800/40", border: "border-slate-700" },
            { label: "Дууссан", value: expired, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
              <p className="text-white/40 text-xs mb-2">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-white/40 text-sm">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="text-white/40 text-sm">Coupon байхгүй байна.</div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm text-white">
              <thead className="bg-slate-800 text-white/50 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Код</th>
                  <th className="px-4 py-3 text-left">Хөнгөлөлт</th>
                  <th className="px-4 py-3 text-left">Ашигллах тоо</th>
                  <th className="px-4 py-3 text-left">Дуусах огноо</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {coupons.map(coupon => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                  return (
                    <tr key={coupon.id} onClick={() => setSelected(coupon)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white">{coupon.code}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {coupon.discountType === "percentage" 
                          ? `${coupon.discountValue}%` 
                          : fmt(coupon.discountValue)
                        }
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs">
                        {coupon.usageLimit 
                          ? `${coupon.usedCount} / ${coupon.usageLimit}`
                          : <span className="flex items-center gap-1 text-green-400">
                              <Infinity size={12} /> {coupon.usedCount}
                            </span>
                        }
                      </td>
                      <td className={`px-4 py-3 text-xs ${isExpired ? "text-red-400" : "text-white/60"}`}>
                        {coupon.expiresAt 
                          ? new Date(coupon.expiresAt).toLocaleDateString("mn-MN")
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${
                          isExpired
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : coupon.active
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : "bg-slate-700 text-white/40 border-slate-600"
                        }`}>
                          {isExpired ? "Дууссан" : coupon.active ? "Идэвхтэй" : "Идэвхгүй"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {coupons.map(coupon => {
              const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
              return (
                <div key={coupon.id} onClick={() => setSelected(coupon)}
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 cursor-pointer active:bg-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono font-bold text-white text-lg">{coupon.code}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ${
                      isExpired
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : coupon.active
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-slate-700 text-white/40 border-slate-600"
                    }`}>
                      {isExpired ? "Дууссан" : coupon.active ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-white font-semibold text-sm">
                      {coupon.discountType === "percentage" 
                        ? `${coupon.discountValue}%` 
                        : fmt(coupon.discountValue)
                      }
                    </p>
                    <span className="text-white/30">·</span>
                    <p className="text-white/50 text-xs">
                      {coupon.usageLimit 
                        ? `${coupon.usedCount}/${coupon.usageLimit}`
                        : "Хязгааргүй"
                      }
                    </p>
                    <span className="text-white/30">·</span>
                    <p className={`text-xs ${isExpired ? "text-red-400" : "text-white/50"}`}>
                      {coupon.expiresAt 
                        ? new Date(coupon.expiresAt).toLocaleDateString("mn-MN")
                        : "—"
                      }
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {selected && (
        <CouponDetailModal
          coupon={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}