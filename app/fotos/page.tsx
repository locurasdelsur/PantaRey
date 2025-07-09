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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Camera,
  Plus,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertCircle,
  Grid3X3,
  List,
  Download,
  Share2,
  Eye,
  X,
} from "lucide-react"
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
  base64Data?: string
}

interface PhotoSession {
  id: number
  date: string
  title: string
  location: string
  photos: Photo[]
}

export default function PhotosPage() {
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set())
  const [newPhotoSession, setNewPhotoSession] = useState({
    title: "",
    date: "",
    location: "",
    photos: [] as File[],
  })

  // Cargar datos al inicializar el componente
  useEffect(() => {
    const savedSessions = localStorage.getItem("bandPhotoSessions")
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions)
        setPhotoSessions(parsedSessions)
      } catch (error) {
        console.error("Error loading photo sessions:", error)
      }
    }
  }, [])

  // Guardar datos cada vez que cambien las sesiones
  useEffect(() => {
    if (photoSessions.length > 0) {
      localStorage.setItem("bandPhotoSessions", JSON.stringify(photoSessions))
    }
  }, [photoSessions])

  // Función para convertir archivo a base64 con validación
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error(`El archivo ${file.name} es demasiado grande. Máximo 5MB.`))
        return
      }

      if (!file.type.startsWith("image/")) {
        reject(new Error(`${file.name} no es un archivo de imagen válido.`))
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        try {
          resolve(reader.result as string)
        } catch (error) {
          reject(new Error(`Error procesando ${file.name}`))
        }
      }
      reader.onerror = () => reject(new Error(`Error leyendo ${file.name}`))
    })
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
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`${file.name} es demasiado grande (máximo 5MB)`)
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

  const handleCreatePhotoSession = async () => {
    if (!newPhotoSession.title || !newPhotoSession.date || newPhotoSession.photos.length === 0) {
      setUploadError("Por favor completa todos los campos y selecciona al menos una foto")
      return
    }

    setIsProcessing(true)
    setUploadError("")

    try {
      const photosWithBase64: Photo[] = []

      for (let i = 0; i < newPhotoSession.photos.length; i++) {
        const file = newPhotoSession.photos[i]
        try {
          const base64Data = await fileToBase64(file)
          photosWithBase64.push({
            id: Date.now() + i,
            url: base64Data,
            title: file.name.replace(/\.[^/.]+$/, ""),
            date: newPhotoSession.date,
            location: newPhotoSession.location,
            photographer: "Usuario",
            tags: ["nueva-sesion"],
            base64Data: base64Data,
          })
        } catch (error) {
          console.error(`Error procesando ${file.name}:`, error)
          setUploadError(`Error procesando ${file.name}: ${error.message}`)
          setIsProcessing(false)
          return
        }
      }

      const newSession: PhotoSession = {
        id: Date.now(),
        title: newPhotoSession.title,
        date: newPhotoSession.date,
        location: newPhotoSession.location,
        photos: photosWithBase64,
      }

      setPhotoSessions([...photoSessions, newSession])
      setNewPhotoSession({
        title: "",
        date: "",
        location: "",
        photos: [],
      })
      setIsUploadDialogOpen(false)
    } catch (error) {
      console.error("Error creating photo session:", error)
      setUploadError("Error al crear la sesión de fotos. Por favor, intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  const deletePhotoSession = (sessionId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta sesión de fotos?")) {
      const updatedSessions = photoSessions.filter((session) => session.id !== sessionId)
      setPhotoSessions(updatedSessions)
      if (updatedSessions.length === 0) {
        localStorage.removeItem("bandPhotoSessions")
      } else {
        localStorage.setItem("bandPhotoSessions", JSON.stringify(updatedSessions))
      }
    }
  }

  const deletePhoto = (sessionId: number, photoId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
      const updatedSessions = photoSessions
        .map((session) =>
          session.id === sessionId
            ? { ...session, photos: session.photos.filter((photo) => photo.id !== photoId) }
            : session,
        )
        .filter((session) => session.photos.length > 0)

      setPhotoSessions(updatedSessions)
      if (updatedSessions.length === 0) {
        localStorage.removeItem("bandPhotoSessions")
      } else {
        localStorage.setItem("bandPhotoSessions", JSON.stringify(updatedSessions))
      }
    }
  }

  // Funciones para selección múltiple
  const togglePhotoSelection = (photoId: number) => {
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId)
    } else {
      newSelection.add(photoId)
    }
    setSelectedPhotos(newSelection)
  }

  const selectAllPhotos = () => {
    const allPhotoIds = filteredSessions.flatMap((session) => session.photos.map((photo) => photo.id))
    setSelectedPhotos(new Set(allPhotoIds))
  }

  const clearSelection = () => {
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  const deleteSelectedPhotos = () => {
    if (selectedPhotos.size === 0) return

    if (confirm(`¿Estás seguro de que quieres eliminar ${selectedPhotos.size} fotos seleccionadas?`)) {
      const updatedSessions = photoSessions
        .map((session) => ({
          ...session,
          photos: session.photos.filter((photo) => !selectedPhotos.has(photo.id)),
        }))
        .filter((session) => session.photos.length > 0)

      setPhotoSessions(updatedSessions)
      setSelectedPhotos(new Set())
      setSelectionMode(false)

      if (updatedSessions.length === 0) {
        localStorage.removeItem("bandPhotoSessions")
      } else {
        localStorage.setItem("bandPhotoSessions", JSON.stringify(updatedSessions))
      }
    }
  }

  const generateMonths = () => {
    const months = []
    const currentDate = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = date.toISOString().slice(0, 7)
      const label = date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })

      months.push({
        value,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      })
    }

    return months
  }

  const months = generateMonths()

  const getMonthStats = () => {
    const stats: { [key: string]: number } = {}

    photoSessions.forEach((session) => {
      const monthKey = session.date.slice(0, 7)
      stats[monthKey] = (stats[monthKey] || 0) + session.photos.length
    })

    return stats
  }

  const monthStats = getMonthStats()
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

  const navigateMonth = (direction: "prev" | "next") => {
    const currentIndex = months.findIndex((m) => m.value === selectedMonth)
    if (currentIndex === -1) return

    let newIndex
    if (direction === "prev") {
      newIndex = currentIndex < months.length - 1 ? currentIndex + 1 : 0
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : months.length - 1
    }

    setSelectedMonth(months[newIndex].value)
  }

  const addPhotosToSession = async (sessionId: number, files: File[]) => {
    const session = photoSessions.find((s) => s.id === sessionId)
    if (!session) return

    setIsProcessing(true)
    try {
      const newPhotosWithBase64: Photo[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const base64Data = await fileToBase64(file)
          newPhotosWithBase64.push({
            id: Date.now() + i,
            url: base64Data,
            title: file.name.replace(/\.[^/.]+$/, ""),
            date: session.date,
            location: session.location,
            photographer: "Usuario",
            tags: ["agregada-posteriormente"],
            base64Data: base64Data,
          })
        } catch (error) {
          console.error(`Error adding photo ${file.name}:`, error)
          alert(`Error al agregar ${file.name}: ${error.message}`)
          setIsProcessing(false)
          return
        }
      }

      const updatedSessions = photoSessions.map((s) =>
        s.id === sessionId ? { ...s, photos: [...s.photos, ...newPhotosWithBase64] } : s,
      )

      setPhotoSessions(updatedSessions)
      localStorage.setItem("bandPhotoSessions", JSON.stringify(updatedSessions))
    } catch (error) {
      console.error("Error adding photos:", error)
      alert("Error al agregar las fotos. Por favor, intenta de nuevo.")
    } finally {
      setIsProcessing(false)
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

          <div className="flex gap-2">
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
                      Seleccionar fotos (máximo 10 archivos, 5MB cada uno)
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
                        seleccionada
                        {newPhotoSession.photos.length !== 1 ? "s" : ""}
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
                    {isProcessing ? "Procesando..." : `Crear Sesión de Fotos (${newPhotoSession.photos.length} fotos)`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Controls */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-4">
                  <Camera className="h-5 w-5 text-slate-600" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[200px] bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{month.label}</span>
                            {monthStats[month.value] && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {monthStats[month.value]}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMonth === new Date().toISOString().slice(0, 7) && (
                    <Badge className="bg-green-500 text-white">Mes actual</Badge>
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 px-2"
                  >
                    <Grid3X3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-7 px-2"
                  >
                    <List className="h-3 w-3" />
                  </Button>
                </div>

                {/* Selection Mode */}
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectionMode(!selectionMode)
                    if (selectionMode) {
                      setSelectedPhotos(new Set())
                    }
                  }}
                  className="h-7"
                >
                  {selectionMode ? "Cancelar" : "Seleccionar"}
                </Button>

                <Badge variant="outline" className="text-slate-600 border-slate-300">
                  {filteredSessions.reduce((total, session) => total + session.photos.length, 0)} fotos
                </Badge>
                <Badge variant="outline" className="text-slate-600 border-slate-300">
                  {filteredSessions.length} sesiones
                </Badge>
              </div>
            </div>

            {/* Selection Actions */}
            {selectionMode && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    {selectedPhotos.size} foto{selectedPhotos.size !== 1 ? "s" : ""} seleccionada
                    {selectedPhotos.size !== 1 ? "s" : ""}
                  </span>
                  {selectedPhotos.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearSelection} className="h-6 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllPhotos} className="h-7 bg-transparent">
                    Seleccionar todas
                  </Button>
                  {selectedPhotos.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" className="h-7 bg-transparent">
                        <Download className="h-3 w-3 mr-1" />
                        Descargar
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 bg-transparent">
                        <Share2 className="h-3 w-3 mr-1" />
                        Compartir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deleteSelectedPhotos}
                        className="h-7 text-red-600 hover:text-red-700 bg-transparent"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Sessions */}
        <div className="space-y-8">
          {filteredSessions.map((session) => (
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
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {session.photos.map((photo) => (
                      <div key={photo.id} className="relative group cursor-pointer">
                        {selectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              checked={selectedPhotos.has(photo.id)}
                              onCheckedChange={() => togglePhotoSelection(photo.id)}
                              className="bg-white/80 border-2"
                            />
                          </div>
                        )}
                        <img
                          src={photo.url || "/placeholder.svg"}
                          alt={photo.title}
                          className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200"
                          onClick={() => !selectionMode && setSelectedPhoto(photo)}
                        />
                        {!selectionMode && (
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
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                            <Eye className="h-4 w-4 mx-auto mb-1" />
                            <p className="text-xs font-medium">{photo.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="space-y-3">
                    {session.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {selectionMode && (
                          <Checkbox
                            checked={selectedPhotos.has(photo.id)}
                            onCheckedChange={() => togglePhotoSelection(photo.id)}
                          />
                        )}
                        <img
                          src={photo.url || "/placeholder.svg"}
                          alt={photo.title}
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                          onClick={() => !selectionMode && setSelectedPhoto(photo)}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{photo.title}</h4>
                          <p className="text-sm text-slate-600">por {photo.photographer}</p>
                          <div className="flex gap-1 mt-1">
                            {photo.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {!selectionMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePhoto(session.id, photo.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

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
                              e.target.value = ""
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isProcessing}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-300 text-slate-600 bg-transparent"
                          disabled={isProcessing}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {isProcessing ? "Procesando..." : "Agregar"}
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
