"use client"

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
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Camera, Plus, Calendar, MapPin, ChevronLeft, ChevronRight, Tag, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Photo {
  id: number
  url: string
  title: string
  date: string // Fecha de la foto individual
  location: string
  photographer: string
  tags: string[]
}

interface PhotoSession {
  id: number
  date: string // Fecha de la sesión (para agrupar)
  title: string // Título de la sesión (ej: "Ensayo 2025-01-10")
  location: string // Ubicación de la sesión
  photos: Photo[]
}

export default function PhotosPage() {
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])
  const [selectedMonth, setSelectedMonth] = useState("all") // Cambiado a "all" por defecto
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false)

  const [newPhoto, setNewPhoto] = useState({
    url: "",
    title: "",
    date: new Date().toISOString().split("T")[0], // Fecha actual por defecto
    location: "",
    photographer: "",
    tags: "", // string separado por comas
  })

  const months = [
    { value: "all", label: "Todos los meses" },
    { value: "2025-01", label: "Enero 2025" },
    { value: "2024-12", label: "Diciembre 2024" },
    { value: "2024-11", label: "Noviembre 2024" },
  ]

  const filteredSessions = photoSessions
    .filter((session) => selectedMonth === "all" || session.date.startsWith(selectedMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ordenar por fecha descendente

  const allPhotos = filteredSessions.flatMap((session) => session.photos)
  const currentPhotoIndex = selectedPhoto ? allPhotos.findIndex((p) => p.id === selectedPhoto.id) : -1

  const navigatePhoto = (direction: "prev" | "next") => {
    if (currentPhotoIndex === -1 || allPhotos.length === 0) return

    let newIndex
    if (direction === "prev") {
      newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : allPhotos.length - 1
    } else {
      newIndex = currentPhotoIndex < allPhotos.length - 1 ? currentPhotoIndex + 1 : 0
    }

    setSelectedPhoto(allPhotos[newIndex])
  }

  const handleAddPhoto = () => {
    if (!newPhoto.title || !newPhoto.url || !newPhoto.date || !newPhoto.location || !newPhoto.photographer) {
      alert("Por favor, completa todos los campos obligatorios.")
      return
    }

    const photo: Photo = {
      id: Date.now(),
      url: newPhoto.url,
      title: newPhoto.title,
      date: newPhoto.date,
      location: newPhoto.location,
      photographer: newPhoto.photographer,
      tags: newPhoto.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
    }

    setPhotoSessions((prevSessions) => {
      const existingSessionIndex = prevSessions.findIndex((session) => session.date === newPhoto.date)

      if (existingSessionIndex > -1) {
        // Añadir a la sesión existente
        const updatedSessions = [...prevSessions]
        updatedSessions[existingSessionIndex] = {
          ...updatedSessions[existingSessionIndex],
          photos: [...updatedSessions[existingSessionIndex].photos, photo],
        }
        return updatedSessions
      } else {
        // Crear nueva sesión
        const newSession: PhotoSession = {
          id: Date.now(),
          date: newPhoto.date,
          title: `Sesión de Fotos del ${new Date(newPhoto.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
          location: newPhoto.location, // Usar la ubicación de la primera foto en la sesión
          photos: [photo],
        }
        return [...prevSessions, newSession]
      }
    })

    // Resetear formulario y cerrar diálogo
    setNewPhoto({
      url: "",
      title: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      photographer: "",
      tags: "",
    })
    setIsAddPhotoDialogOpen(false)
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

          <Dialog open={isAddPhotoDialogOpen} onOpenChange={setIsAddPhotoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Subir Fotos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-800">
              <DialogHeader>
                <DialogTitle>Subir Nueva Foto</DialogTitle>
                <DialogDescription>Añade una nueva foto a tu galería con sus detalles.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Título de la foto"
                  value={newPhoto.title}
                  onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  className="col-span-4 bg-slate-50 border-slate-200"
                />
                <Input
                  placeholder="URL de la imagen (ej: /placeholder.svg)"
                  value={newPhoto.url}
                  onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                  className="col-span-4 bg-slate-50 border-slate-200"
                />
                <Input
                  type="date"
                  value={newPhoto.date}
                  onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                  className="col-span-2 bg-slate-50 border-slate-200"
                />
                <Input
                  placeholder="Ubicación (ej: Estudio Central)"
                  value={newPhoto.location}
                  onChange={(e) => setNewPhoto({ ...newPhoto, location: e.target.value })}
                  className="col-span-2 bg-slate-50 border-slate-200"
                />
                <Input
                  placeholder="Fotógrafo (ej: Juan Pérez)"
                  value={newPhoto.photographer}
                  onChange={(e) => setNewPhoto({ ...newPhoto, photographer: e.target.value })}
                  className="col-span-4 bg-slate-50 border-slate-200"
                />
                <Input
                  placeholder="Etiquetas (separadas por coma, ej: show, ensayo, backstage)"
                  value={newPhoto.tags}
                  onChange={(e) => setNewPhoto({ ...newPhoto, tags: e.target.value })}
                  className="col-span-4 bg-slate-50 border-slate-200"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddPhoto} className="bg-purple-500 hover:bg-purple-600 text-white">
                  Subir Foto
                </Button>
              </DialogFooter>
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
                {allPhotos.length} fotos
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Photo Sessions */}
        <div className="space-y-8">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <Card key={session.id} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
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
                    <Badge variant="outline" className="text-slate-600 border-slate-300">
                      {session.photos.length} fotos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {session.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <img
                          src={photo.url || "/placeholder.svg"}
                          alt={photo.title}
                          className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
                            <p className="text-sm font-medium">{photo.title}</p>
                            <p className="text-xs flex items-center justify-center gap-1">
                              <User className="h-3 w-3" />
                              {photo.photographer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <Camera className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-500">No hay fotos para el mes seleccionado</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Photo Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-slate-800">{selectedPhoto.title}</DialogTitle>
                <DialogDescription className="text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedPhoto.date).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedPhoto.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedPhoto.photographer}
                  </span>
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
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-slate-600 border-slate-300 flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />#{tag}
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
