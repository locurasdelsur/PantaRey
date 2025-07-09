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

  constructor(config: GoogleDriveConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Cargar la API de Google
      await this.loadGoogleAPI()

      // Inicializar gapi
      await window.gapi.load("auth2", async () => {
        await window.gapi.auth2.init({
          client_id: this.config.clientId,
        })
      })

      await window.gapi.load("client", async () => {
        await window.gapi.client.init({
          apiKey: this.config.apiKey,
          clientId: this.config.clientId,
          discoveryDocs: this.config.discoveryDocs,
          scope: this.config.scope,
        })
      })

      this.isInitialized = true
      this.isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn.get()

      if (!this.isSignedIn) {
        await this.signIn()
      }

      await this.createFolderStructure()
    } catch (error) {
      console.error("Error initializing Google Drive:", error)
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
      script.onerror = () => reject(new Error("Failed to load Google API"))
      document.head.appendChild(script)
    })
  }

  async signIn(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance()
      await authInstance.signIn()
      this.isSignedIn = true
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
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

      console.log("Estructura de carpetas creada:", this.folderIds)
    } catch (error) {
      console.error("Error creating folder structure:", error)
    }
  }

  private async createFolder(name: string, parentId: string): Promise<any> {
    try {
      // Verificar si la carpeta ya existe
      const existingFolder = await this.findFolder(name, parentId)
      if (existingFolder) {
        return existingFolder
      }

      // Crear nueva carpeta
      const response = await window.gapi.client.drive.files.create({
        resource: {
          name: name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
      })

      return response.result
    } catch (error) {
      console.error(`Error creating folder ${name}:`, error)
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
      console.error(`Error finding folder ${name}:`, error)
      return null
    }
  }

  async uploadFile(file: File, fileName: string, folderId?: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const metadata = {
        name: fileName,
        parents: folderId ? [folderId] : [this.folderIds.main],
      }

      const form = new FormData()
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
      form.append("file", file)

      const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`,
        },
        body: form,
      })

      const result = await response.json()
      return result.id
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  }

  async saveData(fileName: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

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
      console.error(`Error saving data ${fileName}:`, error)
      throw error
    }
  }

  async loadData(fileName: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const file = await this.findFile(fileName, this.folderIds.data)
      if (!file) {
        return null
      }

      const response = await window.gapi.client.drive.files.get({
        fileId: file.id,
        alt: "media",
      })

      return JSON.parse(response.body)
    } catch (error) {
      console.error(`Error loading data ${fileName}:`, error)
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
      console.error(`Error finding file ${name}:`, error)
      return null
    }
  }

  private async updateFile(fileId: string, file: File): Promise<void> {
    try {
      const form = new FormData()
      form.append("file", file)

      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`,
        },
        body: form,
      })
    } catch (error) {
      console.error("Error updating file:", error)
      throw error
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await window.gapi.client.drive.files.delete({
        fileId: fileId,
      })
    } catch (error) {
      console.error("Error deleting file:", error)
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
