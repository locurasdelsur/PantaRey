"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Camera,
  Upload,
  Calendar,
  MapPin,
  User,
  Download,
  Trash2,
  Eye,
  ImageIcon,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { MobileNav } from "@/components/mobile-nav"
import { driveDataManager } from "@/lib/drive-data-manager"
import type { PhotoSession, Photo } from "@/lib/drive-data-manager"

export default function PhotosPage() {
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [sessionData, setSessionData] = useState({
    title: "",
    date: "",
    location: "",
  })
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadData()
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const sessions = await driveDataManager.getPhotoSessions()
      setPhotoSessions(sessions)
    } catch (error) {
      console.error("Error loading photo sessions:", error)
      setError("Error al cargar las sesiones de fotos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length !== files.length) {
      setError("Solo se permiten archivos de imagen")
      return
    }

    if (imageFiles.length > 20) {
      setError("Máximo 20 fotos por sesión")
      return
    }

    setSelectedFiles(imageFiles)
    setError("")
  }

  const handleUpload = async () => {
    if (!sessionData.title || !sessionData.date || !sessionData.location || selectedFiles.length === 0) {
      setError("Por favor completa todos los campos y selecciona al menos una foto")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const newSession = {
        id: Date.now(),
        title: sessionData.title,
        date: sessionData.date,
        location: sessionData.location,
      }

      await driveDataManager.uploadPhotos(selectedFiles, newSession)

      setSuccess(`Sesión "${sessionData.title}" subida exitosamente con ${selectedFiles.length} fotos`)
      setSessionData({ title: "", date: "", location: "" })
      setSelectedFiles([])
      await loadData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error uploading photos:", error)
      setError(error.message || "Error al subir las fotos")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta foto?")) return

    try {
      await driveDataManager.deletePhoto(photoId)
      setSuccess("Foto eliminada exitosamente")
      await loadData()
      setSelectedPhoto(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error deleting photo:", error)
      setError(error.message || "Error al eliminar la foto")
    }
  }

  const getTotalPhotos = () => {
    return photoSessions.reduce((total, session) => total + session.photos.length, 0)
  }

  const getRecentSessions = () => {
    return photoSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando galería...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="Panta Rei Project" width={50} height={50} className="drop-shadow-lg" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Camera className="h-6 w-6 text-pink-500" />
                    Galería de Fotos
                  </h1>
                  <p className="text-slate-600 text-sm">Gestiona las fotos de la banda</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <UserMenu />
                <MobileNav />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total de Fotos</CardTitle>
                <ImageIcon className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{getTotalPhotos()}</div>
                <p className="text-xs text-slate-600">En {photoSessions.length} sesiones</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Sesiones</CardTitle>
                <Camera className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{photoSessions.length}</div>
                <p className="text-xs text-slate-600">Sesiones de fotos</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Última Sesión</CardTitle>
                <Calendar className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {photoSessions.length > 0
                    ? new Date(Math.max(...photoSessions.map((s) => new Date(s.date).getTime()))).toLocaleDateString()
                    : "N/A"}
                </div>
                <p className="text-xs text-slate-600">Fecha más reciente</p>
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Upload Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                Subir Nueva Sesión de Fotos
              </CardTitle>
              <CardDescription className="text-slate-600">
                Sube fotos de ensayos, conciertos o sesiones de la banda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-title" className="text-slate-700">
                    Título de la sesión
                  </Label>
                  <Input
                    id="session-title"
                    name="session-title"
                    type="text"
                    placeholder="Ej: Concierto en el Teatro"
                    value={sessionData.title}
                    onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-date" className="text-slate-700">
                    Fecha
                  </Label>
                  <Input
                    id="session-date"
                    name="session-date"
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-location" className="text-slate-700">
                    Ubicación
                  </Label>
                  <Input
                    id="session-location"
                    name="session-location"
                    type="text"
                    placeholder="Ej: Teatro Municipal"
                    value={sessionData.location}
                    onChange={(e) => setSessionData({ ...sessionData, location: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo-upload" className="text-slate-700">
                  Seleccionar fotos (máximo 20)
                </Label>
                <Input
                  id="photo-upload"
                  name="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="bg-slate-50 border-slate-200"
                />
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-slate-600">{selectedFiles.length} archivo(s) seleccionado(s)</p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Subiendo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Subir Sesión
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Photo Sessions */}
          {photoSessions.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardContent className="text-center py-12">
                <Camera className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay fotos aún</h3>
                <p className="text-slate-600 mb-4">Sube tu primera sesión de fotos para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {photoSessions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => (
                  <Card key={session.id} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Camera className="h-5 w-5 text-pink-500" />
                            {session.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {session.location}
                            </span>
                            <Badge variant="outline">{session.photos.length} fotos</Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {session.photos.map((photo) => (
                          <div key={photo.id} className="relative group cursor-pointer">
                            <div
                              className="aspect-square bg-slate-200 rounded-lg overflow-hidden"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <Image
                                src={driveDataManager.getThumbnailUrl(photo.driveFileId, 200) || "/placeholder.svg"}
                                alt={photo.title}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Photo Modal */}
          {selectedPhoto && (
            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{selectedPhoto.title}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPhoto(null)} className="h-6 w-6 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedPhoto.date).toLocaleDateString()}
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
                <div className="space-y-4">
                  <div className="relative">
                    <Image
                      src={driveDataManager.getThumbnailUrl(selectedPhoto.driveFileId, 800) || "/placeholder.svg"}
                      alt={selectedPhoto.title}
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPhoto.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(driveDataManager.getFileUrl(selectedPhoto.driveFileId), "_blank")}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    <Button
                      onClick={() => handleDeletePhoto(selectedPhoto.id)}
                      variant="destructive"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
