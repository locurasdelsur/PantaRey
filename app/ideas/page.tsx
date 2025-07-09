"use client"

import { useState, useEffect } from "react"
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
import {
  Lightbulb,
  Plus,
  Play,
  Pause,
  Upload,
  Mic,
  User,
  Tag,
  Trash2,
  Music,
  MessageCircle,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Idea {
  id: number
  title: string
  type: "riff" | "lyrics" | "melody" | "concept"
  category: "intro" | "verse" | "chorus" | "bridge" | "solo" | "outro" | "complete"
  author: string
  content?: string
  audioUrl?: string
  tags: string[]
  createdAt: string
  likes: number
  comments: Comment[]
}

interface Comment {
  id: number
  author: string
  content: string
  createdAt: string
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])

  // Cargar ideas al inicializar
  useEffect(() => {
    const savedIdeas = localStorage.getItem("bandIdeas")
    if (savedIdeas) {
      try {
        const parsedIdeas = JSON.parse(savedIdeas)
        setIdeas(parsedIdeas)
      } catch (error) {
        console.error("Error loading ideas:", error)
      }
    }
  }, [])

  // Guardar ideas automáticamente
  useEffect(() => {
    if (ideas.length > 0) {
      localStorage.setItem("bandIdeas", JSON.stringify(ideas))
    }
  }, [ideas])

  const [newIdea, setNewIdea] = useState({
    title: "",
    type: "riff" as const,
    category: "intro" as const,
    author: "",
    content: "",
    tags: [] as string[],
    audioUrl: "",
  })

  const [isPlaying, setIsPlaying] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const members = ["Cholo", "Fernando", "Emanuel"]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "riff":
        return "bg-blue-500"
      case "lyrics":
        return "bg-green-500"
      case "melody":
        return "bg-purple-500"
      case "concept":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "riff":
        return "Riff"
      case "lyrics":
        return "Letra"
      case "melody":
        return "Melodía"
      case "concept":
        return "Concepto"
      default:
        return type
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case "intro":
        return "Intro"
      case "verse":
        return "Verso"
      case "chorus":
        return "Estribillo"
      case "bridge":
        return "Puente"
      case "solo":
        return "Solo"
      case "outro":
        return "Outro"
      case "complete":
        return "Completo"
      default:
        return category
    }
  }

  const handleAddIdea = () => {
    const idea: Idea = {
      id: Date.now(),
      ...newIdea,
      createdAt: new Date().toISOString().split("T")[0],
      likes: 0,
      comments: [],
    }
    setIdeas([...ideas, idea])
    setNewIdea({
      title: "",
      type: "riff",
      category: "intro",
      author: "",
      content: "",
      tags: [],
      audioUrl: "",
    })
  }

  const togglePlay = (ideaId: number) => {
    setIsPlaying(isPlaying === ideaId ? null : ideaId)
  }

  const likeIdea = (ideaId: number) => {
    const updatedIdeas = ideas.map((idea) => (idea.id === ideaId ? { ...idea, likes: idea.likes + 1 } : idea))
    setIdeas(updatedIdeas)
    localStorage.setItem("bandIdeas", JSON.stringify(updatedIdeas))
  }

  const deleteIdea = (ideaId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta idea?")) {
      const updatedIdeas = ideas.filter((idea) => idea.id !== ideaId)
      setIdeas(updatedIdeas)
      // Actualizar localStorage inmediatamente
      if (updatedIdeas.length === 0) {
        localStorage.removeItem("bandIdeas")
      } else {
        localStorage.setItem("bandIdeas", JSON.stringify(updatedIdeas))
      }
    }
  }

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === "all" || idea.type === filterType
    const matchesCategory = filterCategory === "all" || idea.category === filterCategory
    return matchesSearch && matchesType && matchesCategory
  })

  const getIdeasStats = () => {
    const today = new Date().toISOString().split("T")[0]
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)

    return {
      total: ideas.length,
      riffs: ideas.filter((idea) => idea.type === "riff").length,
      lyrics: ideas.filter((idea) => idea.type === "lyrics").length,
      melodies: ideas.filter((idea) => idea.type === "melody").length,
      concepts: ideas.filter((idea) => idea.type === "concept").length,
      thisWeek: ideas.filter((idea) => new Date(idea.createdAt) >= thisWeek).length,
      withAudio: ideas.filter((idea) => idea.audioUrl).length,
      totalLikes: ideas.reduce((sum, idea) => sum + idea.likes, 0),
      mostLiked: ideas.reduce((max, idea) => (idea.likes > max ? idea.likes : max), 0),
    }
  }

  const ideasStats = getIdeasStats()

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
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Banco de Ideas</h1>
                <p className="text-slate-600">Riffs, letras y conceptos creativos de la banda</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-200 text-gray-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Idea</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Comparte tu riff, letra o concepto con la banda
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Título de la idea"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                  className="bg-gray-100 border-gray-300"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={newIdea.type} onValueChange={(value: any) => setNewIdea({ ...newIdea, type: value })}>
                    <SelectTrigger className="bg-gray-100 border-gray-300">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="riff">Riff</SelectItem>
                      <SelectItem value="lyrics">Letra</SelectItem>
                      <SelectItem value="melody">Melodía</SelectItem>
                      <SelectItem value="concept">Concepto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newIdea.category}
                    onValueChange={(value: any) => setNewIdea({ ...newIdea, category: value })}
                  >
                    <SelectTrigger className="bg-gray-100 border-gray-300">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="intro">Intro</SelectItem>
                      <SelectItem value="verse">Verso</SelectItem>
                      <SelectItem value="chorus">Estribillo</SelectItem>
                      <SelectItem value="bridge">Puente</SelectItem>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="complete">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={newIdea.author} onValueChange={(value) => setNewIdea({ ...newIdea, author: value })}>
                  <SelectTrigger className="bg-gray-100 border-gray-300">
                    <SelectValue placeholder="Autor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    {members.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Describe tu idea..."
                  value={newIdea.content}
                  onChange={(e) => setNewIdea({ ...newIdea, content: e.target.value })}
                  className="bg-gray-100 border-gray-300 min-h-[100px]"
                />
                <Input
                  placeholder="Tags (separados por coma)"
                  onChange={(e) => setNewIdea({ ...newIdea, tags: e.target.value.split(",").map((tag) => tag.trim()) })}
                  className="bg-gray-100 border-gray-300"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-500 bg-transparent hover:bg-gray-100"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Audio
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-500 bg-transparent hover:bg-gray-100"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Grabar
                  </Button>
                </div>
                <Button
                  onClick={handleAddIdea}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  Agregar Idea
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-gray-200 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar ideas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-100 border-gray-300 text-gray-700"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[180px] bg-gray-100 border-gray-300">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="riff">Riffs</SelectItem>
                  <SelectItem value="lyrics">Letras</SelectItem>
                  <SelectItem value="melody">Melodías</SelectItem>
                  <SelectItem value="concept">Conceptos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[180px] bg-gray-100 border-gray-300">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="intro">Intro</SelectItem>
                  <SelectItem value="verse">Verso</SelectItem>
                  <SelectItem value="chorus">Estribillo</SelectItem>
                  <SelectItem value="bridge">Puente</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                  <SelectItem value="complete">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ideas Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Ideas</p>
                  <p className="text-2xl font-bold text-gray-800">{ideasStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Music className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Riffs</p>
                  <p className="text-2xl font-bold text-gray-800">{ideasStats.riffs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Esta Semana</p>
                  <p className="text-2xl font-bold text-gray-800">{ideasStats.thisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-800">{ideasStats.totalLikes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <Card key={idea.id} className="bg-white border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-800 text-lg">{idea.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={`${getTypeColor(idea.type)} text-white border-0`}>{getTypeText(idea.type)}</Badge>
                    <Badge variant="outline" className="text-gray-500 border-gray-300">
                      {getCategoryText(idea.category)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteIdea(idea.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {idea.author} • {new Date(idea.createdAt).toLocaleDateString("es-ES")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {idea.content && <div className="bg-gray-100 p-3 rounded text-sm text-gray-600">{idea.content}</div>}

                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-gray-500 border-gray-300">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {idea.audioUrl && (
                    <Button
                      variant="outline"
                      onClick={() => togglePlay(idea.id)}
                      className="w-full border-gray-300 text-gray-500 hover:bg-gray-100"
                    >
                      {isPlaying === idea.id ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isPlaying === idea.id ? "Pausar" : "Reproducir"}
                    </Button>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likeIdea(idea.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ❤️ {idea.likes}
                    </Button>
                    <span className="text-sm text-gray-500">{idea.comments.length} comentarios</span>
                  </div>

                  {idea.comments.length > 0 && (
                    <div className="space-y-2 border-t border-gray-200 pt-3">
                      {idea.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-700">{comment.author}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                          <p className="text-gray-600">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron ideas con los filtros aplicados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
