// 📁 hooks/useToast.ts
import { useState, useCallback } from "react"
import { ToastData, ToastType } from "@/components/ui/toast"

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const add = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message: string) => add(message, "success"), [add])
  const error   = useCallback((message: string) => add(message, "error"),   [add])

  return { toasts, remove, success, error }
}