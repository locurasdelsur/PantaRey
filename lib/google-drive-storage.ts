interface GoogleDriveConfig {
  apiKey: string
  clientId: string
  discoveryDocs: string[]
  scope: string
}

class GoogleDriveStorage {
  private config: GoogleDriveConfig
  private isInitialized = false
  private isSignedIn = false
  private folderIds: { [key: string]: string } = {}
  private initializationPromise: Promise<void> | null = null

  constructor(config: GoogleDriveConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    // Evitar múltiples inicializaciones simultáneas
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    if (this.isInitialized) {
      return
    }

    this.initializationPromise = this._initialize()
    return this.initializationPromise
  }

  private async _initialize(): Promise<void> {
    try {
      // Verificar configuración
      if (!this.config.apiKey || !this.config.clientId) {
        throw new Error("Faltan credenciales de Google Drive. Verifica tu archivo .env.local")
      }

      // Cargar la API de Google
      await this.loadGoogleAPI()

      // Verificar que gapi esté completamente cargado
      if (!window.gapi || !window.gapi.load) {
        throw new Error("Google API no se cargó correctamente")
      }

      // Cargar módulos necesarios
      await new Promise<void>((resolve, reject) => {
        window.gapi.load("client:auth2", {
          callback: resolve,
          onerror: () => reject(new Error("Error cargando módulos de Google API")),
        })
      })

      // Inicializar cliente
      await window.gapi.client.init({
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: this.config.discoveryDocs,
        scope: this.config.scope,
      })

      // Verificar estado de autenticación
      const authInstance = window.gapi.auth2.getAuthInstance()
      this.isSignedIn = authInstance.isSignedIn.get()

      if (!this.isSignedIn) {
        await this.signIn()
      } else {
        // Verificar si el token sigue siendo válido
        await this.validateAndRefreshToken()
      }

      await this.createFolderStructure()
      this.isInitialized = true

      console.log("✅ Google Drive inicializado correctamente")
    } catch (error) {
      console.error("❌ Error inicializando Google Drive:", error)
      this.initializationPromise = null
      throw error
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("No se pudo cargar la API de Google"))
      document.head.appendChild(script)
    })
  }

  async signIn(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      const googleUser = await authInstance.signIn({
        prompt: "consent", // Forzar pantalla de consentimiento
      })

      this.isSignedIn = true

      // Guardar información del usuario
      const profile = googleUser.getBasicProfile()
      const authResponse = googleUser.getAuthResponse()

      localStorage.setItem("googleAccessToken", authResponse.access_token)
      localStorage.setItem("googleTokenExpiry", (Date.now() + authResponse.expires_in * 1000).toString())

      console.log("✅ Autenticación exitosa con Google Drive")
    } catch (error) {
      console.error("❌ Error durante el login con Google:", error)

      if (error.error === "popup_closed_by_user") {
        throw new Error("Necesitas autorizar el acceso a Google Drive para continuar")
      } else if (error.error === "access_denied") {
        throw new Error("Acceso denegado. La aplicación necesita permisos de Google Drive")
      } else {
        throw new Error("Error conectando con Google Drive. Intenta de nuevo")
      }
    }
  }

  async validateAndRefreshToken(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      const currentUser = authInstance.currentUser.get()

      if (!currentUser.isSignedIn()) {
        await this.signIn()
        return
      }

      // Verificar si el token está por expirar (renovar si faltan menos de 5 minutos)
      const authResponse = currentUser.getAuthResponse()
      const expiresAt = authResponse.expires_at
      const now = Date.now()

      if (expiresAt - now < 5 * 60 * 1000) {
        // 5 minutos
        console.log("🔄 Renovando token de Google Drive...")
        const newAuthResponse = await currentUser.reloadAuthResponse()
        localStorage.setItem("googleAccessToken", newAuthResponse.access_token)
        localStorage.setItem("googleTokenExpiry", newAuthResponse.expires_at.toString())
        console.log("✅ Token renovado exitosamente")
      }
    } catch (error) {
      console.error("❌ Error validando token:", error)
      // Si hay error, intentar login nuevamente
      await this.signIn()
    }
  }

  async createFolderStructure(): Promise<void> {
    try {
      // Crear carpeta principal
      const mainFolder = await this.createFolder("Panta Rei Project", "root")
      this.folderIds.main = mainFolder.id

      // Crear subcarpetas
      const dataFolder = await this.createFolder("Datos", mainFolder.id)
      const photosFolder = await this.createFolder("Fotos", mainFolder.id)
      const songsFolder = await this.createFolder("Canciones", mainFolder.id)
      const audioFolder = await this.createFolder("Audio", songsFolder.id)
      const coversFolder = await this.createFolder("Portadas", songsFolder.id)

      this.folderIds.data = dataFolder.id
      this.folderIds.photos = photosFolder.id
      this.folderIds.songs = songsFolder.id
      this.folderIds.audio = audioFolder.id
      this.folderIds.covers = coversFolder.id

      console.log("📁 Estructura de carpetas creada:", this.folderIds)
    } catch (error) {
      console.error("❌ Error creando estructura de carpetas:", error)
      throw error
    }
  }

  private async createFolder(name: string, parentId: string): Promise<any> {
    try {
      // Verificar si la carpeta ya existe
      const existingFolder = await this.findFolder(name, parentId)
      if (existingFolder) {
        return existingFolder
      }

      // Crear nueva carpeta usando gapi.client
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
      })

      return response.result
    } catch (error) {
      console.error(`❌ Error creando carpeta ${name}:`, error)
      throw error
    }
  }

  private async findFolder(name: string, parentId: string): Promise<any> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
      })

      return response.result.files?.[0] || null
    } catch (error) {
      console.error(`❌ Error buscando carpeta ${name}:`, error)
      return null
    }
  }

  async uploadFile(file: File, fileName: string, folderId?: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    await this.validateAndRefreshToken()

    try {
      const metadata = {
        name: fileName,
        parents: folderId ? [folderId] : [this.folderIds.main],
      }

      const form = new FormData()
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
      form.append("file", file)

      const authInstance = window.gapi.auth2.getAuthInstance()
      const accessToken = authInstance.currentUser.get().getAuthResponse().access_token

      const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      })

      if (!response.ok) {
        throw new Error(`Error subiendo archivo: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result.id
    } catch (error) {
      console.error("❌ Error subiendo archivo:", error)
      throw error
    }
  }

  async saveData(fileName: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    await this.validateAndRefreshToken()

    try {
      const jsonData = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const file = new File([blob], fileName, { type: "application/json" })

      // Verificar si el archivo ya existe
      const existingFile = await this.findFile(fileName, this.folderIds.data)

      if (existingFile) {
        // Actualizar archivo existente
        await this.updateFile(existingFile.id, file)
      } else {
        // Crear nuevo archivo
        await this.uploadFile(file, fileName, this.folderIds.data)
      }
    } catch (error) {
      console.error(`❌ Error guardando datos ${fileName}:`, error)
      throw error
    }
  }

  async loadData(fileName: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    await this.validateAndRefreshToken()

    try {
      const file = await this.findFile(fileName, this.folderIds.data)
      if (!file) {
        return null
      }

      // Usar gapi.client en lugar de fetch
      const response = await window.gapi.client.drive.files.get({
        fileId: file.id,
        alt: "media",
      })

      return JSON.parse(response.body)
    } catch (error) {
      console.error(`❌ Error cargando datos ${fileName}:`, error)
      return null
    }
  }

  private async findFile(name: string, parentId: string): Promise<any> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${name}' and '${parentId}' in parents and trashed=false`,
        fields: "files(id, name)",
      })

      return response.result.files?.[0] || null
    } catch (error) {
      console.error(`❌ Error buscando archivo ${name}:`, error)
      return null
    }
  }

  private async updateFile(fileId: string, file: File): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      const accessToken = authInstance.currentUser.get().getAuthResponse().access_token

      const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": file.type,
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error(`Error actualizando archivo: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("❌ Error actualizando archivo:", error)
      throw error
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    await this.validateAndRefreshToken()

    try {
      await window.gapi.client.drive.files.delete({
        fileId: fileId,
      })
    } catch (error) {
      console.error("❌ Error eliminando archivo:", error)
      throw error
    }
  }

  getFileUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`
  }

  getThumbnailUrl(fileId: string, size = 400): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`
  }

  getFolderIds() {
    return this.folderIds
  }

  // Método para reconectar manualmente
  async reconnect(): Promise<void> {
    this.isInitialized = false
    this.isSignedIn = false
    this.initializationPromise = null
    localStorage.removeItem("googleAccessToken")
    localStorage.removeItem("googleTokenExpiry")

    await this.initialize()
  }

  // Verificar estado de conexión
  isConnected(): boolean {
    return this.isInitialized && this.isSignedIn
  }
}

// Declarar tipos globales para TypeScript
declare global {
  interface Window {
    gapi: any
  }
}

// Singleton para usar en toda la app
const driveStorage = new GoogleDriveStorage({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scope: "https://www.googleapis.com/auth/drive.file",
})

export { driveStorage }
