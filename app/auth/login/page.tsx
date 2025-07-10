"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Music, ArrowLeft, Key } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Verificar la clave fija
      if (password === "pantarei") {
        // Guardar autenticación
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem("authTime", Date.now().toString())

        // Crear usuario por defecto
        const defaultUser = {
          id: 1,
          name: "Miembro de Panta Rei",
          email: "banda@pantarei.com",
          instrument: "Múltiple",
          joinDate: new Date().toISOString(),
          avatar: "https://ui-avatars.com/api/?name=Panta+Rei&background=f59e0b&color=fff",
        }

        localStorage.setItem("currentUser", JSON.stringify(defaultUser))

        console.log("✅ Autenticación exitosa con clave fija")
        router.push("/")
      } else {
        setError("Clave incorrecta. Intenta de nuevo.")
      }
    } catch (error) {
      console.error("❌ Error en login:", error)
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
            <CardTitle className="text-2xl font-bold text-slate-800 mb-2">Acceso a Panta Rei</CardTitle>
            <p className="text-slate-600">Ingresa la clave de acceso de la banda</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Clave de Acceso
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa la clave de la banda"
                    className="pl-10 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">Solicita la clave de acceso a cualquier miembro de la banda</p>
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
                    Verificando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Acceder
                  </div>
                )}
              </Button>
            </form>

            {/* Info sobre la banda */}
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Music className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Panta Rei Project</span>
              </div>
              <p className="text-sm text-amber-700">
                Sistema de gestión integral para la banda. Una vez dentro, todos los datos se sincronizan
                automáticamente con Google Drive.
              </p>
            </div>
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
