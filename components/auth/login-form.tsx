"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/components/auth/supabase-provider"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = useSupabase()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error: authError } = isRegistering
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
    } else {
      if (isRegistering) {
        setMessage("¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.")
      } else {
        setMessage("Inicio de sesión exitoso. Redirigiendo...")
        router.push("/") // Redirige al dashboard después del login
      }
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}</CardTitle>
        <CardDescription>
          {isRegistering
            ? "Ingresa tus datos para crear una nueva cuenta."
            : "Ingresa tu correo y contraseña para acceder."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="mimusico@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isRegistering ? (
              "Registrarse"
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {isRegistering ? (
            <>
              ¿Ya tienes una cuenta?{" "}
              <Button variant="link" onClick={() => setIsRegistering(false)} className="p-0 h-auto">
                Inicia Sesión
              </Button>
            </>
          ) : (
            <>
              ¿No tienes una cuenta?{" "}
              <Button variant="link" onClick={() => setIsRegistering(true)} className="p-0 h-auto">
                Regístrate
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
