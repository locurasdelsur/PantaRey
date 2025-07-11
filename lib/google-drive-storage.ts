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

    // 🔍 DIAGNÓSTICO: Verificar variables de entorno al instanciar
    console.log("🔧 DIAGNÓSTICO DE CONFIGURACIÓN:")
    console.log("🔑 API Key:", this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}...` : "❌ VACÍO")
    console.log("🔑 Client ID:", this.config.clientId ? `${this.config.clientId.substring(0, 15)}...` : "❌ VACÍO")
    console.log("🌍 Variables de entorno disponibles:")
    console.log(
      "   - NEXT_PUBLIC_GOOGLE_API_KEY:",
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? "✅ Disponible" : "❌ No disponible",
    )
    console.log(
      "   - NEXT_PUBLIC_GOOGLE_CLIENT_ID:",
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅ Disponible" : "❌ No disponible",
    )
  }

  // Verificar si hay credenciales válidas
  hasValidCredentials(): boolean {
    return !!(
      this.config.apiKey &&
      this.config.clientId &&
      this.config.apiKey.startsWith("AIza") &&
      this.config.clientId.includes(".apps.googleusercontent.com")
    )
  }

  // 🔄 NUEVO: Verificar si hay una sesión previa sin inicializar Drive
  hasStoredSession(): boolean {
    const token = localStorage.getItem("googleAccessToken")
    const expiry = localStorage.getItem("googleTokenExpiry")

    if (!token || !expiry) {
      return false
    }

    // Verificar si el token no ha expirado
    const expiryTime = Number.parseInt(expiry)
    const now = Date.now()

    return expiryTime > now
  }

  // 🔄 NUEVO: Inicialización ligera solo para verificar credenciales
  async quickInit(): Promise<boolean> {
    try {
      console.log("🔍 Verificación rápida de credenciales...")

      if (!this.hasValidCredentials()) {
        console.log("❌ Credenciales no válidas")
        return false
      }

      console.log("✅ Credenciales válidas")
      return true
    } catch (error) {
      console.error("❌ Error en verificación rápida:", error)
      return false
    }
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
      // 🔍 VERIFICACIÓN DETALLADA DE CONFIGURACIÓN
      console.log("🚀 Iniciando verificación de configuración...")

      if (!this.hasValidCredentials()) {
        const errorMsg = !this.config.apiKey
          ? "CONFIGURACION_INCOMPLETA: API Key no configurada. Verifica tu archivo .env.local y reinicia el servidor"
          : !this.config.clientId
            ? "CONFIGURACION_INCOMPLETA: Client ID no configurado. Verifica tu archivo .env.local y reinicia el servidor"
            : !this.config.apiKey.startsWith("AIza")
              ? "CONFIGURACION_INCORRECTA: API Key debe comenzar con 'AIza'"
              : "CONFIGURACION_INCORRECTA: Client ID debe terminar con '.apps.googleusercontent.com'"

        console.error("❌", errorMsg)
        throw new Error(errorMsg)
      }

      console.log("✅ Configuración verificada correctamente")

      // Cargar la API de Google
      await this.loadGoogleAPI()

      // Verificar que gapi esté completamente cargado
      if (!window.gapi) {
        throw new Error("GAPI_NO_DISPONIBLE: Google API no se cargó correctamente")
      }

      // Cargar módulos necesarios con timeout
      await this.loadGapiModules()

      // 🔍 LOGS ANTES DE INICIALIZAR CLIENTE
      console.log("🔧 Inicializando cliente Google con:")
      console.log("   - API Key:", this.config.apiKey.substring(0, 10) + "...")
      console.log("   - Client ID:", this.config.clientId.substring(0, 20) + "...")
      console.log("   - Scope:", this.config.scope)

      // Inicializar cliente con validación
      await this.initializeGapiClient()

      // Verificar estado de autenticación
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance) {
        throw new Error("AUTH_INSTANCE_ERROR: No se pudo obtener la instancia de autenticación")
      }

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

  // 🔄 MODIFICADO: Inicialización completa solo después del login
  async initializeAfterLogin(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    if (this.isInitialized) {
      return
    }

    this.initializationPromise = this._initializeComplete()
    return this.initializationPromise
  }

  // 🔄 NUEVO: Inicialización solo para datos sin autenticación
  async initializeForDataOnly(): Promise<void> {
    try {
      console.log("🚀 Inicializando Google Drive para datos solamente...")

      if (!this.hasValidCredentials()) {
        throw new Error("CREDENCIALES_INVALIDAS: Las credenciales de Google Drive no están configuradas correctamente")
      }

      // Cargar la API de Google
      await this.loadGoogleAPI()
      await this.loadGapiModules()
      await this.initializeGapiClient()

      // Marcar como inicializado para operaciones básicas
      this.isInitialized = true
      console.log("✅ Google Drive inicializado para datos")
    } catch (error) {
      console.error("❌ Error inicializando Google Drive para datos:", error)
      throw error
    }
  }

  private async _initializeComplete(): Promise<void> {
    try {
      console.log("🚀 Inicializando Google Drive después del login...")

      // Cargar la API de Google
      await this.loadGoogleAPI()

      // Verificar que gapi esté completamente cargado
      if (!window.gapi) {
        throw new Error("GAPI_NO_DISPONIBLE: Google API no se cargó correctamente")
      }

      // Cargar módulos necesarios
      await this.loadGapiModules()

      // Inicializar cliente
      await this.initializeGapiClient()

      // Verificar estado de autenticación
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance) {
        throw new Error("AUTH_INSTANCE_ERROR: No se pudo obtener la instancia de autenticación")
      }

      this.isSignedIn = authInstance.isSignedIn.get()

      if (!this.isSignedIn) {
        // Si no está logueado, intentar con token guardado
        const storedToken = localStorage.getItem("googleAccessToken")
        if (storedToken && this.hasStoredSession()) {
          console.log("🔄 Restaurando sesión desde token guardado...")
          // Aquí podrías implementar lógica para restaurar la sesión
        } else {
          await this.signIn()
        }
      } else {
        await this.validateAndRefreshToken()
      }

      await this.createFolderStructure()
      this.isInitialized = true

      console.log("✅ Google Drive inicializado completamente")
    } catch (error) {
      console.error("❌ Error inicializando Google Drive:", error)
      this.initializationPromise = null
      throw error
    }
  }

  private loadGoogleAPI(): Promise<void> {
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
        // Verificar que gapi esté realmente disponible
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

      // Timeout de 10 segundos
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

  private async initializeGapiClient(): Promise<void> {
    try {
      console.log("🔧 Inicializando cliente GAPI...")

      const initConfig = {
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: this.config.discoveryDocs,
        scope: this.config.scope,
      }

      await window.gapi.client.init(initConfig)

      console.log("✅ Cliente GAPI inicializado correctamente")
    } catch (error: any) {
      console.error("❌ Error inicializando cliente GAPI:", error)

      // Manejo mejorado de errores
      let errorMessage = "Error inicializando cliente Google"

      if (error && typeof error === "object") {
        if (error.details) {
          const details = error.details
          console.log("📋 Detalles del error:", details)

          if (details.includes("invalid_client") || details.includes("unauthorized_client")) {
            errorMessage = "INVALID_CLIENT: Client ID inválido o no autorizado. Verifica NEXT_PUBLIC_GOOGLE_CLIENT_ID"
          } else if (details.includes("origin_mismatch")) {
            errorMessage = "ORIGIN_MISMATCH: El dominio no está autorizado. Configura las URIs en Google Console"
          }
        } else if (error.message) {
          errorMessage = error.message
        } else if (error.error) {
          errorMessage = error.error
        }
      }

      throw new Error(`GAPI_INIT_ERROR: ${errorMessage}`)
    }
  }

  async signIn(): Promise<void> {
    try {
      console.log("🔐 Iniciando proceso de autenticación...")

      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance) {
        throw new Error("AUTH_INSTANCE_NULL: Instancia de autenticación no disponible")
      }

      const googleUser = await authInstance.signIn({
        prompt: "consent", // Forzar pantalla de consentimiento
      })

      this.isSignedIn = true

      // Guardar información del usuario
      const authResponse = googleUser.getAuthResponse()
      localStorage.setItem("googleAccessToken", authResponse.access_token)
      localStorage.setItem("googleTokenExpiry", (Date.now() + authResponse.expires_in * 1000).toString())

      console.log("✅ Autenticación exitosa con Google Drive")
    } catch (error: any) {
      console.error("❌ Error durante el login con Google:", error)

      // Manejo específico de errores de autenticación
      if (error.error === "popup_closed_by_user") {
        throw new Error("POPUP_CERRADO: Necesitas completar la autorización de Google Drive para continuar")
      } else if (error.error === "access_denied") {
        throw new Error("ACCESO_DENEGADO: Acceso denegado. La aplicación necesita permisos de Google Drive")
      } else if (error.error === "invalid_client") {
        throw new Error("CLIENT_INVALIDO: Configuración de cliente inválida. Verifica las credenciales")
      } else if (error.error === "unauthorized_client") {
        throw new Error("CLIENT_NO_AUTORIZADO: Cliente no autorizado. Verifica la configuración en Google Console")
      } else if (error.error === "invalid_scope") {
        throw new Error("SCOPE_INVALIDO: Permisos inválidos. Verifica la configuración de scopes")
      } else {
        throw new Error(`AUTH_ERROR: Error de autenticación: ${error.error || error.message || "Error desconocido"}`)
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
      console.log("📁 Creando estructura de carpetas...")

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

      console.log("✅ Estructura de carpetas creada:", this.folderIds)
    } catch (error) {
      console.error("❌ Error creando estructura de carpetas:", error)
      throw new Error(`FOLDER_STRUCTURE_ERROR: Error creando carpetas: ${error}`)
    }
  }

  private async createFolder(name: string, parentId: string): Promise<any> {
    try {
      // Verificar si la carpeta ya existe
      const existingFolder = await this.findFolder(name, parentId)
      if (existingFolder) {
        console.log(`📁 Carpeta "${name}" ya existe`)
        return existingFolder
      }

      console.log(`📁 Creando carpeta "${name}"...`)

      // Crear nueva carpeta usando gapi.client
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
      })

      console.log(`✅ Carpeta "${name}" creada exitosamente`)
      return response.result
    } catch (error: any) {
      console.error(`❌ Error creando carpeta ${name}:`, error)

      if (error.status === 403) {
        throw new Error(`PERMISSION_DENIED: Sin permisos para crear carpeta ${name}`)
      } else if (error.status === 401) {
        throw new Error(`UNAUTHORIZED: Token expirado o inválido`)
      }

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

  // 🔄 NUEVO: Método simple para autenticación sin inicialización completa
  async authenticateOnly(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log("🔐 Iniciando autenticación simple...")

      // Verificar credenciales básicas
      const credentialsValid = await this.quickInit()
      if (!credentialsValid) {
        return {
          success: false,
          error: "Credenciales de Google Drive no configuradas correctamente",
        }
      }

      // Cargar API mínima
      await this.loadGoogleAPI()
      await this.loadGapiModules()
      await this.initializeGapiClient()

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

  async uploadFile(file: File, fileName: string, folderId?: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initializeAfterLogin()
    }

    await this.validateAndRefreshToken()

    try {
      const metadata = {
        name: fileName,
        parents: folderId ? [folderId] : [this.folderIds.main || "root"],
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
        const errorText = await response.text()
        throw new Error(`UPLOAD_ERROR: Error subiendo archivo (${response.status}): ${errorText}`)
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
        await this.loadGoogleAPI()
        await this.loadGapiModules()
        await this.initializeGapiClient()
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
        await this.loadGoogleAPI()
        await this.loadGapiModules()
        await this.initializeGapiClient()
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
      },
      folderIds: this.folderIds,
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
