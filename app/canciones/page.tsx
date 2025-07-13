"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Music,
  Play,
  Pause,
  Upload,
  Video,
  Plus,
  Search,
  MessageCircle,
  History,
  ImageIcon,
  Download,
  User,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import DriveFileList from "./components/drive-file-list" // Importa el nuevo componente

interface Comment {
  id: number
  author: string
  content: string
  timestamp: string
}

interface Version {
  id: number
  version: string
  changes: string
  author: string
  date: string
  audioUrl?: string
}

interface Recording {
  id: number
  name: string
  url: string
  type: "acustica" | "electrica" | "demo" | "final"
  uploadDate: string
}

interface Song {
  id: number
  title: string
  status: "ready" | "practicing" | "developing"
  type: "original" | "cover"
  lyrics?: string
  chords?: string
  notes?: string
  lastUpdated: string
  comments: Comment[]
  versions: Version[]
  recordings: Recording[]
  coverImage?: string
}

export default function SongsManager() {
  const [songs, setSongs] = useState<Song[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [isPlaying, setIsPlaying] = useState<number | null>(null)
  const [newComment, setNewComment] = useState("")
  const [selectedSong, setSelectedSong] = useState<number | null>(null)

  const [newSong, setNewSong] = useState({
    title: "",
    status: "developing" as const,
    type: "original" as const,
    lyrics: "",
    chords: "",
    notes: "",
  })

  const filteredSongs = songs.filter((song) => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || song.status === filterStatus
    const matchesType = filterType === "all" || song.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500"
      case "practicing":
        return "bg-yellow-500"
      case "developing":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready":
        return "Lista"
      case "practicing":
        return "Ensayando"
      case "developing":
        return "Desarrollando"
      default:
        return status
    }
  }

  const getRecordingTypeColor = (type: string) => {
    switch (type) {
      case "acustica":
        return "bg-green-100 text-green-800"
      case "electrica":
        return "bg-blue-100 text-blue-800"
      case "demo":
        return "bg-yellow-100 text-yellow-800"
      case "final":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRecordingTypeText = (type: string) => {
    switch (type) {
      case "acustica":
        return "Acústica"
      case "electrica":
        return "Eléctrica"
      case "demo":
        return "Demo"
      case "final":
        return "Final"
      default:
        return type
    }
  }

  const handleAddSong = () => {
    const song: Song = {
      id: Date.now(),
      ...newSong,
      lastUpdated: new Date().toISOString().split("T")[0],
      comments: [],
      versions: [
        {
          id: 1,
          version: "v1.0",
          changes: "Versión inicial",
          author: "Usuario",
          date: new Date().toISOString().split("T")[0],
        },
      ],
      recordings: [],
    }
    setSongs([...songs, song])
    setNewSong({
      title: "",
      status: "developing",
      type: "original",
      lyrics: "",
      chords: "",
      notes: "",
    })
  }

  const handleAddComment = (songId: number) => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now(),
        author: "Emanuel", // o el usuario actual logueado
        content: newComment,
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      }

      setSongs(songs.map((song) => (song.id === songId ? { ...song, comments: [...song.comments, comment] } : song)))
      setNewComment("")
    }
  }

  const togglePlay = (songId: number) => {
    setIsPlaying(isPlaying === songId ? null : songId)
  }

  const generatePDF = (song: Song) => {
    // En una implementación real, esto generaría un PDF
    alert(`Generando PDF de "${song.title}"...`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
      <div className="container mx-auto p-6">
        {/* Header with Logo */}
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
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Gestor de Canciones</h1>
                <p className="text-slate-600">Organiza tu repertorio completo</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Canción
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Agregar Nueva Canción</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Completa la información de la nueva canción
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Título de la canción"
                  value={newSong.title}
                  onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newSong.status}
                    onValueChange={(value: any) => setNewSong({ ...newSong, status: value })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="developing">Desarrollando</SelectItem>
                      <SelectItem value="practicing">Ensayando</SelectItem>
                      <SelectItem value="ready">Lista</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newSong.type} onValueChange={(value: any) => setNewSong({ ...newSong, type: value })}>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="cover">Cover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Letra de la canción..."
                  value={newSong.lyrics}
                  onChange={(e) => setNewSong({ ...newSong, lyrics: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800 min-h-[100px]"
                />
                <Input
                  placeholder="Acordes (ej: Am - F - C - G)"
                  value={newSong.chords}
                  onChange={(e) => setNewSong({ ...newSong, chords: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <Textarea
                  placeholder="Notas adicionales..."
                  value={newSong.notes}
                  onChange={(e) => setNewSong({ ...newSong, notes: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <Button
                  onClick={handleAddSong}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                >
                  Agregar Canción
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar canciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-800"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ready">Listas</SelectItem>
                  <SelectItem value="practicing">Ensayando</SelectItem>
                  <SelectItem value="developing">Desarrollando</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[180px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="original">Originales</SelectItem>
                  <SelectItem value="cover">Covers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sección para listar archivos de Google Drive para Canciones */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Archivos de Canciones (Google Drive)</h2>
          <DriveFileList folderId="1NBD8s5KUFKRABIAPeZm8MsCuGkdCKDg_" title="Archivos de Canciones" />
        </div>

        {/* Songs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs.map((song) => (
            <Card key={song.id} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-800 text-lg">{song.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={`${getStatusColor(song.status)} text-white border-0`}>
                      {getStatusText(song.status)}
                    </Badge>
                    <Badge variant="outline" className="text-slate-600 border-slate-600">
                      {song.type === "original" ? "Original" : "Cover"}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-slate-500">
                  Actualizado: {song.lastUpdated} • {song.comments.length} comentarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 bg-slate-100">
                    <TabsTrigger value="info" className="text-xs">
                      Info
                    </TabsTrigger>
                    <TabsTrigger value="lyrics" className="text-xs">
                      Letra
                    </TabsTrigger>
                    <TabsTrigger value="media" className="text-xs">
                      Media
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {song.comments.length}
                    </TabsTrigger>
                    <TabsTrigger value="versions" className="text-xs">
                      <History className="h-3 w-3 mr-1" />
                      Versiones
                    </TabsTrigger>
                    <TabsTrigger value="visual" className="text-xs">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Visual
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-4">
                    <div className="space-y-3">
                      {song.notes && <p className="text-sm text-slate-600">{song.notes}</p>}
                      {song.chords && (
                        <div className="bg-slate-50 p-3 rounded">
                          <p className="text-xs font-medium text-slate-700 mb-1">Acordes:</p>
                          <p className="text-sm text-slate-600">{song.chords}</p>
                        </div>
                      )}
                      <Button
                        onClick={() => generatePDF(song)}
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-300 text-slate-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="lyrics" className="mt-4">
                    <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 max-h-32 overflow-y-auto">
                      {song.lyrics || "Sin letra agregada"}
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="mt-4">
                    <div className="space-y-3">
                      {/* Grabaciones con etiquetas */}
                      {song.recordings.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-2">Grabaciones:</p>
                          <div className="space-y-2">
                            {song.recordings.map((recording) => (
                              <div
                                key={recording.id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded"
                              >
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-slate-700">{recording.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs ${getRecordingTypeColor(recording.type)}`}>
                                      {getRecordingTypeText(recording.type)}
                                    </Badge>
                                    <span className="text-xs text-slate-500">{recording.uploadDate}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePlay(recording.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {isPlaying === recording.id ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-slate-300 text-slate-600 bg-transparent"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Audio
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-slate-300 text-slate-600 bg-transparent"
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Video
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="mt-4">
                    <div className="space-y-3">
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {song.comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-50 p-2 rounded text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3 text-slate-500" />
                              <span className="font-medium text-slate-700">{comment.author}</span>
                              <span className="text-xs text-slate-500">{comment.timestamp}</span>
                            </div>
                            <p className="text-slate-600">{comment.content}</p>
                          </div>
                        ))}
                        {song.comments.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-4">No hay comentarios aún</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Agregar comentario..."
                          value={selectedSong === song.id ? newComment : ""}
                          onChange={(e) => {
                            setNewComment(e.target.value)
                            setSelectedSong(song.id)
                          }}
                          className="flex-1 text-xs bg-slate-50 border-slate-200"
                        />
                        <Button
                          onClick={() => handleAddComment(song.id)}
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="versions" className="mt-4">
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {song.versions.map((version) => (
                        <div key={version.id} className="bg-slate-50 p-2 rounded text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-700">{version.version}</span>
                            <span className="text-xs text-slate-500">{version.date}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{version.changes}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">por {version.author}</span>
                            {version.audioUrl && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="visual" className="mt-4">
                    <div className="space-y-3">
                      {song.coverImage && (
                        <div className="text-center">
                          <img
                            src={song.coverImage || "/placeholder.svg"}
                            alt={`Portada de ${song.title}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="border-slate-300 text-slate-600 bg-transparent">
                          <ImageIcon className="h-4 w-4 mr-1" />
                          Portada
                        </Button>
                        <Button variant="outline" size="sm" className="border-slate-300 text-slate-600 bg-transparent">
                          <Upload className="h-4 w-4 mr-1" />
                          Flyer
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSongs.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <Music className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500">No se encontraron canciones con los filtros aplicados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
