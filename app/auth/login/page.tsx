"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, Cloud, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { driveStorage } from "@/lib/google-drive-storage"

interface User {
  id: number
  name: string
  email: string
  password: string
  instrument: string
  joinDate: string
  avatar: string
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initStatus, setInitStatus] = useState("Conectando con Google Drive...")
  const [showRetry, setShowRetry] = useState(false)
  const router = useRouter()

  // Inicializar Google Drive
  useEffect(() => {
    initializeSystem()
  }, [])

  const initializeSystem = async () => {
    try {
      setIsInitializing(true)
      setShowRetry(false)
      setError("")
      setInitStatus("Conectando con Google Drive...")

      // Inicializar Google Drive
      await driveStorage.initialize()
      setInitStatus("Verificando permisos...")

      // Verificar conexión
      if (!driveStorage.isConnected()) {
        throw new Error("No se pudo establecer conexión con Google Drive")
      }

      setInitStatus("¡Sistema listo!")
      setTimeout(() => setIsInitializing(false), 1000)
    } catch (err) {
      console.error("Error inicializando sistema:", err)

      // Convierte siempre a string para evitar TypeErrors
      const raw = typeof err === "string" ? err : ((err as Error)?.message ?? String(err))
      let errorMessage = "Error conectando con Google Drive"

      if (raw.includes("Faltan credenciales")) {
        errorMessage = "Configuración incompleta. Verifica las variables de entorno."
      } else if (raw.includes("autorizar")) {
        errorMessage = "Necesitas autorizar el acceso a Google Drive para continuar."
      } else if (raw.includes("denegado")) {
        errorMessage = "Acceso denegado. La aplicación necesita permisos de Google Drive."
      }

      setError(errorMessage)
      setShowRetry(true)
      setIsInitializing(false)
    }
  }

  const handleRetry = async () => {
    await driveStorage.reconnect()
    await initializeSystem()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Verificar que Google Drive esté conectado
      if (!driveStorage.isConnected()) {
        throw new Error("Google Drive no está conectado. Intenta reconectar.")
      }

      const users = await driveStorage.loadData("users.json")

      if (!users || users.length === 0) {
        throw new Error("No hay usuarios registrados. Regístrate primero.")
      }

      const user = users.find((u: User) => u.email === email && u.password === password)

      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user))
        router.push("/")
      } else {
        setError("Email o contraseña incorrectos")
      }
    } catch (error: any) {
      console.error("Error en login:", error)
      setError(error.message || "Error al iniciar sesión")
    }

    setIsLoading(false)
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center p-4">
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Inicializando Sistema</h3>
            <p className="text-slate-600 text-sm">{initStatus}</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-blue-600">
              <Cloud className="h-4 w-4" />
              <span className="text-xs">Google Drive</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Panta Rei Project" width={80} height={80} className="drop-shadow-lg" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Panta Rei Project</h1>
          <p className="text-slate-600 flex items-center justify-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            Almacenado en Google Drive
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-slate-800">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Accede a tu cuenta sincronizada con Google Drive
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error de conexión con botón de reintento */}
            {showRetry && (
              <Alert className="border-red-200 bg-red-50 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-600">
                  <div className="mb-2">{error}</div>
                  <Button onClick={handleRetry} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar conexión
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {error && !showRetry && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200"
                    required
                    disabled={showRetry}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-50 border-slate-200"
                    required
                    disabled={showRetry}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    disabled={showRetry}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                disabled={isLoading || showRetry}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Conectando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                ¿No tienes cuenta?{" "}
                <Link href="/auth/register" className="text-amber-600 hover:text-amber-700 font-medium">
                  Regístrate aquí
                </Link>
              </p>
            </div>

            {/* Información sobre Google Drive */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Almacenamiento en Google Drive</span>
              </div>
              <p className="text-xs text-blue-700">
                Todos los datos se guardan automáticamente en tu Google Drive y son accesibles para todos los miembros
                de la banda.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
