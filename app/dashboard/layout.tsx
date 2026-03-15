// 📁 app/dashboard/layout.tsx
// import Sidebar from "@/components/ui/Sidebar"

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="flex h-screen overflow-hidden bg-slate-900">
//       {/* Sidebar — full height via h-screen flex */}
//       <Sidebar />

//       {/* Main content — scroll only here */}
//       <main className="flex-1 px-4 lg:px-10 pt-4 lg:pt-10">
//         {children}
//       </main>
//     </div>
//   )
// }

// 📁 app/dashboard/layout.tsx
import Sidebar from "@/components/ui/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-y-auto px-2 lg:px-10 pt-4 lg:pt-10">
        {children}
      </main>
    </div>
  )
}