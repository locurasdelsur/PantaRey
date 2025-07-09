"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Music, Calendar, CheckSquare, Lightbulb, MessageCircle, Camera, LogOut, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/", icon: Music, label: "Dashboard" },
  { href: "/canciones", icon: Music, label: "Canciones" },
  { href: "/calendario", icon: Calendar, label: "Calendario" },
  { href: "/tareas", icon: CheckSquare, label: "Tareas" },
  { href: "/ideas", icon: Lightbulb, label: "Ideas" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/fotos", icon: Camera, label: "Fotos" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/auth/login")
  }

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "{}") : {}

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="text-slate-600">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-white">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 pb-6 border-b">
              <Image src="/logo.png" alt="Panta Rei Project" width={40} height={40} />
              <div>
                <h2 className="font-bold text-slate-800">Panta Rei</h2>
                <p className="text-sm text-slate-600">Project</p>
              </div>
            </div>

            {/* User Info */}
            <div className="py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{currentUser.name}</p>
                  <p className="text-sm text-slate-600">{currentUser.instrument}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Logout */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
