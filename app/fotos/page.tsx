"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Camera,
  Upload,
  Grid3X3,
  List,
  Calendar,
  MapPin,
  Eye,
  Trash2,
  Plus,
  ArrowLeft,
  ImageIcon,
  Download,
  Share2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { driveStorage } from "@/lib/google-drive-storage"

interface PhotoSession {
  id: string
  name: string
  date: string
  location: string
  description: string
  photos: Photo[]
  coverPhoto?: string
}

interface Photo {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  uploadDate: string
  size: number
  type: string
}

export default function FotosPage() {
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])
  const [selectedSession, setSelectedSession] = useState<PhotoSession | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [newSession, setNewSession] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
  })
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [showPhotoDialog, setShowPhotoDialog] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    loadPhotoSessions()
  }, [])

  const loadPhotoSessions = async () => {
    try {
      setIsLoading(true)
      const data = await driveStorage.loadData("photo-sessions.json")
      if (data) {
        setPhotoSessions(data)
      }
    } catch (error) {
      console.error("Error loading photo sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePhotoSessions = async (sessions: PhotoSession[]) => {
    try {
      await driveStorage.saveData("photo-sessions.json", sessions)
      setPhotoSessions(sessions)
    } catch (error) {
      console.error("Error saving photo sessions:", error)
    }
  }

  const createPhotoSession = async () => {
    if (!newSession.name || !newSession.date) return

    const session: PhotoSession = {
      id: Date.now().toString(),
      name: newSession.name,
      date: newSession.date,
      location: newSession.location,
      description: newSession.description,
      photos: [],
    }

    const updatedSessions = [...photoSessions, session]
    await savePhotoSessions(updatedSessions)

    setNewSession({ name: "", date: "", location: "", description: "" })
    setShowNewSessionDialog(false)
  }

  const uploadPhotos = async (sessionId: string, files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    try {
      const session = photoSessions.find((s) => s.id === sessionId)
      if (!session) return

      const newPhotos: Photo[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue

        const photoId = `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const fileName = `${session.name}_${photoId}.${file.name.split(".").pop()}`

        try {
          const fileId = await driveStorage.uploadFile(file, fileName, driveStorage.getFolderIds().photos)

          const photo: Photo = {
            id: photoId,
            name: file.name,
            url: driveStorage.getFileUrl(fileId),
            thumbnailUrl: driveStorage.getThumbnailUrl(fileId),
            uploadDate: new Date().toISOString(),
            size: file.size,
            type: file.type,
          }

          newPhotos.push(photo)
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
        }
      }

      const updatedSessions = photoSessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              photos: [...s.photos, ...newPhotos],
              coverPhoto: s.coverPhoto || newPhotos[0]?.thumbnailUrl,
            }
          : s,
      )

      await savePhotoSessions(updatedSessions)
    } catch (error) {
      console.error("Error uploading photos:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const deletePhotoSession = async (sessionId: string) => {
    const updatedSessions = photoSessions.filter((s) => s.id !== sessionId)
    await savePhotoSessions(updatedSessions)
  }

  const getMonthOptions = () => {
    const months = new Set<string>()
    photoSessions.forEach((session) => {
      const month = session.date.substring(0, 7) // YYYY-MM
      months.add(month)
    })
    return Array.from(months).sort().reverse()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredSessions = photoSessions.filter(
    (session) => selectedMonth === "all" || session.date.startsWith(selectedMonth),
  )

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
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Galería de Fotos</h1>
                <p className="text-slate-600">Gestiona las fotos de ensayos, conciertos y eventos de la banda</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Sesión
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Sesión de Fotos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-name">Nombre de la Sesión</Label>
                    <Input
                      id="session-name"
                      value={newSession.name}
                      onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                      placeholder="Ej: Concierto en el Teatro Principal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-date">Fecha</Label>
                    <Input
                      id="session-date"
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-location">Ubicación</Label>
                    <Input
                      id="session-location"
                      value={newSession.location}
                      onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                      placeholder="Ej: Teatro Principal, Madrid"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-description">Descripción</Label>
                    <Input
                      id="session-description"
                      value={newSession.description}
                      onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                      placeholder="Descripción opcional del evento"
                    />
                  </div>
                  <Button onClick={createPhotoSession} className="w-full">
                    Crear Sesión
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + "-01").toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-slate-600">
              {filteredSessions.length} sesiones
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando sesiones de fotos...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSessions.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-12 text-center">
              <Camera className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay sesiones de fotos</h3>
              <p className="text-slate-600 mb-6">
                {selectedMonth !== "all"
                  ? "No hay sesiones para el mes seleccionado"
                  : "Crea tu primera sesión de fotos"}
              </p>
              <Button
                onClick={() => setShowNewSessionDialog(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sesión
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Photo Sessions Grid */}
        {!isLoading && filteredSessions.length > 0 && (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-slate-800 mb-1">{session.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(session.date).toLocaleDateString("es-ES")}
                        </div>
                        {session.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePhotoSession(session.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {session.coverPhoto && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={session.coverPhoto || "/placeholder.svg"}
                        alt={session.name}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  {session.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{session.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {session.photos.length} fotos
                    </Badge>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && uploadPhotos(session.id, e.target.files)}
                        className="hidden"
                        id={`upload-${session.id}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${session.id}`)?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Photo Session Detail Dialog */}
        <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedSession && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{selectedSession.name}</DialogTitle>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedSession.date).toLocaleDateString("es-ES")}
                    </div>
                    {selectedSession.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedSession.location}
                      </div>
                    )}
                    <Badge variant="secondary">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {selectedSession.photos.length} fotos
                    </Badge>
                  </div>
                </DialogHeader>
                <div className="mt-4">
                  {selectedSession.description && <p className="text-slate-600 mb-6">{selectedSession.description}</p>}
                  {selectedSession.photos.length === 0 ? (
                    <div className="text-center py-8">
                      <Camera className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No hay fotos en esta sesión</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && uploadPhotos(selectedSession.id, e.target.files)}
                        className="hidden"
                        id={`upload-detail-${selectedSession.id}`}
                      />
                      <Button
                        onClick={() => document.getElementById(`upload-detail-${selectedSession.id}`)?.click()}
                        className="mt-4"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Fotos
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedSession.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group cursor-pointer rounded-lg overflow-hidden"
                          onClick={() => {
                            setSelectedPhoto(photo)
                            setShowPhotoDialog(true)
                          }}
                        >
                          <img
                            src={photo.thumbnailUrl || "/placeholder.svg"}
                            alt={photo.name}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Photo Detail Dialog */}
        <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
          <DialogContent className="max-w-3xl">
            {selectedPhoto && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedPhoto.name}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <img
                    src={selectedPhoto.url || "/placeholder.svg"}
                    alt={selectedPhoto.name}
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Tamaño:</span>
                      <span className="ml-2 text-slate-600">{formatFileSize(selectedPhoto.size)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Tipo:</span>
                      <span className="ml-2 text-slate-600">{selectedPhoto.type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Subida:</span>
                      <span className="ml-2 text-slate-600">
                        {new Date(selectedPhoto.uploadDate).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" onClick={() => window.open(selectedPhoto.url, "_blank")}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPhoto.url)
                        // You could add a toast notification here
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Copiar enlace
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Upload Progress */}
        {isUploading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
              <span className="text-sm font-medium">Subiendo fotos...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
