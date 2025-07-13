"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Plus, Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])

  const [selectedMonth, setSelectedMonth] = useState("2025-01")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

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

          <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Subir Fotos
          </Button>
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
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                          <p className="text-sm font-medium">{photo.title}</p>
                          <p className="text-xs">por {photo.photographer}</p>
                        </div>
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
