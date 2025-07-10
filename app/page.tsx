"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Music,
  Calendar,
  MessageSquare,
  Camera,
  CheckSquare,
  Lightbulb,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Wifi,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { driveStorage } from "@/lib/google-drive-storage"

interface User {
  id: number
  name: string
  email: string
  instrument: string
  joinDate: string
  avatar: string
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [driveStatus, setDriveStatus] = useState<"checking" | "connected" | "error" | "not-configured">("checking")
  const [driveError, setDriveError] = useState("")
  const [isInitializingDrive, setIsInitializingDrive] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación
    const authStatus = localStorage.getItem("isAuthenticated")
    const currentUser = localStorage.getItem("currentUser")

    if (authStatus !== "true" || !currentUser) {
      router.push("/auth/login")
      return
    }

    setUser(JSON.parse(currentUser))
    checkDriveConnection()
  }, [router])

  const checkDriveConnection = async () => {
    try {
      setDriveStatus("checking")
      setDriveError("")

      // Verificar si las credenciales están configuradas
      if (!driveStorage.hasValidCredentials()) {
        setDriveStatus("not-configured")
        setDriveError("Las credenciales de Google Drive no están configuradas.")
        return
      }

      // Verificar si ya está conectado
      if (driveStorage.isConnected()) {
        setDriveStatus("connected")
        return
      }

      // Intentar inicializar
      await driveStorage.initializeForDataOnly()
      setDriveStatus("connected")
    } catch (error: any) {
      console.error("Error connecting to Google Drive:", error)
      setDriveStatus("error")
      setDriveError(error.message || "Error connecting to Google Drive")
    }
  }

  const initializeDrive = async () => {
    setIsInitializingDrive(true)
    try {
      await driveStorage.initializeForDataOnly()
      setDriveStatus("connected")
      setDriveError("")
    } catch (error: any) {
      setDriveStatus("error")
      setDriveError(error.message || "Error initializing Google Drive")
    }
    setIsInitializingDrive(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("authTime")
    localStorage.removeItem("currentUser")
    router.push("/auth/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Panta Rei Project" width={40} height={40} className="drop-shadow-sm" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Panta Rei Project</h1>
                <p className="text-xs text-slate-600">Gestión de Banda</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Drive Status */}
              <div className="flex items-center gap-2">
                {driveStatus === "connected" && (
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs font-medium">Drive conectado</span>
                  </div>
                )}
                {driveStatus === "error" && (
                  <div className="flex items-center gap-1 text-red-600">
                    <CloudOff className="h-4 w-4" />
                    <span className="text-xs font-medium">Sin conexión</span>
                  </div>
                )}
                {driveStatus === "not-configured" && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-medium">No configurado</span>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-600">{user.instrument}</p>
                </div>
                <Image
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-amber-200"
                />
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Drive Connection Alert */}
        {driveStatus !== "connected" && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong>Google Drive no conectado:</strong> {driveError}
              </div>
              {driveStatus === "error" && (
                <Button onClick={initializeDrive} size="sm" disabled={isInitializingDrive}>
                  {isInitializingDrive ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Conectar Drive
                    </>
                  )}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Bienvenido, {user.name.split(" ")[0]}!</h2>
          <p className="text-slate-600">Gestiona todos los aspectos de Panta Rei Project desde aquí.</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Canciones */}
          <Link href="/canciones">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">Canciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Gestiona el repertorio de la banda, letras, acordes y grabaciones.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Calendario */}
          <Link href="/calendario">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">Calendario</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Organiza ensayos, conciertos y eventos importantes.</p>
              </CardContent>
            </Card>
          </Link>

          {/* Chat */}
          <Link href="/chat">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">Chat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Comunícate con los miembros de la banda en tiempo real.</p>
              </CardContent>
            </Card>
          </Link>

          {/* Fotos */}
          <Link href="/fotos">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">Fotos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Galería de fotos de conciertos, ensayos y momentos especiales.</p>
              </CardContent>
            </Card>
          </Link>

          {/* Tareas */}
          <Link href="/tareas">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">Tareas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Organiza y asigna tareas pendientes para la banda.</p>
              </CardContent>
            </Card>
          </Link>

          {/* Ideas */}
          <Link href="/ideas">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-800">Ideas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Comparte y desarrolla ideas musicales y creativas.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Music className="h-4 w-4" />
            <span>Panta Rei Project</span>
          </div>
          <p>Sistema de gestión integral para bandas musicales</p>
        </footer>
      </main>
    </div>
  )
}
