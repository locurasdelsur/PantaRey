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
    console.log("🔧 DIAGNÓSTICO DE CONFIGURACIÓN:")
    console.log("🔑 API Key:", this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}...` : "❌ VACÍO")
    console.log("🔑 Client ID:", this.config.clientId ? `${this.config.clientId.substring(0, 15)}...` : "❌ VACÍO")
    console.log("🌍 Variables de entorno disponibles:")
    console.log("   - NEXT_PUBLIC_GOOGLE_API_KEY:", process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? "✅ Disponible" : "❌ No disponible")
    console.log("   - NEXT_PUBLIC_GOOGLE_CLIENT_ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅ Disponible" : "❌ No disponible")
  }

  // Métodos existentes...

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.client) {
        console.log("✅ Google API ya está cargada")
        resolve()
        return
      }

      console.log("📡 Cargando Google API...")
      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.async = true
      script.defer = true

      // Timeout para detectar fallos en la carga
      const timeout = setTimeout(() => {
        reject(new Error("GAPI_LOAD_TIMEOUT: Timeout al cargar Google API"))
      }, 10000)

      script.onload = () => {
        clearTimeout(timeout)
        console.log("✅ Script de Google API cargado")
        
        // Esperar un momento para que gapi se inicialice completamente
        setTimeout(() => {
          if (window.gapi) {
            console.log("✅ gapi está disponible")
            resolve()
          } else {
            console.error("❌ gapi no está disponible después de cargar")
            reject(new Error("GAPI_LOAD_ERROR: Google API se cargó pero no está disponible"))
          }
        }, 1000)
      }

      script.onerror = () => {
        clearTimeout(timeout)
        console.error("❌ Error cargando script de Google API")
        reject(new Error("GAPI_SCRIPT_ERROR: No se pudo cargar el script de Google API"))
      }

      document.head.appendChild(script)
    })
  }

  private loadGapiModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("📦 Cargando módulos de Google API...")

      const timeout = setTimeout(() => {
        reject(new Error("GAPI_MODULES_TIMEOUT: Timeout cargando módulos de Google API"))
      }, 15000)

      window.gapi.load("client:auth2", {
        callback: () => {
          clearTimeout(timeout)
          console.log("✅ Módulos de Google API cargados")
          resolve()
        },
        onerror: () => {
          clearTimeout(timeout)
          console.error("❌ Error cargando módulos de Google API")
          reject(new Error("GAPI_MODULES_ERROR: Error cargando módulos de Google API"))
        },
        timeout: 10000
      })
    })
  }

  private async initializeGapiClient(): Promise<void> {
    try {
      console.log("🔧 Inicializando cliente GAPI...")
      
      if (!window.gapi || !window.gapi.client) {
        throw new Error("GAPI_CLIENT_NOT_AVAILABLE: gapi.client no está disponible")
      }

      const initConfig = {
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: this.config.discoveryDocs,
        scope: this.config.scope
      }

      console.log("🔍 Configuración de inicialización:", {
        apiKey: initConfig.apiKey ? `${initConfig.apiKey.substring(0, 10)}...` : "❌ VACÍO",
        clientId: initConfig.clientId ? `${initConfig.clientId.substring(0, 15)}...` : "❌ VACÍO",
        discoveryDocs: initConfig.discoveryDocs,
        scope: initConfig.scope
      })

      await window.gapi.client.init(initConfig)

      console.log("✅ Cliente GAPI inicializado correctamente")
    } catch (error: any) {
      console.error("❌ Error inicializando cliente GAPI:", error)
      
      let errorDetails = "Detalles no disponibles"
      if (error.error) errorDetails = error.error
      else if (error.message) errorDetails = error.message
      else if (error.details) errorDetails = error.details

      console.error("📋 Detalles del error:", errorDetails)

      if (errorDetails.includes("invalid_client") || errorDetails.includes("unauthorized_client")) {
        throw new Error("INVALID_CLIENT: Client ID inválido o no autorizado. Verifica NEXT_PUBLIC_GOOGLE_CLIENT_ID")
      }
      if (errorDetails.includes("origin_mismatch")) {
        throw new Error("ORIGIN_MISMATCH: El dominio no está autorizado. Configura las URIs en Google Console")
      }
      if (errorDetails.includes("access_denied")) {
        throw new Error("ACCESS_DENIED: Acceso denegado. Verifica los permisos y scopes")
      }

      throw new Error(`GAPI_INIT_ERROR: ${errorDetails}`)
    }
  }

  private async _initializeWithRetry(retries = 3, delay = 1000): Promise<void> {
    let lastError: Error | null = null
    
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 Intento ${i + 1} de inicialización...`)
        await this._initialize()
        return
      } catch (error: any) {
        console.error(`❌ Intento ${i + 1} fallido:`, error.message)
        lastError = error
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }

    throw lastError || new Error("GAPI_INIT_RETRIES_EXHAUSTED: Todos los intentos fallaron")
  }

  private async _initialize(): Promise<void> {
    try {
      console.log("🚀 Iniciando inicialización de Google Drive...")

      if (!this.config.apiKey || !this.config.clientId) {
        throw new Error("CONFIGURACION_INCOMPLETA: API Key o Client ID no configurados")
      }

      // Cargar la API de Google
      await this.loadGoogleAPI()
      await this.loadGapiModules()
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

  // Resto de los métodos permanecen igual...
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
