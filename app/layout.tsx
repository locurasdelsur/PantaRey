import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SupabaseProvider } from "@/components/auth/supabase-provider" // Importa el proveedor

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Band Hub - Gestión de Banda Musical",
  description: "Plataforma completa para organizar tu banda: canciones, ensayos, ideas y más",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SupabaseProvider>{children}</SupabaseProvider> {/* Envuelve los children */}
      </body>
    </html>
  )
}
