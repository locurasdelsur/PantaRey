"use client"

import { EnhancedCSPDiagnostics } from "@/components/enhanced-csp-diagnostics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Terminal, ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function DebugPage() {
  const testGoogleSignIn = async () => {
    try {
      console.log("🧪 Testing Google Sign-In manually...")
      const { driveStorage } = await import("@/lib/google-drive-storage")

      const authResult = await driveStorage.authenticateOnly()

      if (authResult.success) {
        alert("✅ Google Sign-In test successful!")
      } else {
        alert(`❌ Google Sign-In test failed: ${authResult.error}`)
      }
    } catch (error: any) {
      console.error("Test error:", error)
      alert(`❌ Test error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-800 mb-4 inline-flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Debug & Diagnostics</h1>
                <p className="text-slate-600">Herramientas de diagnóstico para Google Drive y CSP</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>
        </div>

        {/* Instructions */}
        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <Terminal className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <div className="space-y-2">
              <p>
                <strong>Esta página es para debugging de la integración con Google Drive.</strong>
              </p>
              <div className="text-sm space-y-1">
                <p>• Ejecuta diagnósticos para identificar problemas de CSP</p>
                <p>• Monitorea violaciones de CSP en tiempo real</p>
                <p>• Copia la configuración CSP recomendada</p>
                <p>• Prueba la autenticación de Google manualmente</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Quick Test */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-green-500" />
              Test Manual de Google Sign-In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={testGoogleSignIn}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                🧪 Probar Autenticación
              </Button>
              <p className="text-sm text-slate-600">Ejecuta un test manual de la autenticación con Google Drive</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Diagnostics */}
        <EnhancedCSPDiagnostics />

        {/* Links útiles */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-slate-800">Enlaces Útiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Google Cloud Console</h4>
                <div className="space-y-1">
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    OAuth 2.0 Credentials
                  </a>
                  <a
                    href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                    target="_blank"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Google Drive API
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Netlify</h4>
                <div className="space-y-1">
                  <a
                    href="https://app.netlify.com"
                    target="_blank"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Netlify Dashboard
                  </a>
                  <a
                    href="https://docs.netlify.com/routing/headers/"
                    target="_blank"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Headers Documentation
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
