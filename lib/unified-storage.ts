import { githubStorage } from "./github-storage"
import { driveStorage } from "./google-drive-storage"

interface PhotoWithDrive {
  id: number
  title: string
  date: string
  location: string
  photographer: string
  tags: string[]
  driveUrl: string
  driveFileId: string
  thumbnailUrl?: string
}

interface SongWithDrive {
  id: number
  title: string
  status: "ready" | "practicing" | "developing"
  type: "original" | "cover"
  lyrics?: string
  chords?: string
  notes?: string
  lastUpdated: string
  createdBy: string
  recordings: RecordingWithDrive[]
  coverImageUrl?: string
  coverImageFileId?: string
}

interface RecordingWithDrive {
  id: number
  name: string
  type: "acustica" | "electrica" | "demo" | "final"
  uploadDate: string
  driveUrl: string
  driveFileId: string
}

class UnifiedStorage {
  // Fotos
  async uploadPhoto(file: File, photoData: Omit<PhotoWithDrive, "driveUrl" | "driveFileId">): Promise<PhotoWithDrive> {
    try {
      // Subir archivo a Google Drive
      const fileName = `photo_${photoData.id}_${file.name}`
      const driveUrl = await driveStorage.uploadFile(file, fileName)
      const driveFileId = this.extractFileIdFromUrl(driveUrl)

      const photoWithDrive: PhotoWithDrive = {
        ...photoData,
        driveUrl,
        driveFileId,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400`,
      }

      // Guardar metadatos en GitHub
      const photos = await githubStorage.getFile("data/photos.json")
      const updatedPhotos = [...(photos.content || []), photoWithDrive]
      await githubStorage.saveFile("data/photos.json", updatedPhotos, photos.sha)

      return photoWithDrive
    } catch (error) {
      console.error("Error uploading photo:", error)
      throw error
    }
  }

  async getPhotos(): Promise<PhotoWithDrive[]> {
    try {
      const result = await githubStorage.getFile("data/photos.json")
      return result.content || []
    } catch (error) {
      console.error("Error getting photos:", error)
      return []
    }
  }

  async deletePhoto(photoId: number) {
    try {
      const photos = await this.getPhotos()
      const photo = photos.find((p) => p.id === photoId)

      if (photo) {
        // Eliminar de Google Drive
        await driveStorage.deleteFile(photo.driveFileId)

        // Eliminar metadatos de GitHub
        const updatedPhotos = photos.filter((p) => p.id !== photoId)
        const photosData = await githubStorage.getFile("data/photos.json")
        await githubStorage.saveFile("data/photos.json", updatedPhotos, photosData.sha)
      }
    } catch (error) {
      console.error("Error deleting photo:", error)
      throw error
    }
  }

  // Canciones y grabaciones
  async uploadSongRecording(
    file: File,
    songId: number,
    recordingData: Omit<RecordingWithDrive, "driveUrl" | "driveFileId">,
  ): Promise<RecordingWithDrive> {
    try {
      // Subir archivo a Google Drive
      const fileName = `song_${songId}_${recordingData.name}_${file.name}`
      const driveUrl = await driveStorage.uploadFile(file, fileName)
      const driveFileId = this.extractFileIdFromUrl(driveUrl)

      const recordingWithDrive: RecordingWithDrive = {
        ...recordingData,
        driveUrl,
        driveFileId,
      }

      // Actualizar canción en GitHub
      const songs = await this.getSongs()
      const updatedSongs = songs.map((song) =>
        song.id === songId ? { ...song, recordings: [...song.recordings, recordingWithDrive] } : song,
      )

      const songsData = await githubStorage.getFile("data/songs.json")
      await githubStorage.saveFile("data/songs.json", updatedSongs, songsData.sha)

      return recordingWithDrive
    } catch (error) {
      console.error("Error uploading song recording:", error)
      throw error
    }
  }

  async uploadSongCover(file: File, songId: number): Promise<string> {
    try {
      const fileName = `cover_${songId}_${file.name}`
      const driveUrl = await driveStorage.uploadFile(file, fileName)
      const driveFileId = this.extractFileIdFromUrl(driveUrl)

      // Actualizar canción en GitHub
      const songs = await this.getSongs()
      const updatedSongs = songs.map((song) =>
        song.id === songId ? { ...song, coverImageUrl: driveUrl, coverImageFileId: driveFileId } : song,
      )

      const songsData = await githubStorage.getFile("data/songs.json")
      await githubStorage.saveFile("data/songs.json", updatedSongs, songsData.sha)

      return driveUrl
    } catch (error) {
      console.error("Error uploading song cover:", error)
      throw error
    }
  }

  async getSongs(): Promise<SongWithDrive[]> {
    try {
      const result = await githubStorage.getFile("data/songs.json")
      return result.content || []
    } catch (error) {
      console.error("Error getting songs:", error)
      return []
    }
  }

  async saveSong(song: SongWithDrive) {
    try {
      const songs = await this.getSongs()
      const existingIndex = songs.findIndex((s) => s.id === song.id)

      let updatedSongs
      if (existingIndex >= 0) {
        updatedSongs = [...songs]
        updatedSongs[existingIndex] = song
      } else {
        updatedSongs = [...songs, song]
      }

      const songsData = await githubStorage.getFile("data/songs.json")
      await githubStorage.saveFile("data/songs.json", updatedSongs, songsData.sha)
    } catch (error) {
      console.error("Error saving song:", error)
      throw error
    }
  }

  async deleteSong(songId: number) {
    try {
      const songs = await this.getSongs()
      const song = songs.find((s) => s.id === songId)

      if (song) {
        // Eliminar grabaciones de Google Drive
        for (const recording of song.recordings) {
          await driveStorage.deleteFile(recording.driveFileId)
        }

        // Eliminar portada si existe
        if (song.coverImageFileId) {
          await driveStorage.deleteFile(song.coverImageFileId)
        }

        // Eliminar de GitHub
        const updatedSongs = songs.filter((s) => s.id !== songId)
        const songsData = await githubStorage.getFile("data/songs.json")
        await githubStorage.saveFile("data/songs.json", updatedSongs, songsData.sha)
      }
    } catch (error) {
      console.error("Error deleting song:", error)
      throw error
    }
  }

  private extractFileIdFromUrl(url: string): string {
    const match = url.match(/id=([a-zA-Z0-9-_]+)/)
    return match ? match[1] : ""
  }
}

export const unifiedStorage = new UnifiedStorage()
export type { PhotoWithDrive, SongWithDrive, RecordingWithDrive }
