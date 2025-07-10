"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Shield, Globe } from "lucide-react"
import { driveStorage } from "@/lib/google-drive-storage"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export function CSPDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    try {
      // 1. Environment Variables Check
      const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      const hasClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

      results.push({
        name: "Environment Variables",
        status: hasApiKey && hasClientId ? "success" : "error",
        message:
          hasApiKey && hasClientId ? "All required environment variables present" : "Missing environment variables",
        details: `API Key: ${hasApiKey ? "✅" : "❌"}, Client ID: ${hasClientId ? "✅" : "❌"}`,
      })

      // 2. CSP Script Loading Test
      try {
        const script = document.createElement("script")
        script.src = "https://apis.google.com/js/api.js"
        document.head.appendChild(script)

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          setTimeout(reject, 5000) // 5 second timeout
        })

        results.push({
          name: "Google API Script Loading",
          status: "success",
          message: "Google API script loads successfully",
          details: "CSP script-src directive allows Google APIs",
        })
      } catch (error) {
        results.push({
          name: "Google API Script Loading",
          status: "error",
          message: "Failed to load Google API script",
          details: "CSP may be blocking script-src from googleapis.com",
        })
      }

      // 3. Google Drive Storage Test
      try {
        const isValid = await driveStorage.quickInit()
        results.push({
          name: "Google Drive Initialization",
          status: isValid ? "success" : "error",
          message: isValid ? "Google Drive client initialized successfully" : "Failed to initialize Google Drive",
          details: isValid ? "Credentials are valid and GAPI loaded" : "Check credentials format and CSP settings",
        })
      } catch (error: any) {
        results.push({
          name: "Google Drive Initialization",
          status: "error",
          message: "Google Drive initialization failed",
          details: error.message || "Unknown error",
        })
      }

      // 4. Domain Authorization Check
      const currentDomain = window.location.origin
      const isLocalhost = currentDomain.includes("localhost")
      const isNetlify = currentDomain.includes("netlify.app")

      results.push({
        name: "Domain Authorization",
        status: isLocalhost || isNetlify ? "success" : "warning",
        message: `Current domain: ${currentDomain}`,
        details: isLocalhost
          ? "Local development environment"
          : isNetlify
            ? "Netlify deployment detected"
            : "Ensure this domain is authorized in Google Cloud Console",
      })

      // 5. CSP Headers Check
      try {
        const response = await fetch(window.location.href, { method: "HEAD" })
        const cspHeader = response.headers.get("content-security-policy")
        const hasCSP = !!cspHeader

        results.push({
          name: "CSP Headers",
          status: hasCSP ? "success" : "warning",
          message: hasCSP ? "CSP headers detected" : "No CSP headers found",
          details: hasCSP ? "CSP policy is active" : "CSP may not be configured",
        })
      } catch (error) {
        results.push({
          name: "CSP Headers",
          status: "warning",
          message: "Could not check CSP headers",
          details: "Network error or CORS restriction",
        })
      }

      // 6. Browser Compatibility
      const userAgent = navigator.userAgent
      const isChrome = userAgent.includes("Chrome")
      const isFirefox = userAgent.includes("Firefox")
      const isSafari = userAgent.includes("Safari") && !userAgent.includes("Chrome")

      results.push({
        name: "Browser Compatibility",
        status: isChrome || isFirefox ? "success" : "warning",
        message: `Browser: ${isChrome ? "Chrome" : isFirefox ? "Firefox" : isSafari ? "Safari" : "Other"}`,
        details: isChrome || isFirefox ? "Fully supported browser" : "May have limited Google API support",
      })
    } catch (error: any) {
      results.push({
        name: "Diagnostic Error",
        status: "error",
        message: "Failed to complete diagnostics",
        details: error.message,
      })
    }

    setDiagnostics(results)
    setLastRun(new Date())
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const successCount = diagnostics.filter((d) => d.status === "success").length
  const errorCount = diagnostics.filter((d) => d.status === "error").length
  const warningCount = diagnostics.filter((d) => d.status === "warning").length

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            CSP & Google Drive Diagnostics
          </CardTitle>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-600 bg-transparent"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isRunning ? "Running..." : "Run Check"}
          </Button>
        </div>

        {lastRun && <p className="text-sm text-slate-600">Last run: {lastRun.toLocaleTimeString()}</p>}
      </CardHeader>

      <CardContent>
        {/* Summary */}
        <div className="flex gap-2 mb-4">
          <Badge className="bg-green-100 text-green-800 border-green-200">✅ {successCount} Passed</Badge>
          {warningCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠️ {warningCount} Warnings</Badge>
          )}
          {errorCount > 0 && <Badge className="bg-red-100 text-red-800 border-red-200">❌ {errorCount} Errors</Badge>}
        </div>

        {/* Overall Status */}
        {errorCount === 0 && warningCount === 0 ? (
          <Alert className="border-green-200 bg-green-50 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              🎉 All checks passed! Your Google Drive integration should work correctly.
            </AlertDescription>
          </Alert>
        ) : errorCount > 0 ? (
          <Alert className="border-red-200 bg-red-50 mb-4">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              ⚠️ Critical issues detected. Google Drive integration may not work properly.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-yellow-200 bg-yellow-50 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              ⚠️ Some warnings detected. Functionality may be limited.
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Results */}
        <div className="space-y-3">
          {diagnostics.map((result, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(result.status)}
                <span className="font-medium">{result.name}</span>
              </div>
              <p className="text-sm mb-1">{result.message}</p>
              {result.details && <p className="text-xs opacity-75">{result.details}</p>}
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Need Help?</span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• If you see CSP errors, check that your _headers file is properly configured</p>
            <p>• Environment variable issues: Verify your Netlify environment settings</p>
            <p>• Domain authorization: Add your domain to Google Cloud Console OAuth settings</p>
            <p>• For localhost testing, use http://localhost:3000 (not 127.0.0.1)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
