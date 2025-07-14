"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { setCookie } from "cookies-next" // Importa para establecer la cookie

export function SimpleLoginForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password === "cholo") {
      setCookie("is_authenticated", "true", { maxAge: 60 * 60 * 24 }) // Cookie válida por 24 horas
      router.push("/") // Redirige al dashboard
    } else {
      setError("Clave incorrecta. Intenta de nuevo.")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Acceso a la Banda</CardTitle>
        <CardDescription>Ingresa la clave para acceder al centro de gestión musical.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Clave</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full">
            Acceder
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
