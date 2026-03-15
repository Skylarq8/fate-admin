import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full bg-slate-800 rounded-lg pl-2 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-800",
        className
      )}
      {...props}
    />
  )
}

export { Input }
