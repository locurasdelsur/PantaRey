"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, User, Mail, Lock, Guitar, Cloud } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { driveDataManager } from "@/lib/drive-data-manager"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    instrument: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const instruments = [
    { value: "guitarra", label: "Guitarra" },
    { value: "bajo", label: "Bajo" },
    { value: "bateria", label: "Batería" },
    { value: "teclado", label: "Teclado" },
    { value: "voz", label: "Voz" },
    { value: "otro", label: "Otro" },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      // Cargar usuarios existentes desde Google Drive
      const users = await driveDataManager.getUsers()

      // Verificar si el email ya existe
      if (users.find((u) => u.email === formData.email)) {
        setError("Ya existe un usuario con este email")
        setIsLoading(false)
        return
      }

      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        instrument: formData.instrument,
        joinDate: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=f59e0b&color=fff`,
      }

      // Agregar usuario a Google Drive
      await driveDataManager.addUser(newUser)

      // Guardar usuario actual
      localStorage.setItem("currentUser", JSON.stringify(newUser))

      router.push("/")
    } catch (error) {
      console.error("Error en registro:", error)
      setError("Error al crear la cuenta. Verifica tu conexión a Google Drive.")
    }

    setIsLoading(false)
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
            Únete a la banda
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-slate-800">Crear Cuenta</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Tu cuenta se sincronizará con Google Drive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-slate-50 border-slate-200"
                    required
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-slate-50 border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrument" className="text-slate-700">
                  Instrumento principal
                </Label>
                <div className="relative">
                  <Guitar className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                  <Select
                    value={formData.instrument}
                    onValueChange={(value) => setFormData({ ...formData, instrument: value })}
                  >
                    <SelectTrigger className="pl-10 bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Selecciona tu instrumento" />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((instrument) => (
                        <SelectItem key={instrument.value} value={instrument.value}>
                          {instrument.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-slate-50 border-slate-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 bg-slate-50 border-slate-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Guardando en Drive...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Crear Cuenta
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Almacenamiento en Google Drive</span>
              </div>
              <p className="text-xs text-blue-700">
                Tu cuenta y todos los datos se guardarán automáticamente en Google Drive y serán accesibles para todos
                los miembros.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
