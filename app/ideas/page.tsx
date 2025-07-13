"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"
import { Plus, Upload, Mic, Pause, Play, Lightbulb, Tag, User } from "lucide-react"

interface Idea {
  id: number
  title: string
  type: string
  category: string
  author: string
  content: string
  tags: string[]
  audioUrl: string
  createdAt: string
  likes: number
  comments: { id: number; author: string; content: string; createdAt: string }[]
}

const IdeasPage = () => {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [newIdea, setNewIdea] = useState({
    title: "",
    type: "riff",
    category: "intro",
    author: "",
    content: "",
    tags: [],
    audioUrl: "",
  })
  const [isPlaying, setIsPlaying] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const members = ["Member1", "Member2", "Member3"] // Example members array

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "riff":
        return "bg-blue-500"
      case "lyrics":
        return "bg-green-500"
      case "melody":
        return "bg-yellow-500"
      case "concept":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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
    setIdeas(ideas.map((idea) => (idea.id === ideaId ? { ...idea, likes: idea.likes + 1 } : idea)))
  }

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      idea.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === "all" || idea.type === filterType
    const matchesCategory = filterCategory === "all" || idea.category === filterCategory
    return matchesSearch && matchesType && matchesCategory
  })

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
                  <Select value={newIdea.type} onValueChange={(value) => setNewIdea({ ...newIdea, type: value })}>
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
                    onValueChange={(value) => setNewIdea({ ...newIdea, category: value })}
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
                  onChange={(e) =>
                    setNewIdea({
                      ...newIdea,
                      tags: e.target.value.split(",").map((tag) => tag.trim()),
                    })
                  }
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

export default IdeasPage
