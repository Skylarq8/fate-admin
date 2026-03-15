// 📁 components/ui/toast.tsx
"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

export type ToastType = "success" | "error"

export interface ToastData {
  id: number
  message: string
  type: ToastType
}

interface ToastProps {
  toasts: ToastData[]
  remove: (id: number) => void
}

function ToastItem({ toast, remove }: { toast: ToastData; remove: (id: number) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(() => remove(toast.id), 300)
    }, 3000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [])

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium
      transition-all duration-300 ease-out
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      ${toast.type === "success"
        ? "bg-slate-900 border-green-500/40 text-white"
        : "bg-slate-900 border-red-500/40 text-white"
      }
    `}>
      {toast.type === "success"
        ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
        : <XCircle     size={16} className="text-red-400 flex-shrink-0" />
      }
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => remove(toast.id), 300) }}
        className="text-white/30 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, remove }: ToastProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 w-72 md:w-80">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} remove={remove} />
      ))}
    </div>
  )
}