// 📁 components/admin/AddCategoryModal.tsx
"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"

interface Props { onSuccess?: () => void }

export default function AddCategoryModal({ onSuccess }: Props) {
  const { toasts, remove, success, error } = useToast()
  const [open,    setOpen]    = useState(false)
  const [name,    setName]    = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return error("Category нэр оруулна уу.")
    try {
      setLoading(true)
      const res  = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      success(`"${name.trim()}" category нэмэгдлээ! ✓`)
      setName("")
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
        Add Category
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Add Category</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Category name"
                className="bg-slate-800 border-slate-700 text-white"
                autoFocus
              />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-950 hover:bg-slate-800">
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} />Creating...</> : "Create"}
            </Button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}