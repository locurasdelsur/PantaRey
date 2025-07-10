"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Shield, Settings, Eye, Copy } from "lucide-react"
import { driveStorage } from "@/lib/google-drive-storage"

interface CSPViolation {
  blockedURI: string
  documentURI: string
  effectiveDirective: string
  originalPolicy: string
  statusCode: number
  violatedDirective: string
}

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning" | "info"
  message: string
  details?: string
  action?: string
}

export function EnhancedCSPDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [cspViolations, setCspViolations] = useState<CSPViolation[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)
  const [liveLog, setLiveLog] = useState<string[]>([])
  const [currentCSP, setCurrentCSP] = useState<string>("")

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLiveLog((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`])
  }

  // Listen for CSP violations
  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        statusCode: event.statusCode,
        violatedDirective: event.violatedDirective,
      }

      setCspViolations((prev) => [violation, ...prev.slice(0, 9)])
      addLog(`🚫 CSP Violation: ${event.effectiveDirective} blocked ${event.blockedURI}`)

      console.error("CSP Violation:", violation)
    }

    document.addEventListener("securitypolicyviolation", handleCSPViolation)

    return () => {
      document.removeEventListener("securitypolicyviolation", handleCSPViolation)
    }
  }, [])

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])
    setLiveLog([])
    addLog("🚀 Starting comprehensive diagnostics...")

    const results: DiagnosticResult[] = []

    try {
      // 1. Environment Check
      addLog("🔍 Checking environment variables...")
      const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      const hasClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

      results.push({
        name: "Environment Variables",
        status: hasApiKey && hasClientId ? "success" : "error",
        message: hasApiKey && hasClientId ? "All environment variables present" : "Missing required variables",
        details: `API Key: ${hasApiKey ? "✅ Present" : "❌ Missing"} (${apiKey.length} chars), Client ID: ${hasClientId ? "✅ Present" : "❌ Missing"} (${clientId.length} chars)`,
        action:
          !hasApiKey || !hasClientId
            ? "Set NEXT_PUBLIC_GOOGLE_API_KEY and NEXT_PUBLIC_GOOGLE_CLIENT_ID in Netlify environment variables"
            : undefined,
      })

      // 2. CSP Header Detection
      addLog("🛡️ Checking CSP headers...")
      try {
        const response = await fetch(window.location.href, { method: "HEAD" })
        const cspHeader =
          response.headers.get("content-security-policy") ||
          response.headers.get("content-security-policy-report-only") ||
          ""

        setCurrentCSP(cspHeader)

        const hasRequiredDirectives = ["script-src", "frame-src", "connect-src", "'unsafe-eval'"].every((directive) =>
          cspHeader.toLowerCase().includes(directive.toLowerCase()),
        )

        results.push({
          name: "CSP Configuration",
          status: hasRequiredDirectives ? "success" : cspHeader ? "warning" : "error",
          message: hasRequiredDirectives
            ? "CSP properly configured"
            : cspHeader
              ? "CSP present but may be incomplete"
              : "No CSP headers detected",
          details: `Header length: ${cspHeader.length} chars. Contains required directives: ${hasRequiredDirectives ? "✅" : "❌"}`,
          action: !hasRequiredDirectives ? "Update /public/_headers file with correct CSP directives" : undefined,
        })
      } catch (error) {
        results.push({
          name: "CSP Configuration",
          status: "warning",
          message: "Could not check CSP headers",
          details: "Network error - this is normal in development",
        })
      }

      // 3. Google APIs Script Loading
      addLog("📦 Testing Google API script loading...")
      try {
        const testScript = () =>
          new Promise<void>((resolve, reject) => {
            if (window.gapi) {
              resolve()
              return
            }

            const script = document.createElement("script")
            script.src = "https://apis.google.com/js/api.js"
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Script blocked by CSP"))

            document.head.appendChild(script)
            setTimeout(() => reject(new Error("Script loading timeout")), 5000)
          })

        await testScript()

        results.push({
          name: "Google API Script Loading",
          status: "success",
          message: "Google API script loads successfully",
          details: "script-src directive allows googleapis.com",
        })
      } catch (error: any) {
        results.push({
          name: "Google API Script Loading",
          status: "error",
          message: "Failed to load Google API script",
          details: error.message,
          action: "Add 'https://apis.google.com' to script-src in CSP",
        })
      }

      // 4. iframe Test (for Google Sign-In)
      addLog("🖼️ Testing iframe capabilities...")
      try {
        const testIframe = () =>
          new Promise<void>((resolve, reject) => {
            const iframe = document.createElement("iframe")
            iframe.src = "https://accounts.google.com/gsi/iframe"
            iframe.style.display = "none"
            iframe.onload = () => {
              document.body.removeChild(iframe)
              resolve()
            }
            iframe.onerror = () => {
              document.body.removeChild(iframe)
              reject(new Error("iframe blocked by CSP"))
            }

            document.body.appendChild(iframe)
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe)
                reject(new Error("iframe loading timeout"))
              }
            }, 3000)
          })

        await testIframe()

        results.push({
          name: "Google Sign-In iframe",
          status: "success",
          message: "Google Sign-In iframe loads successfully",
          details: "frame-src directive allows accounts.google.com",
        })
      } catch (error: any) {
        results.push({
          name: "Google Sign-In iframe",
          status: "error",
          message: "Google Sign-In iframe blocked",
          details: error.message,
          action: "Add 'https://accounts.google.com' to frame-src in CSP",
        })
      }

      // 5. eval() Test
      addLog("⚡ Testing eval() capability...")
      try {
        // Test if eval is allowed (required by Google Sign-In)
        eval("1+1")

        results.push({
          name: "JavaScript eval()",
          status: "success",
          message: "eval() is allowed",
          details: "Required for Google Sign-In internal operations",
        })
      } catch (error: any) {
        results.push({
          name: "JavaScript eval()",
          status: "error",
          message: "eval() is blocked by CSP",
          details: "Google Sign-In requires eval() to function",
          action: "Add 'unsafe-eval' to script-src in CSP",
        })
      }

      // 6. Network Connectivity Test
      addLog("🌐 Testing Google API connectivity...")
      try {
        const response = await fetch("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", {
          method: "GET",
          mode: "cors",
        })

        results.push({
          name: "Google API Connectivity",
          status: response.ok ? "success" : "warning",
          message: response.ok ? "Google APIs are accessible" : "Google APIs returned error",
          details: `Status: ${response.status} ${response.statusText}`,
        })
      } catch (error: any) {
        results.push({
          name: "Google API Connectivity",
          status: "error",
          message: "Cannot reach Google APIs",
          details: error.message,
          action: "Check connect-src in CSP and network connectivity",
        })
      }

      // 7. Drive Storage Test
      addLog("💾 Testing Google Drive integration...")
      try {
        const diagnosticInfo = driveStorage.getDiagnosticInfo()
        const isHealthy =
          diagnosticInfo.config.hasApiKey &&
          diagnosticInfo.config.hasClientId &&
          diagnosticInfo.config.apiKeyFormat === "Correct" &&
          diagnosticInfo.config.clientIdFormat === "Correct"

        results.push({
          name: "Google Drive Integration",
          status: isHealthy ? "success" : "error",
          message: isHealthy ? "Drive integration configured correctly" : "Drive integration has issues",
          details: `API Key Format: ${diagnosticInfo.config.apiKeyFormat}, Client ID Format: ${diagnosticInfo.config.clientIdFormat}`,
          action: !isHealthy ? "Verify API key and Client ID format in environment variables" : undefined,
        })
      } catch (error: any) {
        results.push({
          name: "Google Drive Integration",
          status: "error",
          message: "Drive integration test failed",
          details: error.message,
        })
      }

      // 8. Domain Authorization Check
      addLog("🏠 Checking domain authorization...")
      const currentDomain = window.location.origin
      const isAuthorizedDomain = [
        "http://localhost:3000",
        "https://pantarey.netlify.app",
        "https://panta-rei-project.netlify.app",
      ].includes(currentDomain)

      results.push({
        name: "Domain Authorization",
        status: isAuthorizedDomain ? "success" : "warning",
        message: `Current domain: ${currentDomain}`,
        details: isAuthorizedDomain ? "Domain is pre-authorized" : "Verify domain is added to Google Cloud Console",
        action: !isAuthorizedDomain
          ? `Add ${currentDomain} to OAuth 2.0 Client ID authorized domains in Google Cloud Console`
          : undefined,
      })
    } catch (error: any) {
      results.push({
        name: "Diagnostic Error",
        status: "error",
        message: "Failed to complete diagnostics",
        details: error.message,
      })
    }

    addLog("✅ Diagnostics completed!")
    setDiagnostics(results)
    setLastRun(new Date())
    setIsRunning(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Eye className="h-4 w-4 text-blue-500" />
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
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  useEffect(() => {
    runComprehensiveDiagnostics()
  }, [])

  const successCount = diagnostics.filter((d) => d.status === "success").length
  const errorCount = diagnostics.filter((d) => d.status === "error").length
  const warningCount = diagnostics.filter((d) => d.status === "warning").length

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Enhanced CSP & Google Drive Diagnostics
          </CardTitle>
          <Button
            onClick={runComprehensiveDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-600 bg-transparent"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isRunning ? "Running..." : "Run Full Check"}
          </Button>
        </div>

        {lastRun && (
          <p className="text-sm text-slate-600">
            Last run: {lastRun.toLocaleString()} • Duration: {isRunning ? "Running..." : "Completed"}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-100">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            <TabsTrigger value="violations">CSP Violations</TabsTrigger>
            <TabsTrigger value="logs">Live Logs</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            {/* Summary */}
            <div className="flex gap-2 mb-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">✅ {successCount} Passed</Badge>
              {warningCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠️ {warningCount} Warnings</Badge>
              )}
              {errorCount > 0 && (
                <Badge className="bg-red-100 text-red-800 border-red-200">❌ {errorCount} Errors</Badge>
              )}
            </div>

            {/* Overall Status */}
            {errorCount === 0 && warningCount === 0 ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  🎉 All checks passed! Your Google Drive integration should work correctly.
                </AlertDescription>
              </Alert>
            ) : errorCount > 0 ? (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  ⚠️ Critical issues detected. Google Drive integration may not work properly.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  ⚠️ Some warnings detected. Functionality may be limited.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-4">
            <div className="space-y-3">
              {diagnostics.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <p className="text-sm mb-1">{result.message}</p>
                  {result.details && <p className="text-xs opacity-75 mb-2">{result.details}</p>}
                  {result.action && (
                    <div className="mt-2 p-2 bg-white/50 rounded border-l-2 border-current">
                      <p className="text-xs font-medium">Action Required:</p>
                      <p className="text-xs">{result.action}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="violations" className="mt-4">
            <div className="space-y-3">
              {cspViolations.length > 0 ? (
                cspViolations.map((violation, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-800">CSP Violation #{index + 1}</span>
                    </div>
                    <div className="text-xs space-y-1 text-red-700">
                      <p>
                        <strong>Blocked URI:</strong> {violation.blockedURI}
                      </p>
                      <p>
                        <strong>Directive:</strong> {violation.violatedDirective}
                      </p>
                      <p>
                        <strong>Effective:</strong> {violation.effectiveDirective}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No CSP violations detected</p>
                  <p className="text-xs mt-2">This is good - your CSP is working properly!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
              {liveLog.length > 0 ? (
                liveLog.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-500">No logs yet...</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <div className="space-y-4">
              {/* Current CSP */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-800">Current CSP Header</h4>
                  <Button onClick={() => copyToClipboard(currentCSP)} variant="outline" size="sm" className="text-xs">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-slate-50 p-3 rounded border text-xs font-mono max-h-32 overflow-y-auto">
                  {currentCSP || "No CSP header detected"}
                </div>
              </div>

              {/* Recommended CSP */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-800">Recommended CSP for _headers</h4>
                  <Button
                    onClick={() =>
                      copyToClipboard(`/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.google.com https://securetoken.googleapis.com https://www.gstatic.com; frame-src 'self' https://accounts.google.com https://content.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'`)
                    }
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-blue-50 p-3 rounded border text-xs font-mono max-h-32 overflow-y-auto">
                  {`/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.google.com https://securetoken.googleapis.com https://www.gstatic.com; frame-src 'self' https://accounts.google.com https://content.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'`}
                </div>
              </div>

              {/* Environment Info */}
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Environment Information</h4>
                <div className="bg-slate-50 p-3 rounded border text-xs space-y-1">
                  <p>
                    <strong>Domain:</strong> {window.location.origin}
                  </p>
                  <p>
                    <strong>User Agent:</strong> {navigator.userAgent.slice(0, 50)}...
                  </p>
                  <p>
                    <strong>API Key Present:</strong> {!!process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? "✅" : "❌"}
                  </p>
                  <p>
                    <strong>Client ID Present:</strong> {!!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅" : "❌"}
                  </p>
                  <p>
                    <strong>Window.gapi:</strong>{" "}
                    {typeof window !== "undefined" && window.gapi ? "✅ Loaded" : "❌ Not loaded"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Quick Actions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="text-blue-700">
              <p>
                <strong>1. Update CSP:</strong> Copy recommended CSP to /public/_headers
              </p>
              <p>
                <strong>2. Redeploy:</strong> Trigger new deployment on Netlify
              </p>
            </div>
            <div className="text-blue-700">
              <p>
                <strong>3. Check Console:</strong> Monitor browser console for errors
              </p>
              <p>
                <strong>4. Test Auth:</strong> Try Google Sign-In after fixes
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
