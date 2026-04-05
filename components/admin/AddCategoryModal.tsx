// 📁 components/admin/AddCategoryModal.tsx
"use client"

import { useState, useEffect } from "react"
import { X, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"

interface FlatCategory {
  id: string
  name: string
  parentId: string | null
}

interface Props {
  onSuccess?: () => void
}

export default function AddCategoryModal({ onSuccess }: Props) {
  const { toasts, remove, success, error } = useToast()
  const [open,       setOpen]       = useState(false)
  const [name,       setName]       = useState("")
  const [parentId,   setParentId]   = useState<string>("")
  const [flatCats,   setFlatCats]   = useState<FlatCategory[]>([])
  const [loading,    setLoading]    = useState(false)

  // Modal нээгдэх үед flat category list татна
  useEffect(() => {
    if (!open) return
    fetch("/api/categories?flat=true")
      .then(r => r.json())
      .then(d => setFlatCats(d.data ?? []))
      .catch(() => {})
  }, [open])

  const handleSubmit = async () => {
    if (!name.trim()) return error("Category нэр оруулна уу.")
    try {
      setLoading(true)
      const res = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     name.trim(),
          parentId: parentId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) return error(data.message || "Алдаа гарлаа.")
      success(`"${name.trim()}" category нэмэгдлээ! ✓`)
      setName("")
      setParentId("")
      setTimeout(() => { setOpen(false); onSuccess?.() }, 1000)
    } catch {
      error("Сүлжээний алдаа гарлаа.")
    } finally {
      setLoading(false)
    }
  }

  // Dropdown-д харуулах label: indent-ээр depth харуулна
  const getLabel = (cat: FlatCategory): string => {
    const names: string[] = []
    let current: FlatCategory | undefined = cat

    while (current) {
      names.unshift(current.name)
      current = flatCats.find(c => c.id === current!.parentId)
    }

    return names.length === 1
      ? `📁 ${names[0]}`
      : `↳ ${names.join(" / ")}`
  }
  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-sm bg-white/90 text-slate-900">
        Категори нэмэх
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
              <h2 className="text-white font-semibold text-lg">Категори нэмэх</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-white">Категори нэр</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Категори нэр оруулна уу"
                className="bg-slate-800 border-slate-700 text-white"
                autoFocus
              />
            </div>

            {/* Parent category (optional) */}
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">
                Parent category
                <span className="text-white/30 ml-1">(заавал биш)</span>
              </Label>
              <div className="relative">
                <select
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-md px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">— Root category —</option>
                  {flatCats
                    .slice()
                    .reverse()
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {getLabel(cat)}
                      </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-slate-950 py-5 hover:bg-slate-800"
            >
              {loading
                ? <><Loader2 className="animate-spin mr-2" size={16} />Категори үүсгэж байна...</>
                : "Категори үүсгэх"
              }
            </Button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  )
}