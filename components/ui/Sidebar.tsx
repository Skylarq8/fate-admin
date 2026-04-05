// 📁 components/admin/Sidebar.tsx
"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  HomeIcon, BoxIcon, TagIcon, ShoppingCartIcon,
  ChartPieIcon, TicketIcon, PanelRight, X,
} from "lucide-react"

interface NavItem { title: string; href: string; icon: React.ReactNode }

const navItems: NavItem[] = [
  { title: "Тойм",   href: "/dashboard/overview",   icon: <HomeIcon         size={22} /> },
  { title: "Бараа",   href: "/dashboard/products",   icon: <BoxIcon          size={22} /> },
  { title: "Категори", href: "/dashboard/categories", icon: <TagIcon          size={22} /> },
  { title: "Захиалга",     href: "/dashboard/orders",     icon: <ShoppingCartIcon size={22} /> },
  { title: "Купон",    href: "/dashboard/coupons",    icon: <TicketIcon       size={22} /> },
  { title: "Статистик",  href: "/dashboard/analytics",  icon: <ChartPieIcon     size={22} /> },
]

export default function Sidebar() {
  const [open,       setOpen]       = useState(false)  // desktop: шахах
  const [mobileOpen, setMobileOpen] = useState(false)  // mobile: overlay
  const pathname = usePathname()

  const NavLinks = ({ expanded }: { expanded: boolean }) => (
    <nav className="mt-4 flex flex-col gap-1 px-2 flex-1 overflow-y-auto">
      {navItems.map(item => {
        const active = pathname === item.href
        return (
          <Link
            key={item.title}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-colors",
              active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white",
              expanded ? "px-4" : "justify-center",
            )}
          >
            <span className="flex items-center justify-center w-6 h-6 flex-shrink-0">
              {item.icon}
            </span>
            {expanded && <span className="truncate">{item.title}</span>}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* ── Desktop sidebar — шахдаг ── */}
      <aside className={cn(
        "hidden md:flex flex-col flex-shrink-0 h-full bg-slate-950 text-slate-100",
        "transition-all duration-300 overflow-hidden",
        open ? "w-64" : "w-16",
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0">
          {open && <span className="text-xl font-bold truncate">Admin</span>}
          <button onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 transition-colors ml-auto">
            <PanelRight className={cn("w-5 h-5 transition-transform", open ? "rotate-180" : "")} />
          </button>
        </div>
        <NavLinks expanded={open} />
      </aside>

      {/* ── Mobile: icon-only bar + overlay drawer ── */}
      <aside className="md:hidden flex flex-col flex-shrink-0 h-full w-16 bg-slate-950 text-slate-100">
        <div className="h-16 flex items-center justify-center border-b border-slate-800 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 transition-colors">
            <PanelRight size={20} />
          </button>
        </div>
        <NavLinks expanded={false} />
      </aside>

      {/* ── Mobile overlay drawer ── */}
      {mobileOpen && (
        <>
          {/* backdrop */}
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
          {/* drawer */}
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-950 text-slate-100 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0">
              <span className="text-xl font-bold">Admin</span>
              <button onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800 transition-colors">
                <PanelRight size={20} />
              </button>
            </div>
            <NavLinks expanded={true} />
          </div>
        </>
      )}
    </>
  )
}