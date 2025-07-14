import { google } from "googleapis"
import { NextResponse } from "next/server"

// Nuevas variables de entorno para la Cuenta de Servicio
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") // Reemplaza \n por \n

// ID de la carpeta principal donde se guardarán las sesiones de fotos
const PARENT_FOLDER_ID = "1yH0gAupFxeQsPCllgECRAs_yhXlZBQ8Z"

let drive: any

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error("Faltan variables de entorno de Google Service Account. Asegúrate de configurarlas.")
} else {
  const jwtClient = new google.auth.JWT(
    SERVICE_ACCOUNT_EMAIL,
    undefined, // keyFile (no se usa si se proporciona la clave directamente)
    PRIVATE_KEY,
    ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/drive.file"], // Scopes necesarios para leer y escribir
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
  const folderId = searchParams.get("folderId") || PARENT_FOLDER_ID // Usar la carpeta principal si no se especifica

  if (!folderId) {
    return NextResponse.json({ error: "Se requiere el ID de la carpeta (folderId)." }, { status: 400 })
  }

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, webContentLink, webViewLink)", // Añadir webViewLink
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

export async function POST(request: Request) {
  if (!drive) {
    return NextResponse.json(
      { error: "Configuración de Google Drive incompleta. Contacta al administrador." },
      { status: 500 },
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fileName = formData.get("fileName") as string
    const mimeType = formData.get("mimeType") as string
    const date = formData.get("date") as string // Fecha para la carpeta de sesión
    const location = formData.get("location") as string
    const photographer = formData.get("photographer") as string
    const title = formData.get("title") as string
    const tags = formData.get("tags") as string

    if (!file || !fileName || !mimeType || !date) {
      return NextResponse.json({ error: "Faltan datos esenciales para la subida del archivo." }, { status: 400 })
    }

    // 1. Buscar o crear la carpeta de la sesión por fecha
    const folderName = `Sesión de Fotos ${date}`
    let sessionFolderId: string | undefined

    // Buscar carpeta existente
    const folderSearchRes = await drive.files.list({
      q: `'${PARENT_FOLDER_ID}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
      spaces: "drive",
    })

    if (folderSearchRes.data.files && folderSearchRes.data.files.length > 0) {
      sessionFolderId = folderSearchRes.data.files[0].id
    } else {
      // Crear nueva carpeta si no existe
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [PARENT_FOLDER_ID],
      }
      const folderCreateRes = await drive.files.create({
        resource: folderMetadata,
        fields: "id",
      })
      sessionFolderId = folderCreateRes.data.id
    }

    if (!sessionFolderId) {
      throw new Error("No se pudo encontrar o crear la carpeta de la sesión.")
    }

    // 2. Subir el archivo a la carpeta de la sesión
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const media = {
      mimeType: mimeType,
      body: buffer,
    }

    const fileMetadata = {
      name: fileName,
      parents: [sessionFolderId],
      // Puedes añadir propiedades personalizadas si las necesitas
      appProperties: {
        location: location,
        photographer: photographer,
        title: title,
        tags: tags,
      },
    }

    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, webContentLink, webViewLink", // Solicitar webViewLink
    })

    return NextResponse.json({
      message: "Archivo subido exitosamente",
      file: uploadedFile.data,
    })
  } catch (error: any) {
    console.error("Error al subir archivo a Google Drive:", error.message)
    return NextResponse.json(
      { error: "Fallo al subir archivo a Google Drive", details: error.message },
      { status: 500 },
    )
  }
}
