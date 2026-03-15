import * as React from "react"

import { cn } from "@/lib/utils"
import { useState } from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <textarea
      data-slot="textarea"
      value={value}
      onChange={handleChange}
      className={cn(
        "flex field-sizing-content min-h-16 w-full bg-slate-800 pl-2 pt-1 rounded-lg placeholder-white/20 text-white " +
          "focus:outline-none focus:ring-2 focus:ring-blue-800 resize-none overflow-hidden px-2",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
