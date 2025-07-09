"use client"

import type React from "react"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Plus, Calendar, MapPin, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Photo {
  id: number
  url: string
  title: string
  date: string
  location: string
  photographer: string
  tags: string[]
}

interface PhotoSession {
  id: number
  date: string
  title: string
  location: string
  photos: Photo[]
}

export default function PhotosPage() {
  // Cambiar el estado inicial para que esté vacío
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])

  const [selectedMonth, setSelectedMonth] = useState("2025-01")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  // Agregar estado para el diálogo de subir fotos
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [newPhotoSession, setNewPhotoSession] = useState({
    title: "",
    date: "",
    location: "",
    photos: [] as File[],
  })

  // Agregar función para manejar la subida de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileArray = Array.from(files)
      setNewPhotoSession({ ...newPhotoSession, photos: fileArray })
    }
  }

  // Agregar función para crear nueva sesión de fotos
  const handleCreatePhotoSession = () => {
    if (newPhotoSession.title && newPhotoSession.date && newPhotoSession.photos.length > 0) {
      const newSession: PhotoSession = {
        id: Date.now(),
        title: newPhotoSession.title,
        date: newPhotoSession.date,
        location: newPhotoSession.location,
        photos: newPhotoSession.photos.map((file, index) => ({
          id: Date.now() + index,
          url: URL.createObjectURL(file), // En producción esto sería una URL real
          title: file.name.replace(/\.[^/.]+$/, ""), // Nombre sin extensión
          date: newPhotoSession.date,
          location: newPhotoSession.location,
          photographer: "Usuario", // En una app real vendría del usuario logueado
          tags: ["nueva-sesion"],
        })),
      }

      setPhotoSessions([...photoSessions, newSession])
      setNewPhotoSession({
        title: "",
        date: "",
        location: "",
        photos: [],
      })
      setIsUploadDialogOpen(false)
    }
  }

  // Agregar función para borrar sesión de fotos
  const deletePhotoSession = (sessionId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta sesión de fotos?")) {
      setPhotoSessions(photoSessions.filter((session) => session.id !== sessionId))
    }
  }

  // Agregar función para borrar foto individual
  const deletePhoto = (sessionId: number, photoId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
      setPhotoSessions(
        photoSessions
          .map((session) =>
            session.id === sessionId
              ? { ...session, photos: session.photos.filter((photo) => photo.id !== photoId) }
              : session,
          )
          .filter((session) => session.photos.length > 0),
      ) // Eliminar sesión si no quedan fotos
    }
  }

  const months = [
    { value: "2025-01", label: "Enero 2025" },
    { value: "2024-12", label: "Diciembre 2024" },
    { value: "2024-11", label: "Noviembre 2024" },
  ]

  const filteredSessions = photoSessions.filter((session) => session.date.startsWith(selectedMonth))

  const allPhotos = photoSessions.flatMap((session) => session.photos)
  const currentPhotoIndex = selectedPhoto ? allPhotos.findIndex((p) => p.id === selectedPhoto.id) : -1

  const navigatePhoto = (direction: "prev" | "next") => {
    if (currentPhotoIndex === -1) return

    let newIndex
    if (direction === "prev") {
      newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : allPhotos.length - 1
    } else {
      newIndex = currentPhotoIndex < allPhotos.length - 1 ? currentPhotoIndex + 1 : 0
    }

    setSelectedPhoto(allPhotos[newIndex])
  }

  // También agregar una función para agregar fotos a sesiones existentes
  const addPhotosToSession = (sessionId: number, files: File[]) => {
    const session = photoSessions.find((s) => s.id === sessionId)
    if (session) {
      const newPhotos: Photo[] = files.map((file, index) => ({
        id: Date.now() + index,
        url: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, ""),
        date: session.date,
        location: session.location,
        photographer: "Usuario",
        tags: ["agregada-posteriormente"],
      }))

      setPhotoSessions(
        photoSessions.map((s) => (s.id === sessionId ? { ...s, photos: [...s.photos, ...newPhotos] } : s)),
      )
    }
  }

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
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Galería de Fotos</h1>
                <p className="text-slate-600">Momentos capturados de ensayos y presentaciones</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          {/* Cambiar el botón "Subir Fotos" para que abra el diálogo */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Subir Fotos
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Subir Nueva Sesión de Fotos</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Crea una nueva sesión y sube las fotos de tu ensayo o presentación
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                    Seleccionar fotos
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="bg-slate-50 border-slate-200 text-slate-800"
                  />
                  {newPhotoSession.photos.length > 0 && (
                    <p className="text-sm text-slate-600">
                      {newPhotoSession.photos.length} foto{newPhotoSession.photos.length !== 1 ? "s" : ""} seleccionada
                      {newPhotoSession.photos.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Vista previa de las fotos seleccionadas */}
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
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPhotos = newPhotoSession.photos.filter((_, i) => i !== index)
                              setNewPhotoSession({ ...newPhotoSession, photos: newPhotos })
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreatePhotoSession}
                  disabled={!newPhotoSession.title || !newPhotoSession.date || newPhotoSession.photos.length === 0}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  Crear Sesión de Fotos ({newPhotoSession.photos.length} fotos)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Month Filter */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-slate-600" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-slate-600 border-slate-300">
                {filteredSessions.reduce((total, session) => total + session.photos.length, 0)} fotos
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Photo Sessions */}
        <div className="space-y-8">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                {/* En el JSX, agregar botón de eliminar sesión después del badge: */}
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Camera className="h-5 w-5 text-purple-600" />
                      {session.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.date).toLocaleDateString("es-ES", {
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
                      {session.photos.length} fotos
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePhotoSession(session.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {session.photos.map((photo) => (
                    // Para cada foto individual, agregar botón de eliminar:
                    <div key={photo.id} className="relative group cursor-pointer">
                      <img
                        src={photo.url || "/placeholder.svg"}
                        alt={photo.title}
                        className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePhoto(session.id, photo.id)
                        }}
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                          <p className="text-sm font-medium">{photo.title}</p>
                          <p className="text-xs">por {photo.photographer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {session.photos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">¿Más fotos de esta sesión?</span>
                      <div className="relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              addPhotosToSession(session.id, Array.from(e.target.files))
                              e.target.value = "" // Limpiar el input
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline" size="sm" className="border-slate-300 text-slate-600 bg-transparent">
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSessions.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500">No hay fotos para el mes seleccionado</p>
            </CardContent>
          </Card>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-slate-800">{selectedPhoto.title}</DialogTitle>
                <DialogDescription className="text-slate-600">
                  {selectedPhoto.date} • {selectedPhoto.location} • por {selectedPhoto.photographer}
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                <img
                  src={selectedPhoto.url || "/placeholder.svg"}
                  alt={selectedPhoto.title}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePhoto("prev")}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePhoto("next")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedPhoto.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-slate-600 border-slate-300">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
