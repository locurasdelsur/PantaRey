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

    // Enhanced diagnostics for production debugging
    console.log("🔧 Google Drive Config Debug:")
    console.table({
      Environment: process.env.NODE_ENV || "unknown",
      "API Key Present": !!this.config.apiKey,
      "API Key Length": this.config.apiKey?.length || 0,
      "API Key Preview": this.config.apiKey?.slice(0, 10) + "..." || "❌ MISSING",
      "Client ID Present": !!this.config.clientId,
      "Client ID Length": this.config.clientId?.length || 0,
      "Client ID Preview": this.config.clientId?.slice(0, 15) + "..." || "❌ MISSING",
      Origin: typeof window !== "undefined" ? window.location.origin : "SSR",
      "CSP Check": typeof window !== "undefined" ? "Browser" : "Server",
    })

    // Additional logs for Netlify deployment
    if (typeof window !== "undefined") {
      console.log("🌐 Runtime Environment Variables:")
      console.log("NEXT_PUBLIC_GOOGLE_API_KEY:", process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? "✅ Present" : "❌ Missing")
      console.log(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID:",
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅ Present" : "❌ Missing",
      )

      // CSP debugging
      console.log("🛡️ CSP Debug Info:")
      console.log("Current Origin:", window.location.origin)
      console.log("Document readyState:", document.readyState)
      console.log("User Agent:", navigator.userAgent.slice(0, 50) + "...")
    }
  }

  /* ───────────────────────── HELPERS ───────────────────────── */

  private loadGoogleApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        console.log("✅ GAPI already loaded")
        return resolve()
      }

      console.log("📦 Loading GAPI script...")
      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.async = true
      script.defer = true

      script.onload = () => {
        console.log("✅ GAPI script loaded successfully")
        if (window.gapi) {
          resolve()
        } else {
          reject(new Error("GAPI script loaded but window.gapi not available"))
        }
      }

      script.onerror = (error) => {
        console.error("❌ Failed to load GAPI script:", error)
        reject(new Error("Unable to load Google API script - check CSP settings"))
      }

      // Add nonce if available for CSP
      const cspNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute("content")
      if (cspNonce) {
        script.nonce = cspNonce
      }

      document.head.appendChild(script)
    })
  }

  private loadGapiModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🔧 Loading GAPI modules...")

      const timeoutId = setTimeout(() => {
        reject(new Error("GAPI modules loading timeout - possible CSP issue"))
      }, 15000) // 15 second timeout

      window.gapi.load("client:auth2", {
        callback: () => {
          clearTimeout(timeoutId)
          console.log("✅ GAPI modules loaded successfully")
          resolve()
        },
        onerror: (error: any) => {
          clearTimeout(timeoutId)
          console.error("❌ Error loading GAPI modules:", error)
          reject(new Error("Error loading GAPI modules - check CSP frame-src settings"))
        },
        timeout: 10000,
        ontimeout: () => {
          clearTimeout(timeoutId)
          reject(new Error("GAPI modules loading timeout"))
        },
      })
    })
  }

  private initGapiClient(): Promise<void> {
    console.log("🚀 Initializing GAPI client...")

    return window.gapi.client
      .init({
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: this.config.discoveryDocs,
        scope: this.config.scope,
      })
      .then(() => {
        console.log("✅ GAPI client initialized successfully")
      })
      .catch((error: any) => {
        console.error("❌ GAPI client initialization error:", error)

        // Enhanced error handling for common CSP issues
        if (error?.error === "idpiframe_initialization_failed") {
          const origin = window.location.origin
          throw new Error(
            `🛡️ CSP Error: The domain "${origin}" is not authorized for Google Sign-In.\n\n` +
              `To fix this:\n` +
              `1. Add "${origin}" to Google Cloud Console → OAuth 2.0 Client ID → "Authorized JavaScript origins"\n` +
              `2. Ensure your CSP allows 'frame-src https://accounts.google.com'\n` +
              `3. Check that your _headers file is properly configured in Netlify`,
          )
        }

        if (/has not been registered/iu.test(error?.details || "")) {
          throw new Error(
            `🔑 OAuth Error: This domain is not registered with Google OAuth.\n` +
              `Add your domain to the Google Cloud Console OAuth configuration.`,
          )
        }

        if (error?.message?.includes("CSP") || error?.message?.includes("frame")) {
          throw new Error(
            `🛡️ CSP Error: Content Security Policy is blocking Google APIs.\n` +
              `Ensure your _headers file includes the proper CSP directives.`,
          )
        }

        throw new Error(`GAPI_INIT_ERROR: ${error?.details || error?.message || "Unknown initialization error"}`)
      })
  }

  private async ensureClientReady() {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = (async () => {
      try {
        await this.loadGoogleApi()
        await this.loadGapiModules()
        await this.initGapiClient()
        this.isInitialized = true
        console.log("🎉 Google Drive client ready!")
      } catch (error) {
        console.error("❌ Failed to initialize Google Drive client:", error)
        this.initializationPromise = null // Reset for retry
        throw error
      }
    })()

    return this.initializationPromise
  }

  private async validateAndRefreshToken(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance.isSignedIn.get()) {
        console.log("🔐 User not signed in, signing in...")
        await authInstance.signIn()
      }

      const user = authInstance.currentUser.get()
      const authResponse = user.getAuthResponse()

      // Check if token is expiring soon (less than 5 minutes)
      const expiresIn = authResponse.expires_in || 0
      if (expiresIn < 300) {
        console.log("🔄 Refreshing access token...")
        await user.reloadAuthResponse()
      }
    } catch (error) {
      console.error("❌ Error validating token:", error)
      throw new Error("TOKEN_VALIDATION_ERROR: Error validating access token")
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
      console.error(`❌ Error finding file ${name}:`, error)
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
      console.error(`❌ Error finding folder ${name}:`, error)
      return null
    }
  }

  private async createFolder(name: string, parentId: string): Promise<string> {
    try {
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
      })

      console.log(`✅ Created folder: ${name}`)
      return response.result.id
    } catch (error) {
      console.error(`❌ Error creating folder ${name}:`, error)
      throw error
    }
  }

  private async setupFolderStructure(): Promise<void> {
    try {
      console.log("📁 Setting up folder structure...")

      // Main app folder
      const mainFolder = await this.findFolder("Panta Rei Project", "root")
      if (!mainFolder) {
        const folderId = await this.createFolder("Panta Rei Project", "root")
        this.folderIds.main = folderId
      } else {
        this.folderIds.main = mainFolder.id
      }

      // Sub-folders
      const subFolders = [
        { name: "Data", key: "data" },
        { name: "Photos", key: "photos" },
        { name: "Audio", key: "audio" },
        { name: "Covers", key: "covers" },
      ]

      for (const folder of subFolders) {
        const subFolder = await this.findFolder(folder.name, this.folderIds.main)
        if (!subFolder) {
          const folderId = await this.createFolder(folder.name, this.folderIds.main)
          this.folderIds[folder.key] = folderId
        } else {
          this.folderIds[folder.key] = subFolder.id
        }
      }

      console.log("✅ Folder structure ready:", this.folderIds)
    } catch (error) {
      console.error("❌ Error setting up folder structure:", error)
      throw error
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
        throw new Error(`UPDATE_ERROR: Error updating file (${response.status}): ${errorText}`)
      }

      console.log("✅ File updated successfully")
    } catch (error) {
      console.error("❌ Error updating file:", error)
      throw error
    }
  }

  /* ───────────────────────── PUBLIC API ───────────────────────── */

  async quickInit(): Promise<boolean> {
    console.log("🔍 QuickInit - Verifying credentials...")

    // Check that variables exist
    if (!this.config.apiKey) {
      console.error("❌ API Key not found")
      console.log("Received value:", this.config.apiKey)
      return false
    }

    if (!this.config.clientId) {
      console.error("❌ Client ID not found")
      console.log("Received value:", this.config.clientId)
      return false
    }

    // Check format
    if (!this.config.apiKey.startsWith("AIza")) {
      console.error("❌ API Key format incorrect (should start with 'AIza')")
      console.log("Received API Key:", this.config.apiKey.slice(0, 10) + "...")
      return false
    }

    if (!this.config.clientId.includes(".apps.googleusercontent.com")) {
      console.error("❌ Client ID format incorrect (should end with '.apps.googleusercontent.com')")
      console.log("Received Client ID:", this.config.clientId.slice(0, 20) + "...")
      return false
    }

    try {
      console.log("✅ Valid credentials, initializing GAPI...")
      await this.ensureClientReady()
      console.log("✅ GAPI initialized correctly")
      return true
    } catch (error) {
      console.error("❌ Error initializing GAPI:", error)
      return false
    }
  }

  async authenticateOnly(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🔐 Starting authentication...")
      await this.ensureClientReady()

      const auth = window.gapi.auth2.getAuthInstance()
      if (!auth.isSignedIn.get()) {
        console.log("📝 User not signed in, prompting for consent...")
        await auth.signIn({
          prompt: "consent",
          ux_mode: "popup", // Use popup mode to avoid CSP issues with redirects
        })
      }

      console.log("✅ Authentication successful")
      return { success: true }
    } catch (error: any) {
      console.error("❌ Authentication error:", error)

      // Provide specific error messages for common issues
      if (error.message?.includes("popup_blocked")) {
        return {
          success: false,
          error: "Popup blocked by browser. Please allow popups for this site and try again.",
        }
      }

      if (error.message?.includes("CSP") || error.message?.includes("frame")) {
        return {
          success: false,
          error: "Content Security Policy is blocking Google Sign-In. Please check your CSP configuration.",
        }
      }

      return {
        success: false,
        error: error.message || "Google authentication error",
      }
    }
  }

  async initializeAfterLogin(): Promise<void> {
    console.log("🚀 Initializing after login...")

    await this.ensureClientReady()

    const auth = window.gapi.auth2.getAuthInstance()
    if (!auth.isSignedIn.get()) {
      await auth.signIn({
        prompt: "consent",
        ux_mode: "popup",
      })
    }

    this.isSignedIn = true
    await this.setupFolderStructure()

    console.log("✅ Post-login initialization complete")
  }

  async loadUsersOnly(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.ensureClientReady()
      }

      console.log("📂 Loading users from Drive...")

      // Look for users file in root or data folder
      let usersFile = await this.findFile("users.json", "root")

      if (!usersFile) {
        // Look in data folder if it exists
        const dataFolder =
          (await this.findFolder("Data", "root")) || (await this.findFolder("Panta Rei Project", "root"))
        if (dataFolder) {
          const subDataFolder = await this.findFolder("Data", dataFolder.id)
          if (subDataFolder) {
            usersFile = await this.findFile("users.json", subDataFolder.id)
          }
        }
      }

      if (!usersFile) {
        console.log("📝 users.json file not found, returning empty array")
        return []
      }

      const response = await window.gapi.client.drive.files.get({
        fileId: usersFile.id,
        alt: "media",
      })

      const users = JSON.parse(response.body) || []
      console.log(`✅ Loaded ${users.length} users from Drive`)
      return users
    } catch (error) {
      console.error("❌ Error loading users:", error)
      return []
    }
  }

  async saveUsersOnly(users: any[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.ensureClientReady()
      }

      console.log("💾 Saving users to Drive...")

      const jsonData = JSON.stringify(users, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const file = new File([blob], "users.json", { type: "application/json" })

      // Look for existing file
      let existingFile = await this.findFile("users.json", "root")

      if (!existingFile) {
        const dataFolder =
          (await this.findFolder("Data", "root")) || (await this.findFolder("Panta Rei Project", "root"))
        if (dataFolder) {
          const subDataFolder = await this.findFolder("Data", dataFolder.id)
          if (subDataFolder) {
            existingFile = await this.findFile("users.json", subDataFolder.id)
          }
        }
      }

      if (existingFile) {
        await this.updateFile(existingFile.id, file)
        console.log("✅ Users file updated")
      } else {
        // Create in root if no data folder exists
        await this.uploadFile(file, "users.json", "root")
        console.log("✅ Users file created")
      }
    } catch (error) {
      console.error("❌ Error saving users:", error)
      throw error
    }
  }

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

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`UPLOAD_ERROR: ${res.statusText} - ${errorText}`)
    }

    const json = await res.json()
    console.log(`✅ File uploaded: ${fileName}`)
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

      // Check if file already exists
      const existingFile = await this.findFile(fileName, this.folderIds.data)

      if (existingFile) {
        await this.updateFile(existingFile.id, file)
      } else {
        await this.uploadFile(file, fileName, this.folderIds.data)
      }

      console.log(`✅ Data saved: ${fileName}`)
    } catch (error) {
      console.error(`❌ Error saving data ${fileName}:`, error)
      throw new Error(`SAVE_DATA_ERROR: Error saving ${fileName}: ${error}`)
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
        console.log(`📝 File ${fileName} not found`)
        return null
      }

      const response = await window.gapi.client.drive.files.get({
        fileId: file.id,
        alt: "media",
      })

      const data = JSON.parse(response.body)
      console.log(`✅ Data loaded: ${fileName}`)
      return data
    } catch (error) {
      console.error(`❌ Error loading data ${fileName}:`, error)
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
      console.log("✅ File deleted successfully")
    } catch (error) {
      console.error("❌ Error deleting file:", error)
      throw new Error(`DELETE_ERROR: Error deleting file: ${error}`)
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
    console.log("🔄 Reconnecting to Google Drive...")
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
      hasGapi: !!window.gapi,
      hasAuth2: !!(window.gapi && window.gapi.auth2),
      hasClient: !!(window.gapi && window.gapi.client),
      config: {
        hasApiKey: !!this.config.apiKey,
        hasClientId: !!this.config.clientId,
        apiKeyLength: this.config.apiKey?.length || 0,
        clientIdLength: this.config.clientId?.length || 0,
        apiKeyFormat: this.config.apiKey?.startsWith("AIza") ? "Correct" : "Incorrect",
        clientIdFormat: this.config.clientId?.includes(".apps.googleusercontent.com") ? "Correct" : "Incorrect",
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasApiKeyEnv: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        hasClientIdEnv: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        origin: typeof window !== "undefined" ? window.location.origin : "SSR",
      },
      folderIds: this.folderIds,
    }
  }
}

declare global {
  var gapi: any
}

export const driveStorage = new GoogleDriveStorage({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  scope: "https://www.googleapis.com/auth/drive.file",
})
