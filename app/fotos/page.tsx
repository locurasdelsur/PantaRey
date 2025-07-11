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
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-amber-100 text-amber-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${viewMode === "list" ? "bg-amber-100 text-amber-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={() => setIsUploadDialogOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              + Nueva Sesión
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <label className="text-slate-700 font-medium">Filtrar por mes:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <span className="text-slate-600">
              {filteredSessions.length} sesión{filteredSessions.length !== 1 ? "es" : ""} encontrada
              {filteredSessions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Contenido principal */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay fotos para este mes</h3>
            <p className="text-slate-600 mb-6">Crea una nueva sesión de fotos para comenzar</p>
            <button
              onClick={() => setIsUploadDialogOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-200"
            >
              + Nueva Sesión
            </button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {session.photos.length > 0 && session.photos[0].driveUrl ? (
                    <Image
                      src={session.photos[0].driveUrl || "/placeholder.svg"}
                      alt={session.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {session.photos.length} foto{session.photos.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{session.title}</h3>
                  <div className="flex items-center gap-4 text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{session.location}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {session.photos.slice(0, 4).map((photo, index) => (
                      <div
                        key={photo.id}
                        className="aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        {photo.driveUrl ? (
                          <Image
                            src={photo.driveUrl || "/placeholder.svg"}
                            alt={photo.title}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition-colors">
                    Ver todas las fotos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de nueva sesión */}
        {isUploadDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Nueva Sesión de Fotos</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-2">Título de la sesión</label>
                  <input
                    type="text"
                    value={newPhotoSession.title}
                    onChange={(e) => setNewPhotoSession({ ...newPhotoSession, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ej: Sesión en el estudio"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">Fecha</label>
                  <input
                    type="date"
                    value={newPhotoSession.date}
                    onChange={(e) => setNewPhotoSession({ ...newPhotoSession, date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">Ubicación</label>
                  <input
                    type="text"
                    value={newPhotoSession.location}
                    onChange={(e) => setNewPhotoSession({ ...newPhotoSession, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ej: Estudio XYZ"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">Fotos (máximo 10)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  {newPhotoSession.photos.length > 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      {newPhotoSession.photos.length} archivo{newPhotoSession.photos.length !== 1 ? "s" : ""}{" "}
                      seleccionado{newPhotoSession.photos.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{uploadError}</div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsUploadDialogOpen(false)
                    setUploadError("")
                    setNewPhotoSession({ title: "", date: "", location: "", photos: [] })
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePhotoSession}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isProcessing ? "Subiendo..." : "Crear Sesión"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de foto seleccionada */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">{selectedPhoto.title}</h3>
                  <button onClick={() => setSelectedPhoto(null)} className="text-slate-500 hover:text-slate-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden mb-4">
                  {selectedPhoto.driveUrl ? (
                    <Image
                      src={selectedPhoto.driveUrl || "/placeholder.svg"}
                      alt={selectedPhoto.title}
                      width={800}
                      height={600}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Fecha:</span>
                    <span className="text-slate-600 ml-2">{new Date(selectedPhoto.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Ubicación:</span>
                    <span className="text-slate-600 ml-2">{selectedPhoto.location}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Fotógrafo:</span>
                    <span className="text-slate-600 ml-2">{selectedPhoto.photographer}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Tags:</span>
                    <span className="text-slate-600 ml-2">{selectedPhoto.tags.join(", ")}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => deletePhoto(selectedPhoto.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                  {selectedPhoto.driveUrl && (
                    <a
                      href={selectedPhoto.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Ver en Drive
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
