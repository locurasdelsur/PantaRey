"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Music } from "lucide-react"
import Image from "next/image"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authStatus = localStorage.getItem("isAuthenticated")
        const authTime = localStorage.getItem("authTime")

        if (authStatus === "true" && authTime) {
          // Verificar que la sesión no sea muy antigua (24 horas)
          const authTimestamp = Number.parseInt(authTime)
          const now = Date.now()
          const twentyFourHours = 24 * 60 * 60 * 1000

          if (now - authTimestamp < twentyFourHours) {
            setIsAuthenticated(true)
          } else {
            // Sesión expirada
            localStorage.removeItem("isAuthenticated")
            localStorage.removeItem("authTime")
            localStorage.removeItem("currentUser")
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated === false && pathname !== "/auth/login") {
      router.push("/auth/login")
    }
  }, [isAuthenticated, pathname, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Cargando</h3>
            <p className="text-slate-600 text-sm">Verificando acceso...</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-amber-600">
              <Music className="h-4 w-4" />
              <span className="text-xs">Panta Rei Project</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated
  if (isAuthenticated === false) {
    return null // Router will redirect
  }

  // Authenticated
  return <>{children}</>
}
