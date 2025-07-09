"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, MapPin, Trash2, AlertCircle, Download, Eye, Cloud } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

          <div className="flex gap-2">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg">
                  <Cloud className="h-4 w-4 mr-2" />
                  Subir a Drive
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-slate-800 flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-blue-500" />
                    Subir Fotos a Google Drive
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Las fotos se guardarán en Google Drive y serán visibles para todos los miembros
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {uploadError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-700 text-sm">{uploadError}</span>
                    </div>
                  )}

                  <Input
                    placeholder="Título de la sesión (ej: Ensayo - Estudio Central)"
                    value={newPhotoSession.title}
                    onChange={(e) => setNewPhotoSession({ ...newPhotoSession, title: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-800"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-date" className="text-slate-700">
                        Fecha de la sesión
                      </Label>
                      <Input
                        id="session-date"
                        type="date"
                        value={newPhotoSession.date}
                        onChange={(e) => setNewPhotoSession({ ...newPhotoSession, date: e.target.value })}
                        className="bg-slate-50 border-slate-200 text-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-location" className="text-slate-700">
                        Ubicación
                      </Label>
                      <Input
                        id="session-location"
                        placeholder="Lugar donde se tomaron las fotos"
                        value={newPhotoSession.location}
                        onChange={(e) => setNewPhotoSession({ ...newPhotoSession, location: e.target.value })}
                        className="bg-slate-50 border-slate-200 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo-upload" className="text-slate-700">
                      Seleccionar fotos (máximo 10 archivos, 10MB cada uno)
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="bg-slate-50 border-slate-200 text-slate-800"
                      disabled={isProcessing}
                    />
                    {newPhotoSession.photos.length > 0 && (
                      <p className="text-sm text-slate-600">
                        {newPhotoSession.photos.length} foto{newPhotoSession.photos.length !== 1 ? "s" : ""}{" "}
                        seleccionada{newPhotoSession.photos.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {newPhotoSession.photos.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-slate-700">Vista previa</Label>
                      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                        {newPhotoSession.photos.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file) || "/placeholder.svg"}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-16 object-cover rounded border"
                              onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newPhotos = newPhotoSession.photos.filter((_, i) => i !== index)
                                setNewPhotoSession({ ...newPhotoSession, photos: newPhotos })
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                              disabled={isProcessing}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Almacenamiento en Google Drive</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Las fotos se subirán a Google Drive y serán accesibles para todos los miembros de la banda. Se
                      requiere autorización de Google Drive la primera vez.
                    </p>
                  </div>

                  <Button
                    onClick={handleCreatePhotoSession}
                    disabled={
                      !newPhotoSession.title ||
                      !newPhotoSession.date ||
                      newPhotoSession.photos.length === 0 ||
                      isProcessing
                    }
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Subiendo a Drive...
                      </div>
                    ) : (
                      `Subir ${newPhotoSession.photos.length} fotos a Drive`
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Photo Sessions */}
        <div className="space-y-8">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-blue-600" />
                      {session.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.date + "T00:00:00").toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {session.location}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-slate-600 border-slate-300">
                      {session.photos.length} fotos en Drive
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {session.photos.map((photo) => (
                    <div key={photo.id} className="relative group cursor-pointer">
                      <img
                        src={photo.thumbnailUrl || photo.driveUrl}
                        alt={photo.title}
                        className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePhoto(photo.id)
                        }}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                          <Eye className="h-4 w-4 mx-auto mb-1" />
                          <p className="text-xs font-medium">{photo.title}</p>
                        </div>
                      </div>
                      <div className="absolute bottom-1 left-1">
                        <Badge className="bg-blue-500 text-white text-xs">
                          <Cloud className="h-2 w-2 mr-1" />
                          Drive
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSessions.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <Cloud className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500">No hay fotos para el mes seleccionado</p>
              <p className="text-sm text-slate-400 mt-2">Las fotos se almacenan en Google Drive</p>
            </CardContent>
          </Card>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-slate-800 flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  {selectedPhoto.title}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {new Date(selectedPhoto.date + "T00:00:00").toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  • {selectedPhoto.location} • por {selectedPhoto.photographer}
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                <img
                  src={selectedPhoto.driveUrl || "/placeholder.svg"}
                  alt={selectedPhoto.title}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-500 text-white">
                    <Cloud className="h-3 w-3 mr-1" />
                    Google Drive
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedPhoto.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-slate-600 border-slate-300">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => window.open(selectedPhoto.driveUrl, "_blank")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Ver en Drive
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
