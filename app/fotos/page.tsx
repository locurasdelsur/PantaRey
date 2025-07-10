"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, ImageIcon, Calendar, MapPin, Trash2, Download, Eye, Plus, X } from "lucide-react"
import Image from "next/image"

interface PhotoSession {
  id: string
  title: string
  date: string
  location: string
  photos: Photo[]
  createdAt: string
}

interface Photo {
  id: string
  url: string
  filename: string
  size: number
  uploadedAt: string
}

export default function PhotosPage() {
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [newSession, setNewSession] = useState({
    title: "",
    date: "",
    location: "",
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showNewSessionForm, setShowNewSessionForm] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem("photoSessions")
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions))
    }
  }, [])

  // Save sessions to localStorage
  const saveSessions = (updatedSessions: PhotoSession[]) => {
    setSessions(updatedSessions)
    localStorage.setItem("photoSessions", JSON.stringify(updatedSessions))
  }

  const handleCreateSession = () => {
    if (!newSession.title || !newSession.date || !newSession.location) {
      setError("Por favor completa todos los campos")
      return
    }

    const session: PhotoSession = {
      id: Date.now().toString(),
      title: newSession.title,
      date: newSession.date,
      location: newSession.location,
      photos: [],
      createdAt: new Date().toISOString(),
    }

    const updatedSessions = [session, ...sessions]
    saveSessions(updatedSessions)

    setNewSession({ title: "", date: "", location: "" })
    setShowNewSessionForm(false)
    setSelectedSession(session.id)
    setError("")
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      setError("Por favor selecciona archivos de imagen válidos")
      return
    }

    setSelectedFiles(imageFiles)
    setError("")
  }

  const handleUpload = async () => {
    if (!selectedSession || selectedFiles.length === 0) {
      setError("Selecciona una sesión y archivos para subir")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      // Simulate file upload
      const newPhotos: Photo[] = selectedFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }))

      const updatedSessions = sessions.map((session) =>
        session.id === selectedSession ? { ...session, photos: [...session.photos, ...newPhotos] } : session,
      )

      saveSessions(updatedSessions)
      setSelectedFiles([])

      // Clear file input
      const fileInput = document.getElementById("photo-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      setError("Error al subir las fotos")
    } finally {
      setIsUploading(false)
    }
  }

  const deletePhoto = (sessionId: string, photoId: string) => {
    const updatedSessions = sessions.map((session) =>
      session.id === sessionId
        ? { ...session, photos: session.photos.filter((photo) => photo.id !== photoId) }
        : session,
    )
    saveSessions(updatedSessions)
  }

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((session) => session.id !== sessionId)
    saveSessions(updatedSessions)
    if (selectedSession === sessionId) {
      setSelectedSession(null)
    }
  }

  const downloadPhoto = (photo: Photo) => {
    const link = document.createElement("a")
    link.href = photo.url
    link.download = photo.filename
    link.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">📸 Galería de Fotos</h1>
              <p className="text-slate-600">Organiza y gestiona las fotos de tus sesiones</p>
            </div>
          </div>

          <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mb-8"></div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50 mb-6">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sessions Panel */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Camera className="h-5 w-5 text-blue-500" />
                      Sesiones
                    </CardTitle>
                    <Button
                      onClick={() => setShowNewSessionForm(true)}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nueva
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* New Session Form */}
                  {showNewSessionForm && (
                    <Card className="mb-4 p-4 bg-blue-50 border-blue-200">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="session-title" className="text-sm font-medium">
                            Título de la sesión
                          </Label>
                          <Input
                            id="session-title"
                            name="session-title"
                            autoComplete="off"
                            value={newSession.title}
                            onChange={(e) => setNewSession((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Ej: Ensayo en estudio"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="session-date" className="text-sm font-medium">
                            Fecha
                          </Label>
                          <Input
                            id="session-date"
                            name="session-date"
                            type="date"
                            autoComplete="off"
                            value={newSession.date}
                            onChange={(e) => setNewSession((prev) => ({ ...prev, date: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="session-location" className="text-sm font-medium">
                            Ubicación
                          </Label>
                          <Input
                            id="session-location"
                            name="session-location"
                            autoComplete="off"
                            value={newSession.location}
                            onChange={(e) => setNewSession((prev) => ({ ...prev, location: e.target.value }))}
                            placeholder="Ej: Estudio Luna"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateSession}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white flex-1"
                          >
                            Crear
                          </Button>
                          <Button
                            onClick={() => setShowNewSessionForm(false)}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Sessions List */}
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedSession === session.id
                            ? "bg-amber-100 border-amber-300"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-slate-800 truncate">{session.title}</h3>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.date)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {session.photos.length} fotos
                        </Badge>
                      </div>
                    ))}

                    {sessions.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Camera className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>No hay sesiones creadas</p>
                        <p className="text-xs mt-2">Crea tu primera sesión para comenzar</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Photos Panel */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-500" />
                    {selectedSession
                      ? sessions.find((s) => s.id === selectedSession)?.title || "Fotos"
                      : "Selecciona una sesión"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSession ? (
                    <>
                      {/* Upload Section */}
                      <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-slate-700">Seleccionar fotos</span>
                            <Input
                              id="photo-upload"
                              name="photo-upload"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF hasta 10MB cada una</p>
                        </div>

                        {selectedFiles.length > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {selectedFiles.length} archivo(s) seleccionados
                              </span>
                              <Button
                                onClick={() => setSelectedFiles([])}
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {selectedFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-xs bg-white p-2 rounded"
                                >
                                  <span className="truncate">{file.name}</span>
                                  <span className="text-slate-500">{formatFileSize(file.size)}</span>
                                </div>
                              ))}
                            </div>
                            <Button
                              onClick={handleUpload}
                              disabled={isUploading}
                              className="w-full mt-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                            >
                              {isUploading ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Subiendo...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Upload className="h-4 w-4" />
                                  Subir Fotos
                                </div>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Photos Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sessions
                          .find((s) => s.id === selectedSession)
                          ?.photos.map((photo) => (
                            <div key={photo.id} className="group relative">
                              <div className="aspect-square bg-slate-200 rounded-lg overflow-hidden">
                                <Image
                                  src={photo.url || "/placeholder.svg"}
                                  alt={photo.filename}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => downloadPhoto(photo)}
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => deletePhoto(selectedSession, photo.id)}
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-slate-600 truncate">{photo.filename}</div>
                            </div>
                          ))}
                      </div>

                      {sessions.find((s) => s.id === selectedSession)?.photos.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                          <p>No hay fotos en esta sesión</p>
                          <p className="text-sm mt-2">Sube algunas fotos para comenzar</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Eye className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                      <p>Selecciona una sesión para ver las fotos</p>
                      <p className="text-sm mt-2">O crea una nueva sesión para comenzar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
