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

    // 🔍 DIAGNÓSTICO: Verificar variables de entorno al instanciar
    console.log("🔧 DIAGNÓSTICO DE CONFIGURACIÓN:")
    console.log("🔑 API Key:", this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}…` : "❌ VACÍO")
    console.log("🔑 Client ID:", this.config.clientId ? `${this.config.clientId.substring(0, 15)}…` : "❌ VACÍO")
    console.log("🌍 NEXT_PUBLIC_GOOGLE_API_KEY:", process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? "✅" : "❌")
    console.log("🌍 NEXT_PUBLIC_GOOGLE_CLIENT_ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅" : "❌")
  }

  /* ────────────────────────────────
   *  VALIDACIÓN BÁSICA
   * ──────────────────────────────── */
  hasValidCredentials(): boolean {
    return (
      !!this.config.apiKey &&
      !!this.config.clientId &&
      this.config.apiKey.startsWith("AIza") &&
      this.config.clientId.includes(".apps.googleusercontent.com")
    )
  }

  hasStoredSession(): boolean {
    const token = localStorage.getItem("googleAccessToken")
    const expiry = localStorage.getItem("googleTokenExpiry")
    return !!token && !!expiry && Number.parseInt(expiry) > Date.now()
  }

  /* ────────────────────────────────
   *  INICIALIZACIÓN
   * ──────────────────────────────── */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise
    this.initializationPromise = this._initialize()
    return this.initializationPromise
  }

  private async _initialize(): Promise<void> {
    if (!this.hasValidCredentials()) {
      throw new Error("Credenciales de Google Drive inválidas o incompletas")
    }

    await this.loadGoogleAPI()
    await this.loadGapiModules()
    await this.initializeGapiClient()

    const auth = window.gapi.auth2.getAuthInstance()
    if (!auth) throw new Error("AUTH_INSTANCE_ERROR: no auth2 instance")

    this.isSignedIn = auth.isSignedIn.get()
    if (!this.isSignedIn) await this.signIn()
    else await this.validateAndRefreshToken()

    await this.createFolderStructure()
    this.isInitialized = true
  }

  /* ────────────────────────────────
   *  CARGA DE SDK
   * ──────────────────────────────── */
  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) return resolve()
      const s = document.createElement("script")
      s.src = "https://apis.google.com/js/api.js"
      s.async = true
      s.onload = () => (window.gapi ? resolve() : reject(new Error("GAPI load failed")))
      s.onerror = () => reject(new Error("GAPI script error"))
      document.head.appendChild(s)
    })
  }

  private loadGapiModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load("client:auth2", {
        callback: resolve,
        onerror: () => reject(new Error("GAPI modules load error")),
      })
    })
  }

  private async initializeGapiClient() {
    await window.gapi.client.init({
      apiKey: this.config.apiKey,
      clientId: this.config.clientId,
      discoveryDocs: this.config.discoveryDocs,
      scope: this.config.scope,
    })
  }

  /* ────────────────────────────────
   *  AUTH
   * ──────────────────────────────── */
  private async signIn() {
    const auth = window.gapi.auth2.getAuthInstance()
    const user = await auth.signIn({ prompt: "consent" })
    const { access_token, expires_in } = user.getAuthResponse()
    localStorage.setItem("googleAccessToken", access_token)
    localStorage.setItem("googleTokenExpiry", (Date.now() + expires_in * 1000).toString())
    this.isSignedIn = true
  }

  private async validateAndRefreshToken() {
    const auth = window.gapi.auth2.getAuthInstance()
    const user = auth.currentUser.get()
    const { expires_at } = user.getAuthResponse()
    if (expires_at - Date.now() < 5 * 60 * 1000) {
      const refreshed = await user.reloadAuthResponse()
      localStorage.setItem("googleAccessToken", refreshed.access_token)
      localStorage.setItem("googleTokenExpiry", refreshed.expires_at.toString())
    }
  }

  /* ────────────────────────────────
   *  ESTRUCTURA DE CARPETAS
   * ──────────────────────────────── */
  private async createFolderStructure() {
    const main = await this.createOrFindFolder("Panta Rei Project", "root")
    const data = await this.createOrFindFolder("Datos", main.id)
    const photos = await this.createOrFindFolder("Fotos", main.id)
    const songs = await this.createOrFindFolder("Canciones", main.id)
    const audio = await this.createOrFindFolder("Audio", songs.id)
    const covers = await this.createOrFindFolder("Portadas", songs.id)

    Object.assign(this.folderIds, {
      main: main.id,
      data: data.id,
      photos: photos.id,
      songs: songs.id,
      audio: audio.id,
      covers: covers.id,
    })
  }

  private async createOrFindFolder(name: string, parentId: string) {
    const existing = await this.findFolder(name, parentId)
    if (existing) return existing
    const res = await window.gapi.client.drive.files.create({
      resource: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
    })
    return res.result
  }

  private async findFolder(name: string, parentId: string) {
    const res = await window.gapi.client.drive.files.list({
      q: `name='${name}' and '${parentId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
      fields: "files(id,name)",
    })
    return res.result.files?.[0] ?? null
  }

  /* ────────────────────────────────
   *  OPERACIONES DE ARCHIVOS
   * ──────────────────────────────── */
  async uploadFile(file: File, newName: string, folderId = this.folderIds.main): Promise<string> {
    if (!this.isInitialized) await this.initialize()
    await this.validateAndRefreshToken()

    const metadata = { name: newName, parents: [folderId] }
    const form = new FormData()
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
    form.append("file", file)

    const token = window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error(`UPLOAD_ERROR: ${await res.text()}`)
    const json = await res.json()
    return json.id
  }

  private async updateFile(fileId: string, file: File) {
    const token = window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type },
      body: file,
    })
    if (!res.ok) throw new Error(`UPDATE_ERROR: ${await res.text()}`)
  }

  async deleteFile(fileId: string) {
    if (!this.isInitialized) await this.initialize()
    await this.validateAndRefreshToken()
    await window.gapi.client.drive.files.delete({ fileId })
  }

  /* ────────────────────────────────
   *  UTILIDADES
   * ──────────────────────────────── */
  getFileUrl(id: string) {
    return `https://drive.google.com/file/d/${id}/view`
  }

  getThumbnailUrl(id: string, size = 400) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`
  }

  getFolderIds() {
    return this.folderIds
  }

  /* ────────────────────────────────
   *  USERS (light-weight helpers)
   * ──────────────────────────────── */
  async loadUsersOnly() {
    if (!this.isInitialized) {
      await this.loadGoogleAPI()
      await this.loadGapiModules()
      await this.initializeGapiClient()
    }

    const usersFile = await this.findFile("users.json", "root")
    if (!usersFile) return []

    const res = await window.gapi.client.drive.files.get({ fileId: usersFile.id, alt: "media" })
    return JSON.parse(res.body) ?? []
  }

  async saveUsersOnly(users: any[]) {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: "application/json" })
    const file = new File([blob], "users.json", { type: "application/json" })

    const existing = await this.findFile("users.json", "root")
    if (existing) await this.updateFile(existing.id, file)
    else await this.uploadFile(file, "users.json", "root")
  }

  /* ────────────────────────────────
   *  MISC
   * ──────────────────────────────── */
  private async findFile(name: string, parentId: string) {
    const res = await window.gapi.client.drive.files.list({
      q: `name='${name}' and '${parentId}' in parents and trashed=false`,
      fields: "files(id,name)",
    })
    return res.result.files?.[0] ?? null
  }

  async reconnect() {
    this.isInitialized = false
    this.isSignedIn = false
    this.initializationPromise = null
    localStorage.removeItem("googleAccessToken")
    localStorage.removeItem("googleTokenExpiry")
    await this.initialize()
  }

  isConnected() {
    return this.isInitialized && this.isSignedIn
  }

  getDiagnosticInfo() {
    return {
      isInitialized: this.isInitialized,
      isSignedIn: this.isSignedIn,
      hasStoredSession: this.hasStoredSession(),
      folderIds: this.folderIds,
      env: {
        apiKey: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        clientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      },
    }
  }
}

/* ────────────────────────────────
 *  DECLARACIÓN GLOBAL + INSTANCIA
 * ──────────────────────────────── */
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
