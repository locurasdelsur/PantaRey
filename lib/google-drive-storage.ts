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
    this.logConfiguration()
  }

  private logConfiguration() {
    console.group("🔧 Google Drive Storage Configuration")
    console.log("🔑 API Key:", this.config.apiKey ? `${this.config.apiKey.substring(0, 6)}...` : "❌ NOT SET")
    console.log("🔑 Client ID:", this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : "❌ NOT SET")
    console.log("📜 Discovery Docs:", this.config.discoveryDocs)
    console.log("🔓 Scope:", this.config.scope)
    console.groupEnd()
  }

  hasStoredSession(): boolean {
    const token = localStorage.getItem("googleAccessToken")
    const expiry = localStorage.getItem("googleTokenExpiry")
    
    if (!token || !expiry) return false

    const expiryTime = Number.parseInt(expiry)
    const now = Date.now()
    return expiryTime > now
  }

  async quickInit(): Promise<boolean> {
    try {
      if (!this.config.apiKey || !this.config.clientId) {
        console.error("❌ Missing API Key or Client ID")
        return false
      }

      if (!this.config.apiKey.startsWith("AIza")) {
        console.error("❌ Invalid API Key format")
        return false
      }

      if (!this.config.clientId.includes(".apps.googleusercontent.com")) {
        console.error("❌ Invalid Client ID format")
        return false
      }

      return true
    } catch (error) {
      console.error("❌ QuickInit error:", error)
      return false
    }
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    if (this.isInitialized) {
      return
    }

    this.initializationPromise = this._initializeWithRetry()
    return this.initializationPromise
  }

  private async _initializeWithRetry(retries = 3, delay = 1000): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Initialization attempt ${attempt}/${retries}`)
        await this._initialize()
        return
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message)
        lastError = error
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt))
        }
      }
    }

    throw lastError || new Error("Initialization failed after all retries")
  }

  private async _initialize(): Promise<void> {
    try {
      console.group("🚀 Initializing Google Drive Storage")
      
      // Validate configuration
      if (!this.config.apiKey) {
        throw new Error("API Key not configured. Check your .env.local file")
      }

      if (!this.config.clientId) {
        throw new Error("Client ID not configured. Check your .env.local file")
      }

      // Load Google API
      await this.loadGoogleAPI()
      await this.loadGapiModules()
      await this.initializeGapiClient()

      // Handle authentication
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance) {
        throw new Error("Failed to get auth instance")
      }

      this.isSignedIn = authInstance.isSignedIn.get()

      if (!this.isSignedIn) {
        await this.signIn()
      } else {
        await this.validateAndRefreshToken()
      }

      // Setup folder structure
      await this.createFolderStructure()
      
      this.isInitialized = true
      console.log("✅ Google Drive initialized successfully")
    } catch (error) {
      console.error("❌ Initialization failed:", error)
      this.isInitialized = false
      this.initializationPromise = null
      throw error
    } finally {
      console.groupEnd()
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.client) {
        console.log("✅ Google API already loaded")
        return resolve()
      }

      console.log("📡 Loading Google API...")
      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.async = true
      script.defer = true

      const timeout = setTimeout(() => {
        reject(new Error("Timeout loading Google API script"))
      }, 15000)

      script.onload = () => {
        clearTimeout(timeout)
        console.log("✅ Google API script loaded")
        
        // Additional check to ensure gapi is available
        const checkGapi = () => {
          if (window.gapi) {
            console.log("✅ gapi is available")
            resolve()
          } else {
            console.log("⏳ Waiting for gapi...")
            setTimeout(checkGapi, 100)
          }
        }
        
        checkGapi()
      }

      script.onerror = () => {
        clearTimeout(timeout)
        reject(new Error("Failed to load Google API script"))
      }

      document.head.appendChild(script)
    })
  }

  private loadGapiModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("📦 Loading gapi modules...")

      const timeout = setTimeout(() => {
        reject(new Error("Timeout loading gapi modules"))
      }, 15000)

      window.gapi.load("client:auth2", {
        callback: () => {
          clearTimeout(timeout)
          console.log("✅ gapi modules loaded")
          resolve()
        },
        onerror: () => {
          clearTimeout(timeout)
          reject(new Error("Failed to load gapi modules"))
        },
        timeout: 10000
      })
    })
  }

  private async initializeGapiClient(): Promise<void> {
    try {
      console.log("🔧 Initializing gapi client...")
      
      if (!window.gapi.client) {
        throw new Error("gapi.client not available")
      }

      const initConfig = {
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: this.config.discoveryDocs,
        scope: this.config.scope
      }

      console.log("⚙️ Initialization config:", {
        ...initConfig,
        apiKey: initConfig.apiKey ? `${initConfig.apiKey.substring(0, 6)}...` : "❌ MISSING",
        clientId: initConfig.clientId ? `${initConfig.clientId.substring(0, 10)}...` : "❌ MISSING"
      })

      await window.gapi.client.init(initConfig)
      console.log("✅ gapi client initialized")
    } catch (error: any) {
      console.error("❌ gapi client initialization failed:", error)
      
      let errorMessage = "Unknown initialization error"
      if (error.error) errorMessage = error.error
      else if (error.message) errorMessage = error.message
      else if (error.details) errorMessage = error.details

      // Handle specific error cases
      if (errorMessage.includes("invalid_client")) {
        throw new Error("Invalid Client ID configuration")
      }
      if (errorMessage.includes("origin_not_allowed")) {
        throw new Error("Origin not authorized - check Google Cloud Console")
      }

      throw new Error(`GAPI_INIT_ERROR: ${errorMessage}`)
    }
  }

  async signIn(): Promise<void> {
    try {
      console.log("🔐 Starting authentication...")
      
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance) {
        throw new Error("Auth instance not available")
      }

      const googleUser = await authInstance.signIn({
        prompt: "consent"
      })

      this.isSignedIn = true
      const authResponse = googleUser.getAuthResponse()

      // Store session information
      localStorage.setItem("googleAccessToken", authResponse.access_token)
      localStorage.setItem("googleTokenExpiry", (Date.now() + authResponse.expires_in * 1000).toString())

      console.log("✅ Authentication successful")
    } catch (error: any) {
      console.error("❌ Authentication failed:", error)
      
      let errorMessage = "Authentication error"
      if (error.error === "popup_closed_by_user") {
        errorMessage = "Authentication popup was closed"
      } else if (error.error) {
        errorMessage = error.error
      }

      throw new Error(errorMessage)
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

      const authResponse = currentUser.getAuthResponse()
      const expiresAt = authResponse.expires_at
      const now = Date.now()

      if (expiresAt - now < 300000) { // 5 minutes
        console.log("🔄 Refreshing access token...")
        const newAuthResponse = await currentUser.reloadAuthResponse()
        
        localStorage.setItem("googleAccessToken", newAuthResponse.access_token)
        localStorage.setItem("googleTokenExpiry", newAuthResponse.expires_at.toString())
      }
    } catch (error) {
      console.error("❌ Token validation failed:", error)
      throw new Error("Failed to validate session")
    }
  }

  async createFolderStructure(): Promise<void> {
    try {
      console.group("📁 Creating folder structure")
      
      // Main folder
      const mainFolder = await this.createFolder("Panta Rei Project", "root")
      this.folderIds.main = mainFolder.id

      // Subfolders
      const dataFolder = await this.createFolder("Data", mainFolder.id)
      const photosFolder = await this.createFolder("Photos", mainFolder.id)
      const songsFolder = await this.createFolder("Songs", mainFolder.id)
      const audioFolder = await this.createFolder("Audio", songsFolder.id)
      const coversFolder = await this.createFolder("Covers", songsFolder.id)

      this.folderIds.data = dataFolder.id
      this.folderIds.photos = photosFolder.id
      this.folderIds.songs = songsFolder.id
      this.folderIds.audio = audioFolder.id
      this.folderIds.covers = coversFolder.id

      console.log("✅ Folder structure created:", this.folderIds)
    } catch (error) {
      console.error("❌ Failed to create folder structure:", error)
      throw error
    } finally {
      console.groupEnd()
    }
  }

  private async createFolder(name: string, parentId: string): Promise<any> {
    try {
      const existingFolder = await this.findFolder(name, parentId)
      if (existingFolder) {
        console.log(`📁 Folder "${name}" already exists`)
        return existingFolder
      }

      console.log(`📁 Creating folder "${name}"...`)
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
      })

      console.log(`✅ Folder "${name}" created`)
      return response.result
    } catch (error: any) {
      console.error(`❌ Failed to create folder "${name}":`, error)
      
      if (error.status === 403) {
        throw new Error("Permission denied")
      } else if (error.status === 401) {
        throw new Error("Authentication required")
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
      console.error(`❌ Failed to find folder "${name}":`, error)
      return null
    }
  }

  // Rest of your methods (uploadFile, saveData, loadData, etc.) remain the same
  // ...
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
