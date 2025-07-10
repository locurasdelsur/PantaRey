import { driveStorage } from "./google-drive-storage"

interface User {
  id: number
  name: string
  email: string
  password: string
  instrument: string
  joinDate: string
  avatar: string
}

interface Song {
  id: number
  title: string
  status: "ready" | "practicing" | "developing"
  type: "original" | "cover"
  lyrics?: string
  chords?: string
  notes?: string
  lastUpdated: string
  createdBy: string
  recordings: Recording[]
  coverImageFileId?: string
  comments: Comment[]
  versions: Version[]
}

interface Recording {
  id: number
  name: string
  type: "acustica" | "electrica" | "demo" | "final"
  uploadDate: string
  driveFileId: string
}

interface Photo {
  id: number
  title: string
  date: string
  location: string
  photographer: string
  tags: string[]
  driveFileId: string
}

interface PhotoSession {
  id: number
  date: string
  title: string
  location: string
  photos: Photo[]
}

interface Task {
  id: number
  title: string
  description?: string
  status: "todo" | "doing" | "done"
  priority: "low" | "medium" | "high"
  assignee: string
  dueDate?: string
  createdAt: string
  createdBy: string
}

interface Event {
  id: number
  title: string
  type: "rehearsal" | "gig" | "recording" | "meeting"
  date: string
  time: string
  location: string
  description?: string
  attendees: string[]
  reminder: boolean
}

interface Message {
  id: number
  author: string
  content: string
  timestamp: string
  channel: string
}

interface Idea {
  id: number
  title: string
  type: "riff" | "lyrics" | "melody" | "concept"
  category: "intro" | "verse" | "chorus" | "bridge" | "solo" | "outro" | "complete"
  author: string
  content?: string
  tags: string[]
  createdAt: string
  likes: number
  comments: Comment[]
}

interface Comment {
  id: number
  author: string
  content: string
  timestamp: string
}

interface Version {
  id: number
  version: string
  changes: string
  author: string
  date: string
  audioUrl?: string
}

class DriveDataManager {
  // Usuarios
  async getUsers(): Promise<User[]> {
    const users = await driveStorage.loadData("users.json")
    return users || []
  }

  async saveUsers(users: User[]): Promise<void> {
    await driveStorage.saveData("users.json", users)
  }

  async addUser(user: User): Promise<void> {
    const users = await this.getUsers()
    users.push(user)
    await this.saveUsers(users)
  }

  // Canciones
  async getSongs(): Promise<Song[]> {
    const songs = await driveStorage.loadData("songs.json")
    return songs || []
  }

  async saveSongs(songs: Song[]): Promise<void> {
    await driveStorage.saveData("songs.json", songs)
  }

  async addSong(song: Song): Promise<void> {
    const songs = await this.getSongs()
    songs.push(song)
    await this.saveSongs(songs)
  }

  async updateSong(updatedSong: Song): Promise<void> {
    const songs = await this.getSongs()
    const index = songs.findIndex((s) => s.id === updatedSong.id)
    if (index >= 0) {
      songs[index] = updatedSong
      await this.saveSongs(songs)
    }
  }

  async deleteSong(songId: number): Promise<void> {
    const songs = await this.getSongs()
    const song = songs.find((s) => s.id === songId)

    if (song) {
      // Eliminar archivos de audio
      for (const recording of song.recordings) {
        try {
          await driveStorage.deleteFile(recording.driveFileId)
        } catch (error) {
          console.error("Error deleting recording:", error)
        }
      }

      // Eliminar portada si existe
      if (song.coverImageFileId) {
        try {
          await driveStorage.deleteFile(song.coverImageFileId)
        } catch (error) {
          console.error("Error deleting cover image:", error)
        }
      }

      // Eliminar de la lista
      const updatedSongs = songs.filter((s) => s.id !== songId)
      await this.saveSongs(updatedSongs)
    }
  }

  // Grabaciones de audio
  async uploadSongRecording(file: File, songId: number, recordingData: Omit<Recording, "driveFileId">): Promise<void> {
    const folderIds = driveStorage.getFolderIds()
    const fileName = `${recordingData.name}_${Date.now()}.${file.name.split(".").pop()}`
    const fileId = await driveStorage.uploadFile(file, fileName, folderIds.audio)

    const recording: Recording = {
      ...recordingData,
      driveFileId: fileId,
    }

    const songs = await this.getSongs()
    const songIndex = songs.findIndex((s) => s.id === songId)
    if (songIndex >= 0) {
      songs[songIndex].recordings.push(recording)
      await this.saveSongs(songs)
    }
  }

  async uploadSongCover(file: File, songId: number): Promise<void> {
    const folderIds = driveStorage.getFolderIds()
    const fileName = `cover_${songId}_${Date.now()}.${file.name.split(".").pop()}`
    const fileId = await driveStorage.uploadFile(file, fileName, folderIds.covers)

    const songs = await this.getSongs()
    const songIndex = songs.findIndex((s) => s.id === songId)
    if (songIndex >= 0) {
      // Eliminar portada anterior si existe
      if (songs[songIndex].coverImageFileId) {
        try {
          await driveStorage.deleteFile(songs[songIndex].coverImageFileId!)
        } catch (error) {
          console.error("Error deleting old cover:", error)
        }
      }

      songs[songIndex].coverImageFileId = fileId
      await this.saveSongs(songs)
    }
  }

  // Fotos
  async getPhotoSessions(): Promise<PhotoSession[]> {
    const sessions = await driveStorage.loadData("photo-sessions.json")
    return sessions || []
  }

  async savePhotoSessions(sessions: PhotoSession[]): Promise<void> {
    await driveStorage.saveData("photo-sessions.json", sessions)
  }

  async uploadPhotos(files: File[], sessionData: Omit<PhotoSession, "photos">): Promise<void> {
    const folderIds = driveStorage.getFolderIds()
    const photos: Photo[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = `${sessionData.title}_${Date.now()}_${i}.${file.name.split(".").pop()}`
      const fileId = await driveStorage.uploadFile(file, fileName, folderIds.photos)

      photos.push({
        id: Date.now() + i,
        title: file.name.replace(/\.[^/.]+$/, ""),
        date: sessionData.date,
        location: sessionData.location,
        photographer: "Usuario", // Se puede personalizar
        tags: ["nueva-sesion"],
        driveFileId: fileId,
      })
    }

    const session: PhotoSession = {
      ...sessionData,
      photos,
    }

    const sessions = await this.getPhotoSessions()
    sessions.push(session)
    await this.savePhotoSessions(sessions)
  }

  async deletePhoto(photoId: number): Promise<void> {
    const sessions = await this.getPhotoSessions()
    let photoFound = false

    for (const session of sessions) {
      const photoIndex = session.photos.findIndex((p) => p.id === photoId)
      if (photoIndex >= 0) {
        const photo = session.photos[photoIndex]
        try {
          await driveStorage.deleteFile(photo.driveFileId)
        } catch (error) {
          console.error("Error deleting photo from Drive:", error)
        }

        session.photos.splice(photoIndex, 1)
        photoFound = true
        break
      }
    }

    if (photoFound) {
      // Eliminar sesiones vacías
      const filteredSessions = sessions.filter((s) => s.photos.length > 0)
      await this.savePhotoSessions(filteredSessions)
    }
  }

  // Tareas
  async getTasks(): Promise<Task[]> {
    const tasks = await driveStorage.loadData("tasks.json")
    return tasks || []
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await driveStorage.saveData("tasks.json", tasks)
  }

  // Eventos
  async getEvents(): Promise<Event[]> {
    const events = await driveStorage.loadData("events.json")
    return events || []
  }

  async saveEvents(events: Event[]): Promise<void> {
    await driveStorage.saveData("events.json", events)
  }

  // Mensajes
  async getMessages(): Promise<Message[]> {
    const messages = await driveStorage.loadData("messages.json")
    return messages || []
  }

  async saveMessages(messages: Message[]): Promise<void> {
    await driveStorage.saveData("messages.json", messages)
  }

  // Ideas
  async getIdeas(): Promise<Idea[]> {
    const ideas = await driveStorage.loadData("ideas.json")
    return ideas || []
  }

  async saveIdeas(ideas: Idea[]): Promise<void> {
    await driveStorage.saveData("ideas.json", ideas)
  }

  // Métodos de utilidad
  getFileUrl(fileId: string): string {
    return driveStorage.getFileUrl(fileId)
  }

  getThumbnailUrl(fileId: string, size = 400): string {
    return driveStorage.getThumbnailUrl(fileId, size)
  }
}

export const driveDataManager = new DriveDataManager()
export type { User, Song, Recording, Photo, PhotoSession, Task, Event, Message, Idea, Comment, Version }
