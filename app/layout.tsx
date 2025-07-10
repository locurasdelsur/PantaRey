import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Band Hub - Gestión de Banda Musical",
  description: "Plataforma completa para organizar tu banda: canciones, ensayos, ideas y más",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Carga temprana y controlada de la librería GAPI de Google */}
        <Script
          src="https://apis.google.com/js/api.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
