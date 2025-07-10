/* eslint-disable no-console */
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
  private folderIds: Record<string, string> = {}
  private initializationPromise: Promise<void> | null = null

  constructor(config: GoogleDriveConfig) {
    this.config = config
    // Logs de diagnóstico mejorados
    const isDev = process.env.NODE_ENV === "development"
    const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost"

    console.table({
      Environment: process.env.NODE_ENV || "unknown",
      Hostname: typeof window !== "undefined" ? window.location.hostname : "SSR",
      "API Key": this.config.apiKey ? `${this.config.apiKey.slice(0, 8)}...` : "❌ MISSING",
      "Client ID": this.config.clientId ? `${this.config.clientId.slice(0, 12)}...` : "❌ MISSING",
      "API Key Format": this.config.apiKey?.startsWith("AIza") ? "✅ Valid" : "❌ Invalid",
      "Client ID Format": this.config.clientId?.includes(".apps.googleusercontent.com") ? "✅ Valid" : "❌ Invalid",
    })

    // Advertencias específicas para producción
    if (isProduction && (!this.config.apiKey || !this.config.clientId)) {
      console.error(`
🚨 CONFIGURACIÓN FALTANTE EN PRODUCCIÓN:
${!this.config.apiKey ? "❌ NEXT_PUBLIC_GOOGLE_API_KEY no configurada" : ""}
${!this.config.clientId ? "❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID no configurada" : ""}

📋 PASOS PARA SOLUCIONARLO:
1. Ve a https://app.netlify.com
2. Selecciona tu sitio
3. Ve a Site settings > Environment variables
4. Agrega las variables de entorno necesarias
5. Redespliega el sitio
      `)
    }
  }

  /* ───────────────────────── HELPERS ───────────────────────── */

  private loadGoogleApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) return resolve()

      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.async = true
      script.onload = () => (window.gapi ? resolve() : reject(Error("GAPI load failed")))
      script.onerror = () => reject(Error("Unable to load gapi script"))
      document.head.appendChild(script)
    })
  }

  private loadGapiModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load("client:auth2", {
        callback: resolve,
        onerror: () => reject(Error("Error loading gapi modules")),
      })
    })
  }

  private initGapiClient(): Promise<void> {
    return window.gapi.client
      .init({
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: this.config.discoveryDocs,
        scope: this.config.scope,
      })
      .catch((error: any) => {
        // Mensajes de error más específicos
        if (error?.error === "idpiframe_initialization_failed") {
          const origin = window.location.origin
          throw new Error(
            `🚨 DOMINIO NO AUTORIZADO: "${origin}"\n\n` +
              `📋 SOLUCIÓN:\n` +
              `1. Ve a https://console.cloud.google.com\n` +
              `2. APIs & Services > Credentials\n` +
              `3. Edita tu OAuth 2.0 Client ID\n` +
              `4. Agrega "${origin}" en "Authorized JavaScript origins"\n` +
              `5. Guarda los cambios`,
          )
        }

        if (/has not been registered/i.test(error?.details || "")) {
          throw new Error(
            `🚨 APLICACIÓN NO REGISTRADA\n\n` +
              `El Client ID no está registrado para este dominio.\n` +
              `Verifica la configuración en Google Cloud Console.`,
          )
        }

        throw new Error(`GAPI_INIT_ERROR: ${error?.details || error?.message || "Error desconocido"}`)
      })
  }

  private async ensureClientReady() {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = (async () => {
      await this.loadGoogleApi()
      await this.loadGapiModules()
      await this.initGapiClient()
      this.isInitialized = true
    })()

    return this.initializationPromise
  }

  private async validateAndRefreshToken(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn()
      }

      const user = authInstance.currentUser.get()
      const authResponse = user.getAuthResponse()

      // Verificar si el token está próximo a expirar (menos de 5 minutos)
      const expiresIn = authResponse.expires_in || 0
      if (expiresIn < 300) {
        await user.reloadAuthResponse()
      }
    } catch (error) {
      console.error("❌ Error validando token:", error)
      throw new Error("TOKEN_VALIDATION_ERROR: Error validando token de acceso")
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
        const errorText = await response.text()
        throw new Error(`UPDATE_ERROR: Error actualizando archivo (${response.status}): ${errorText}`)
      }
    } catch (error) {
      console.error("❌ Error actualizando archivo:", error)
      throw error
    }
  }

  private hasStoredSession(): boolean {
    const token = localStorage.getItem("googleAccessToken")
    const expiry = localStorage.getItem("googleTokenExpiry")

    if (!token || !expiry) return false

    const expiryTime = Number.parseInt(expiry)
    const now = Date.now()

    return now < expiryTime
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  /** Verifica formato de credenciales y carga gapi sin iniciar sesión */
  async quickInit(): Promise<boolean> {
    // Verificación más estricta
    if (!this.config.apiKey || !this.config.clientId) {
      console.error("❌ Credenciales faltantes:", {
        apiKey: !!this.config.apiKey,
        clientId: !!this.config.clientId,
      })
      return false
    }

    if (!this.config.apiKey.startsWith("AIza")) {
      console.error("❌ Formato de API Key inválido")
      return false
    }

    if (!this.config.clientId.includes(".apps.googleusercontent.com")) {
      console.error("❌ Formato de Client ID inválido")
      return false
    }

    try {
      await this.ensureClientReady()
      console.log("✅ Google Drive inicializado correctamente")
      return true
    } catch (error) {
      console.error("❌ Error inicializando Google Drive:", error)
      return false
    }
  }

  /** Autenticación sin inicialización completa */
  async authenticateOnly(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureClientReady()

      const auth = window.gapi.auth2.getAuthInstance()
      if (!auth.isSignedIn.get()) {
        await auth.signIn({ prompt: "consent" })
      }

      console.log("✅ Autenticación exitosa")
      return { success: true }
    } catch (error: any) {
      console.error("❌ Error en autenticación:", error)
      return {
        success: false,
        error: error.message || "Error de autenticación con Google",
      }
    }
  }

  /** Inicialización completa tras login */
  async initializeAfterLogin(): Promise<void> {
    await this.ensureClientReady()

    const auth = window.gapi.auth2.getAuthInstance()
    if (!auth.isSignedIn.get()) {
      await auth.signIn({ prompt: "consent" })
    }
    this.isSignedIn = true
    console.log("✅ Google Drive completamente inicializado")
  }

  async loadUsersOnly(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.loadGoogleApi()
        await this.loadGapiModules()
        await this.initGapiClient()
      }

      // Buscar archivo de usuarios en la carpeta raíz o en datos
      let usersFile = await this.findFile("users.json", "root")

      if (!usersFile) {
        // Buscar en carpeta de datos si existe
        const dataFolder = await this.findFolder("Datos", "root")
        if (dataFolder) {
          usersFile = await this.findFile("users.json", dataFolder.id)
        }
      }

      if (!usersFile) {
        console.log("📝 Archivo users.json no encontrado, devolviendo array vacío")
        return []
      }

      const response = await window.gapi.client.drive.files.get({
        fileId: usersFile.id,
        alt: "media",
      })

      return JSON.parse(response.body) || []
    } catch (error) {
      console.error("❌ Error cargando usuarios:", error)
      return []
    }
  }

  async saveUsersOnly(users: any[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.loadGoogleApi()
        await this.loadGapiModules()
        await this.initGapiClient()
      }

      const jsonData = JSON.stringify(users, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const file = new File([blob], "users.json", { type: "application/json" })

      // Buscar archivo existente
      let existingFile = await this.findFile("users.json", "root")

      if (!existingFile) {
        const dataFolder = await this.findFolder("Datos", "root")
        if (dataFolder) {
          existingFile = await this.findFile("users.json", dataFolder.id)
        }
      }

      if (existingFile) {
        await this.updateFile(existingFile.id, file)
      } else {
        // Crear en raíz si no existe carpeta de datos
        await this.uploadFile(file, "users.json", "root")
      }
    } catch (error) {
      console.error("❌ Error guardando usuarios:", error)
      throw error
    }
  }

  /** Ejemplo de subida de archivos */
  async uploadFile(file: File, fileName: string, folderId?: string): Promise<string> {
    if (!this.isInitialized) await this.initializeAfterLogin()

    const metadata = { name: fileName, parents: folderId ? [folderId] : undefined }
    const form = new FormData()
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
    form.append("file", file)

    const token = window.gapi.auth.getToken().access_token
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error(`UPLOAD_ERROR: ${res.statusText}`)
    const json = await res.json()
    return json.id
  }

  async saveData(fileName: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAfterLogin()
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
      throw new Error(`SAVE_DATA_ERROR: Error guardando ${fileName}: ${error}`)
    }
  }

  async loadData(fileName: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initializeAfterLogin()
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

  async deleteFile(fileId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAfterLogin()
    }

    await this.validateAndRefreshToken()

    try {
      await window.gapi.client.drive.files.delete({
        fileId: fileId,
      })
    } catch (error) {
      console.error("❌ Error eliminando archivo:", error)
      throw new Error(`DELETE_ERROR: Error eliminando archivo: ${error}`)
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

  async reconnect(): Promise<void> {
    this.isInitialized = false
    this.isSignedIn = false
    this.initializationPromise = null
    localStorage.removeItem("googleAccessToken")
    localStorage.removeItem("googleTokenExpiry")

    await this.initializeAfterLogin()
  }

  isConnected(): boolean {
    return this.isInitialized && this.isSignedIn
  }

  getDiagnosticInfo(): any {
    return {
      isInitialized: this.isInitialized,
      isSignedIn: this.isSignedIn,
      hasStoredSession: this.hasStoredSession(),
      hasGapi: !!window.gapi,
      hasAuth2: !!(window.gapi && window.gapi.auth2),
      hasClient: !!(window.gapi && window.gapi.client),
      config: {
        hasApiKey: !!this.config.apiKey,
        hasClientId: !!this.config.clientId,
        apiKeyLength: this.config.apiKey?.length || 0,
        clientIdLength: this.config.clientId?.length || 0,
        apiKeyFormat: this.config.apiKey?.startsWith("AIza") ? "Correcto" : "Incorrecto",
        clientIdFormat: this.config.clientId?.includes(".apps.googleusercontent.com") ? "Correcto" : "Incorrecto",
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hostname: typeof window !== "undefined" ? window.location.hostname : "SSR",
        hasApiKeyEnv: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        hasClientIdEnv: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      },
      folderIds: this.folderIds,
    }
  }
}

/* -------------------------------------------------------------------------------- */

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var gapi: any
}

export const driveStorage = new GoogleDriveStorage({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scope: "https://www.googleapis.com/auth/drive.file",
})
