"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { unifiedStorage, type PhotoWithDrive } from "@/lib/unified-storage"

interface PhotoSession {
  id: number
  date: string
  title: string
  location: string
  photos: PhotoWithDrive[]
}

export default function PhotosPage() {
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithDrive | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [newPhotoSession, setNewPhotoSession] = useState({
    title: "",
    date: "",
    location: "",
    photos: [] as File[],
  })

  // Cargar datos al inicializar
  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }

    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const photos = await unifiedStorage.getPhotos()

      // Agrupar fotos por sesión (por fecha y ubicación)
      const sessionsMap = new Map<string, PhotoSession>()

      photos.forEach((photo) => {
        const key = `${photo.date}_${photo.location}`
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, {
            id: Date.now() + Math.random(),
            date: photo.date,
            title: `Sesión ${photo.location}`,
            location: photo.location,
            photos: [],
          })
        }
        sessionsMap.get(key)!.photos.push(photo)
      })

      setPhotoSessions(Array.from(sessionsMap.values()))
    } catch (error) {
      console.error("Error loading photos:", error)
    }
  }

  const handleCreatePhotoSession = async () => {
    if (!newPhotoSession.title || !newPhotoSession.date || newPhotoSession.photos.length === 0) {
      setUploadError("Por favor completa todos los campos y selecciona al menos una foto")
      return
    }

    setIsProcessing(true)
    setUploadError("")

    try {
      const uploadPromises = newPhotoSession.photos.map(async (file, index) => {
        const photoData = {
          id: Date.now() + index,
          title: file.name.replace(/\.[^/.]+$/, ""),
          date: newPhotoSession.date,
          location: newPhotoSession.location,
          photographer: currentUser?.name || "Usuario",
          tags: ["nueva-sesion"],
        }

        return await unifiedStorage.uploadPhoto(file, photoData)
      })

      await Promise.all(uploadPromises)

      // Recargar fotos
      await loadPhotos()

      setNewPhotoSession({
        title: "",
        date: "",
        location: "",
        photos: [],
      })
      setIsUploadDialogOpen(false)
    } catch (error) {
      console.error("Error creating photo session:", error)
      setUploadError("Error al subir las fotos. Por favor, intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    setUploadError("")

    if (files) {
      const fileArray = Array.from(files)

      if (fileArray.length > 10) {
        setUploadError("Máximo 10 archivos por sesión")
        return
      }

      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`${file.name} es demasiado grande (máximo 10MB)`)
          return
        }
        if (!file.type.startsWith("image/")) {
          setUploadError(`${file.name} no es una imagen válida`)
          return
        }
      }

      setNewPhotoSession({ ...newPhotoSession, photos: fileArray })
    }
  }

  const deletePhoto = async (photoId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
      try {
        await unifiedStorage.deletePhoto(photoId)
        await loadPhotos()
      } catch (error) {
        console.error("Error deleting photo:", error)
        alert("Error al eliminar la foto")
      }
    }
  }

  const filteredSessions = photoSessions.filter((session) => session.date.startsWith(selectedMonth))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-800 mb-4 inline-flex items-center gap-2 font-medium"
            >
              ← Volver al Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Galería Compartida</h1>
                <p className="text-slate-600">Fotos almacenadas en Google Drive - Visibles para todos</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600\
