import { google } from "googleapis"
import { NextResponse } from "next/server"

// Nuevas variables de entorno para la Cuenta de Servicio
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, "\n") // Reemplaza \n por \n

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

export async function POST(request: Request) {
  if (!drive) {
    return NextResponse.json(
      { error: "Configuración de Google Drive incompleta. Contacta al administrador." },
      { status: 500 },
    )
  }

  try {
    // En un entorno real, aquí procesarías el FormData para obtener el archivo.
    // Por ejemplo, usando 'formidable' o 'busboy' en un entorno Node.js completo.
    // Para este ejemplo, asumimos que el cliente enviaría un JSON con la URL y metadatos.
    // O, si se envía un archivo real, se accedería a él a través de request.body como un ReadableStream.

    const formData = await request.formData()
    const file = formData.get("file") as File | null // Esto sería el archivo real
    const fileName = formData.get("fileName") as string
    const mimeType = formData.get("mimeType") as string
    const folderId = formData.get("folderId") as string

    if (!file || !fileName || !mimeType || !folderId) {
      return NextResponse.json({ error: "Faltan datos para la subida del archivo." }, { status: 400 })
    }

    // Para una subida real, necesitarías convertir 'file' a un stream o buffer.
    // Aquí, solo simulamos el proceso.
    console.log(`Simulando subida de archivo: ${fileName} a la carpeta ${folderId}`)

    // Ejemplo de cómo se haría una subida real (requiere un stream del archivo):
    /*
    const media = {
      mimeType: mimeType,
      body: file.stream(), // Esto asume que 'file' es un objeto File de un input
    };

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
      // Puedes añadir propiedades personalizadas aquí si las necesitas
      // appProperties: {
      //   location: formData.get("location"),
      //   date: formData.get("date"),
      // },
    };

    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webContentLink',
    });

    return NextResponse.json({ message: "Archivo subido exitosamente", file: uploadedFile.data });
    */

    return NextResponse.json({
      message: "Subida simulada exitosamente. Implementa la lógica de subida real en el backend.",
    })
  } catch (error: any) {
    console.error("Error al subir archivo a Google Drive:", error.message)
    return NextResponse.json(
      { error: "Fallo al subir archivo a Google Drive", details: error.message },
      { status: 500 },
    )
  }
}
