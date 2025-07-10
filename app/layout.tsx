import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthGuard } from "@/components/auth-guard"
import { DriveConnectionGuard } from "@/components/drive-connection-guard"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Panta Rei Project - Gestión de Banda",
  description: "Sistema integral de gestión para bandas musicales con almacenamiento en Google Drive",
  keywords: ["banda", "música", "gestión", "google drive", "colaboración"],
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthGuard>
            <DriveConnectionGuard>{children}</DriveConnectionGuard>
          </AuthGuard>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
