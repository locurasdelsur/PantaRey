import { google } from "googleapis"
import { NextResponse } from "next/server"

// Nuevas variables de entorno para la Cuenta de Servicio
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") // Reemplaza \\n por \n

let drive: any

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error("Faltan variables de entorno de Google Service Account. Asegúrate de configurarlas.")
} else {
  const jwtClient = new google.auth.JWT(
    SERVICE_ACCOUNT_EMAIL,
    undefined, // keyFile (no se usa si se proporciona la clave directamente)
    PRIVATE_KEY,
    ["https://www.googleapis.com/auth/drive.readonly"], // Scopes necesarios
  )

  drive = google.drive({
    version: "v3",
    auth: jwtClient,
  })
}

export async function GET(request: Request) {
  if (!drive) {
    return NextResponse.json(
      { error: "Configuración de Google Drive incompleta. Contacta al administrador." },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get("folderId")

  if (!folderId) {
    return NextResponse.json({ error: "Se requiere el ID de la carpeta (folderId)." }, { status: 400 })
  }

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, webContentLink)",
      spaces: "drive",
    })

    const files = res.data.files
    return NextResponse.json({ files })
  } catch (error: any) {
    console.error("Error al listar archivos de Google Drive:", error.message)
    return NextResponse.json(
      { error: "Fallo al listar archivos de Google Drive", details: error.message },
      { status: 500 },
    )
  }
}
