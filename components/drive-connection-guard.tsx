"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import Image from "next/image"
import { driveStorage } from "@/lib/google-drive-storage"

interface DriveConnectionGuardProps {
  children: React.ReactNode
}

export function DriveConnectionGuard({ children }: DriveConnectionGuardProps) {
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error" | "credentials-missing">(
    "checking",
  )
  const [error, setError] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)

  const checkConnection = async () => {
    try {
      setConnectionStatus("checking")
      setError("")

      // Verificar credenciales primero
      if (!driveStorage.hasValidCredentials()) {
        setConnectionStatus("credentials-missing")
        setError("Las credenciales de Google Drive no están configuradas correctamente.")
        return
      }

      // Intentar inicializar Google Drive
      await driveStorage.initializeForDataOnly()

      if (driveStorage.isConnected()) {
        setConnectionStatus("connected")
        console.log("✅ Google Drive connected successfully")
      } else {
        throw new Error("Google Drive initialization failed")
      }
    } catch (error: any) {
      console.error("❌ Google Drive connection error:", error)
      setConnectionStatus("error")
      setError(error.message || "Error connecting to Google Drive")
    }
  }

  const retryConnection = async () => {
    setIsRetrying(true)
    await checkConnection()
    setIsRetrying(false)
  }

  useEffect(() => {
    checkConnection()
  }, [])

  // Checking connection
  if (connectionStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center p-4">
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Conectando a Google Drive</h3>
            <p className="text-slate-600 text-sm mb-4">Verificando conexión con el almacenamiento en la nube...</p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Cloud className="h-4 w-4" />
              <span className="text-xs">Sincronizando datos</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Credentials missing
  if (connectionStatus === "credentials-missing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center p-4">
        <Card className="bg-white/90 backdrop-blur-sm border-red-200 shadow-xl max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
            </div>
            <CardTitle className="text-xl text-red-800 flex items-center justify-center gap-2">
              <CloudOff className="h-5 w-5" />
              Configuración Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                <strong>Google Drive no configurado</strong>
                <br />
                Las credenciales de Google Drive son necesarias para el funcionamiento de la aplicación.
              </AlertDescription>
            </Alert>

            <div className="bg-slate-50 p-4 rounded-lg text-sm">
              <h4 className="font-semibold text-slate-800 mb-2">Variables de entorno requeridas:</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• NEXT_PUBLIC_GOOGLE_API_KEY</li>
                <li>• NEXT_PUBLIC_GOOGLE_CLIENT_ID</li>
              </ul>
            </div>

            <Button onClick={retryConnection} className="w-full" disabled={isRetrying}>
              {isRetrying ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verificando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Verificar de nuevo
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Connection error
  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center p-4">
        <Card className="bg-white/90 backdrop-blur-sm border-red-200 shadow-xl max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
            </div>
            <CardTitle className="text-xl text-red-800 flex items-center justify-center gap-2">
              <WifiOff className="h-5 w-5" />
              Error de Conexión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                <strong>No se puede conectar a Google Drive</strong>
                <br />
                {error}
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <h4 className="font-semibold text-blue-800 mb-2">Posibles soluciones:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Verifica tu conexión a internet</li>
                <li>• Permite popups en tu navegador</li>
                <li>• Verifica que las credenciales de Google estén correctas</li>
                <li>• Recarga la página e intenta de nuevo</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={retryConnection} className="flex-1" disabled={isRetrying}>
                {isRetrying ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Reintentando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                  </div>
                )}
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
                disabled={isRetrying}
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recargar página
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Connected - show children with connection indicator
  return (
    <div className="relative">
      {/* Connection status indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-green-700">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Wifi className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium">Google Drive conectado</span>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
