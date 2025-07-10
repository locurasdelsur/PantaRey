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

    // 🔍 DIAGNÓSTICO mejorado con info del dominio
    console.log("🔧 DIAGNÓSTICO DE CONFIGURACIÓN:")
    console.log("🔑 API Key:", this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}...` : "❌ VACÍO")
    console.log("🔑 Client ID:", this.config.clientId ? `${this.config.clientId.substring(0, 15)}...` : "❌ VACÍO")
    console.log("🌍 Dominio actual:", typeof window !== "undefined" ? window.location.origin : "SSR")
    console.log("🎯 Dominio configurado:", process.env.NEXT_PUBLIC_APP_URL || "No configurado")

    // Verificar si estamos en el dominio correcto
    if (typeof window !== "undefined") {
      const currentOrigin = window.location.origin
      const configuredDomain = process.env.NEXT_PUBLIC_APP_URL

      if (configuredDomain && currentOrigin !== configuredDomain) {
        console.warn("⚠️ ADVERTENCIA: Dominio actual no coincide con el configurado")
        console.log(`   Actual: ${currentOrigin}`)
        console.log(`   Configurado: ${configuredDomain}`)
        console.log("   Esto puede causar problemas de OAuth")
      }
    }
  }

  /* ───────────────────────── HELPERS ───────────────────────── */

  private loadGoogleApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        console.log("✅ Google API ya está cargada")
        resolve()
        return
      }

      console.log("📡 Cargando Google API...")
      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.async = true
      script.defer = true

      script.onload = () => {
        console.log("✅ Script de Google API cargado")
        if (window.gapi) {
          resolve()
        } else {
          reject(new Error("GAPI_LOAD_ERROR: Google API se cargó pero no está disponible"))
        }
      }

      script.onerror = () => {
        console.error("❌ Error cargando script de Google API")
        reject(new Error("GAPI_SCRIPT_ERROR: No se pudo cargar el script de Google API"))
      }

      setTimeout(() => {
        reject(new Error("GAPI_TIMEOUT: Timeout cargando Google API"))
      }, 10000)

      document.head.appendChild(script)
    })
  }

  private loadGapiModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("📦 Cargando módulos de Google API...")

      const timeout = setTimeout(() => {
        reject(new Error("GAPI_MODULES_TIMEOUT: Timeout cargando módulos de Google API"))
      }, 10000)

      window.gapi.load("client:auth2", {
        callback: () => {
          console.log("✅ Módulos de Google API cargados")
          clearTimeout(timeout)
          resolve()
        },
        onerror: () => {
          console.error("❌ Error cargando módulos de Google API")
          clearTimeout(timeout)
          reject(new Error("GAPI_MODULES_ERROR: Error cargando módulos de Google API"))
        },
      })
    })
  }

  private loadGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        return reject(new Error("GAPI no disponible"))
      }

      if (!window.gapi.client || !window.gapi.auth2) {
        return reject(new Error("Módulos de GAPI no están cargados"))
      }

      console.log("🔧 Inicializando cliente GAPI...")

      window.gapi.client
        .init({
          apiKey: this.config.apiKey,
          clientId: this.config.clientId,
          discoveryDocs: this.config.discoveryDocs,
          scope: this.config.scope,
        })
        .then(() => {
          console.log("✅ Cliente GAPI inicializado correctamente")
          resolve()
        })
        .catch((error: any) => {
          console.error("❌ Error inicializando cliente GAPI:", error)

          let errorMessage = "Error desconocido"

          // 🎯 MEJORADO: Mensaje específico para dominio no autorizado
          if (error?.error === "idpiframe_initialization_failed" || /has not been registered/i.test(error?.details)) {
            const currentOrigin = window.location.origin
            const configuredDomain = process.env.NEXT_PUBLIC_APP_URL

            errorMessage = `El dominio "${currentOrigin}" no está autorizado en Google Cloud Console.\n\n`

            if (configuredDomain && currentOrigin !== configuredDomain) {
              errorMessage += `🎯 Solución recomendada:\n`
              errorMessage += `1. Accede a tu app desde: ${configuredDomain}\n`
              errorMessage += `2. O autoriza "${currentOrigin}" en Google Cloud Console\n\n`
            }

            errorMessage += `📝 Para autorizar el dominio:\n`
            errorMessage += `1. Ve a Google Cloud Console → OAuth 2.0 Client ID\n`
            errorMessage += `2. Añade "${currentOrigin}" en "Authorized JavaScript origins"`
          } else if (error.details) {
            const details = error.details
            if (details.includes("invalid_client") || details.includes("unauthorized_client")) {
              errorMessage = "Client ID inválido o no autorizado. Verifica NEXT_PUBLIC_GOOGLE_CLIENT_ID"
            } else if (details.includes("origin_mismatch")) {
              errorMessage = "El dominio no está autorizado. Configura las URIs en Google Console"
            } else {
              errorMessage = details
            }
          } else if (error.message) {
            errorMessage = error.message
          } else if (error.error) {
            errorMessage = error.error
          }

          reject(new Error(`GAPI_INIT_ERROR: ${errorMessage}`))
        })
    })
  }

  // 🔄 NUEVO: Método simple para autenticación sin inicialización completa
  async authenticateOnly(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log("🔐 Iniciando autenticación simple...")

      // Verificar credenciales básicas
      const credentialsValid = await this.quickInit()
      if (!credentialsValid) {
        return {
          success: false,
          error: "Credenciales de Google Drive no configuradas correctamente o dominio no autorizado",
        }
      }

      // Cargar API y módulos
      if (!window.gapi) {
        await this.loadGoogleAPI()
      }

      if (!window.gapi.client || !window.gapi.auth2) {
        await this.loadGapiModules()
      }

      // Inicializar cliente
      await this.loadGapiClient()

      // Intentar login
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance) {
        return {
          success: false,
          error: "No se pudo inicializar la autenticación de Google",
        }
      }

      let googleUser
      if (authInstance.isSignedIn.get()) {
        googleUser = authInstance.currentUser.get()
      } else {
        googleUser = await authInstance.signIn({ prompt: "consent" })
      }

      // Guardar token
      const authResponse = googleUser.getAuthResponse()
      localStorage.setItem("googleAccessToken", authResponse.access_token)
      localStorage.setItem("googleTokenExpiry", (Date.now() + authResponse.expires_in * 1000).toString())

      // Obtener info del usuario
      const profile = googleUser.getBasicProfile()
      const userInfo = {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        avatar: profile.getImageUrl(),
      }

      console.log("✅ Autenticación exitosa")
      return { success: true, user: userInfo }
    } catch (error: any) {
      console.error("❌ Error en autenticación:", error)

      let errorMessage = "Error de autenticación desconocido"

      if (error.error === "popup_closed_by_user") {
        errorMessage = "Necesitas completar la autorización de Google Drive"
      } else if (error.error === "access_denied") {
        errorMessage = "Acceso denegado a Google Drive"
      } else if (error.message) {
        errorMessage = error.message
      }

      return { success: false, error: errorMessage }
    }
  }

  // 🔄 NUEVO: Verificar si hay una sesión previa sin inicializar Drive
  hasStoredSession(): boolean {
    const token = localStorage.getItem("googleAccessToken")
    const expiry = localStorage.getItem("googleTokenExpiry")

    if (!token || !expiry) {
      return false
    }

    const expiryTime = Number.parseInt(expiry)
    const now = Date.now()

    return expiryTime > now
  }

  private async ensureClientReady() {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = (async () => {
      await this.loadGoogleApi()
      await this.loadGapiModules()
      await this.loadGapiClient()
      this.isInitialized = true
    })()

    return this.initializationPromise
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  /** Verifica formato de credenciales y carga gapi sin iniciar sesión */
  async quickInit(): Promise<boolean> {
    try {
      console.log("🔍 Verificación rápida de credenciales...")

      if (!this.config.apiKey || !this.config.clientId) {
        console.log("❌ Credenciales no configuradas")
        return false
      }

      if (!this.config.apiKey.startsWith("AIza")) {
        console.log("❌ API Key tiene formato incorrecto")
        return false
      }

      if (!this.config.clientId.includes(".apps.googleusercontent.com")) {
        console.log("❌ Client ID tiene formato incorrecto")
        return false
      }

      // Verificar dominio si está configurado
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
        const currentOrigin = window.location.origin
        const configuredDomain = process.env.NEXT_PUBLIC_APP_URL

        if (currentOrigin !== configuredDomain) {
          console.warn("⚠️ Dominio no autorizado para OAuth")
          console.log(`Esperado: ${configuredDomain}`)
          console.log(`Actual: ${currentOrigin}`)
          return false
        }
      }

      console.log("✅ Credenciales válidas")
      return true
    } catch (error) {
      console.error("❌ Error en verificación rápida:", error)
      return false
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

  /* … Resto de métodos (saveData, loadData, etc.) … */
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
        const errorText = await response.text()
        throw new Error(`UPDATE_ERROR: Error actualizando archivo (${response.status}): ${errorText}`)
      }
    } catch (error) {
      console.error("❌ Error actualizando archivo:", error)
      throw error
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

  // 🔄 NUEVO: Método para cargar usuarios sin inicialización completa
  async loadUsersOnly(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        // Inicialización mínima solo para cargar usuarios
        await this.loadGoogleApi()
        await this.loadGapiModules()
        await this.loadGapiClient()
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

  // 🔄 NUEVO: Método para guardar usuarios sin inicialización completa
  async saveUsersOnly(users: any[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.loadGoogleApi()
        await this.loadGapiModules()
        await this.loadGapiClient()
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
      currentOrigin: typeof window !== "undefined" ? window.location.origin : "SSR",
      configuredDomain: process.env.NEXT_PUBLIC_APP_URL,
      domainMatch: typeof window !== "undefined" ? window.location.origin === process.env.NEXT_PUBLIC_APP_URL : null,
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
        hasApiKeyEnv: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        hasClientIdEnv: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        hasAppUrlEnv: !!process.env.NEXT_PUBLIC_APP_URL,
      },
      folderIds: this.folderIds,
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

  private async validateAndRefreshToken(): Promise<void> {
    const authInstance = window.gapi.auth2.getAuthInstance()
    if (!authInstance) {
      throw new Error("AUTH_INSTANCE_ERROR: No se pudo obtener la instancia de autenticación")
    }

    const user = authInstance.currentUser.get()
    if (!user) {
      throw new Error("USER_ERROR: No se pudo obtener el usuario")
    }

    const authResponse = user.getAuthResponse()
    if (!authResponse || !authResponse.access_token) {
      throw new Error("TOKEN_ERROR: No se pudo obtener el token de acceso")
    }

    const now = Date.now()
    const expiryTime = Number.parseInt(authResponse.expires_in) * 1000 + now
    if (expiryTime < now) {
      console.log("🔄 Token expirado, refrescando...")
      await user.reloadAuthResponse()
    }
  }
}

declare global {
  interface Window {
    gapi: any
  }
}

const driveStorage = new GoogleDriveStorage({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scope: "https://www.googleapis.com/auth/drive.file",
})

export { driveStorage }
