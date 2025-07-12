"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, ImageIcon, Trash2, Download, Eye, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { driveStorage } from "@/lib/google-drive-storage"

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
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Initialize Google Drive if needed
      if (!driveStorage.isConnected()) {
        await driveStorage.initialize()
      }

      // Load photos from Google Drive
      const photosData = await driveStorage.loadData("photos.json")
      if (photosData && Array.isArray(photosData)) {
        setPhotos(photosData)
      }
    } catch (err: any) {
      console.error("Error loading photos:", err)
      setError(`Error cargando fotos: ${err.message || "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB max

      if (!isImage) {
        setError("Solo se permiten archivos de imagen")
        return false
      }

      if (!isValidSize) {
        setError("El archivo es demasiado grande (máximo 10MB)")
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      uploadPhotos(validFiles)
    }
  }

  const uploadPhotos = async (files: File[]) => {
    try {
      setUploading(true)
      setError(null)

      // Ensure Google Drive is connected
      if (!driveStorage.isConnected()) {
        await driveStorage.initialize()
      }

      const folderIds = driveStorage.getFolderIds()
      const photosFolder = folderIds.photos || folderIds.main

      const uploadPromises = files.map(async (file) => {
        const fileName = `${Date.now()}_${file.name}`
        const fileId = await driveStorage.uploadFile(file, fileName, photosFolder)

        const photo: Photo = {
          id: fileId,
          name: file.name,
          url: driveStorage.getFileUrl(fileId),
          thumbnailUrl: driveStorage.getThumbnailUrl(fileId),
          uploadDate: new Date().toISOString(),
          size: file.size,
          type: file.type,
        }

        return photo
      })

      const uploadedPhotos = await Promise.all(uploadPromises)
      const updatedPhotos = [...photos, ...uploadedPhotos]

      // Save updated photos list
      await driveStorage.saveData("photos.json", updatedPhotos)
      setPhotos(updatedPhotos)

      setSuccess(`${uploadedPhotos.length} foto(s) subida(s) exitosamente`)

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err: any) {
      console.error("Error uploading photos:", err)
      setError(`Error subiendo fotos: ${err.message || "Error desconocido"}`)
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (photoId: string) => {
    try {
      setError(null)

      // Delete from Google Drive
      await driveStorage.deleteFile(photoId)

      // Update local state
      const updatedPhotos = photos.filter((photo) => photo.id !== photoId)
      setPhotos(updatedPhotos)

      // Save updated photos list
      await driveStorage.saveData("photos.json", updatedPhotos)

      setSuccess("Foto eliminada exitosamente")
      setSelectedPhoto(null)
    } catch (err: any) {
      console.error("Error deleting photo:", err)
      setError(`Error eliminando foto: ${err.message || "Error desconocido"}`)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Galería de Fotos</h1>
          <p className="text-muted-foreground">Gestiona las fotos de la banda</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {photos.length} foto{photos.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Arrastra fotos aquí o{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  selecciona archivos
                </Button>
              </p>
              <p className="text-sm text-muted-foreground">Formatos soportados: JPG, PNG, GIF, WebP (máximo 10MB)</p>
            </div>

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={uploading}
            />

            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Subiendo fotos...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando fotos...</span>
        </div>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No hay fotos aún</p>
            <p className="text-sm text-muted-foreground">Sube algunas fotos para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={photo.thumbnailUrl || "/placeholder.svg"}
                  alt={photo.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{photo.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt={photo.name}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Tamaño:</span> {formatFileSize(photo.size)}
                            </div>
                            <div>
                              <span className="font-medium">Tipo:</span> {photo.type}
                            </div>
                            <div>
                              <span className="font-medium">Subida:</span> {formatDate(photo.uploadDate)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild variant="outline">
                              <a href={photo.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </a>
                            </Button>
                            <Button variant="destructive" onClick={() => deletePhoto(photo.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => deletePhoto(photo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate" title={photo.name}>
                  {photo.name}
                </p>
                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                  <span>{formatFileSize(photo.size)}</span>
                  <span>{formatDate(photo.uploadDate)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
