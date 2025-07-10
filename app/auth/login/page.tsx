"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, LogIn, Music, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Simulate login logic
      if (email && password) {
        localStorage.setItem("userEmail", email)
        localStorage.setItem("isAuthenticated", "true")
        router.push("/")
      } else {
        setError("Por favor completa todos los campos")
      }
    } catch (error) {
      setError("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link href="/" className="text-slate-600 hover:text-slate-800 mb-6 inline-flex items-center gap-2 font-medium">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        {/* Login Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={80} height={80} className="drop-shadow-lg" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 mb-2">Iniciar Sesión</CardTitle>
            <p className="text-slate-600">Accede a tu cuenta de Panta Rei Project</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="pl-10 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">o</span>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-slate-600">
                  ¿No tienes cuenta?{" "}
                  <Link href="/auth/register" className="text-amber-600 hover:text-amber-700 font-medium">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-500 text-sm">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Music className="h-4 w-4" />
            <span>Panta Rei Project</span>
          </div>
          <p>Gestión integral para bandas musicales</p>
        </div>
      </div>
    </div>
  )
}
