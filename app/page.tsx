"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Music,
  Calendar,
  MessageCircle,
  Lightbulb,
  Camera,
  CheckSquare,
  Users,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { MobileNav } from "@/components/mobile-nav"

interface Song {
  id: number
  title: string
  status: "ready" | "practicing" | "developing"
  type: "original" | "cover"
  lastUpdated: string
}

interface Task {
  id: number
  title: string
  status: "todo" | "doing" | "done"
  priority: "low" | "medium" | "high"
  createdAt: string
}

interface Event {
  id: number
  title: string
  type: "rehearsal" | "gig" | "recording" | "meeting"
  date: string
  time: string
}

interface Message {
  id: number
  author: string
  content: string
  timestamp: string
  channel: string
}

interface Idea {
  id: number
  title: string
  type: "riff" | "lyrics" | "melody" | "concept"
  author: string
  createdAt: string
  likes: number
}

interface PhotoSession {
  id: number
  date: string
  title: string
  photos: any[]
}

export default function Dashboard() {
  const [songs, setSongs] = useState<Song[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Cargar datos globales compartidos
  useEffect(() => {
    // Cargar usuario actual
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }

    // Cargar datos globales (compartidos entre todos los usuarios)
    const loadGlobalData = () => {
      try {
        const savedSongs = localStorage.getItem("globalBandSongs")
        if (savedSongs) setSongs(JSON.parse(savedSongs))

        const savedTasks = localStorage.getItem("globalBandTasks")
        if (savedTasks) setTasks(JSON.parse(savedTasks))

        const savedEvents = localStorage.getItem("globalBandEvents")
        if (savedEvents) setEvents(JSON.parse(savedEvents))

        const savedMessages = localStorage.getItem("globalBandMessages")
        if (savedMessages) setMessages(JSON.parse(savedMessages))

        const savedIdeas = localStorage.getItem("globalBandIdeas")
        if (savedIdeas) setIdeas(JSON.parse(savedIdeas))

        const savedPhotoSessions = localStorage.getItem("globalBandPhotoSessions")
        if (savedPhotoSessions) setPhotoSessions(JSON.parse(savedPhotoSessions))
      } catch (error) {
        console.error("Error loading global data:", error)
      }
    }

    loadGlobalData()

    // Actualizar datos cada 5 segundos para simular sincronización en tiempo real
    const interval = setInterval(loadGlobalData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Calcular estadísticas reales
  const getStats = () => {
    const today = new Date().toISOString().split("T")[0]
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)

    const readySongs = songs.filter((song) => song.status === "ready")
    const practicingSongs = songs.filter((song) => song.status === "practicing")
    const developingSongs = songs.filter((song) => song.status === "developing")

    const upcomingEvents = events.filter((event) => new Date(event.date) >= new Date())
    const todayEvents = events.filter((event) => event.date === today)

    const completedTasks = tasks.filter((task) => task.status === "done")
    const pendingTasks = tasks.filter((task) => task.status !== "done")

    const totalPhotos = photoSessions.reduce((sum, session) => sum + session.photos.length, 0)

    const recentActivity = [
      ...songs
        .filter((song) => new Date(song.lastUpdated) >= thisWeek)
        .map((song) => ({
          type: "song",
          title: `Canción "${song.title}" actualizada`,
          time: song.lastUpdated,
          status: song.status,
        })),
      ...tasks
        .filter((task) => task.status === "done" && new Date(task.createdAt) >= thisWeek)
        .map((task) => ({
          type: "task",
          title: `Tarea "${task.title}" completada`,
          time: task.createdAt,
          status: "completed",
        })),
      ...ideas
        .filter((idea) => new Date(idea.createdAt) >= thisWeek)
        .map((idea) => ({
          type: "idea",
          title: `Nueva idea: "${idea.title}"`,
          time: idea.createdAt,
          author: idea.author,
        })),
      ...photoSessions
        .filter((session) => new Date(session.date) >= thisWeek)
        .map((session) => ({
          type: "photos",
          title: `Sesión de fotos: "${session.title}"`,
          time: session.date,
          count: session.photos.length,
        })),
      ...messages
        .filter((msg) => new Date(msg.timestamp) >= thisWeek)
        .slice(-5)
        .map((msg) => ({
          type: "message",
          title: `${msg.author}: ${msg.content.substring(0, 50)}...`,
          time: msg.timestamp,
          channel: msg.channel,
        })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8)

    return {
      songs: {
        total: songs.length,
        ready: readySongs.length,
        practicing: practicingSongs.length,
        developing: developingSongs.length,
        readyPercentage: songs.length > 0 ? Math.round((readySongs.length / songs.length) * 100) : 0,
        practicingPercentage: songs.length > 0 ? Math.round((practicingSongs.length / songs.length) * 100) : 0,
        developingPercentage: songs.length > 0 ? Math.round((developingSongs.length / songs.length) * 100) : 0,
      },
      events: {
        total: events.length,
        upcoming: upcomingEvents.length,
        today: todayEvents.length,
        thisWeek: upcomingEvents.filter((event) => {
          const eventDate = new Date(event.date)
          const weekFromNow = new Date()
          weekFromNow.setDate(weekFromNow.getDate() + 7)
          return eventDate <= weekFromNow
        }).length,
      },
      tasks: {
        total: tasks.length,
        completed: completedTasks.length,
        pending: pendingTasks.length,
        completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      },
      communication: {
        totalMessages: messages.length,
        todayMessages: messages.filter((msg) => {
          const msgDate = new Date(msg.timestamp).toDateString()
          const today = new Date().toDateString()
          return msgDate === today
        }).length,
        activeChannels: [...new Set(messages.map((msg) => msg.channel))].length,
      },
      ideas: {
        total: ideas.length,
        thisWeek: ideas.filter((idea) => new Date(idea.createdAt) >= thisWeek).length,
        totalLikes: ideas.reduce((sum, idea) => sum + idea.likes, 0),
      },
      photos: {
        totalSessions: photoSessions.length,
        totalPhotos: totalPhotos,
        thisMonth: photoSessions.filter((session) => {
          const sessionMonth = session.date.slice(0, 7)
          const currentMonth = new Date().toISOString().slice(0, 7)
          return sessionMonth === currentMonth
        }).length,
      },
      recentActivity,
    }
  }

  const stats = getStats()

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Hace menos de 1 hora"
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours !== 1 ? "s" : ""}`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays !== 1 ? "s" : ""}`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `Hace ${diffInWeeks} semana${diffInWeeks !== 1 ? "s" : ""}`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "song":
        return <Music className="h-4 w-4 text-blue-500" />
      case "task":
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case "idea":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case "photos":
        return <Camera className="h-4 w-4 text-purple-500" />
      case "message":
        return <MessageCircle className="h-4 w-4 text-indigo-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
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
                  <h1 className="text-2xl font-bold text-slate-800">Panta Rei Project</h1>
                  <p className="text-slate-600 text-sm">Dashboard de la Banda</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">3 miembros activos</span>
                </div>
                <UserMenu />
                <MobileNav />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-6">
          {/* Welcome Section */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                <Music className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Hola, {currentUser?.name || "Músico"}! 👋</h2>
                <p className="text-slate-600">
                  Bienvenido al centro de control de Panta Rei Project. Aquí tienes un resumen de toda la actividad.
                </p>
              </div>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Repertorio */}
            <Link href="/canciones">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Repertorio</CardTitle>
                  <Music className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{stats.songs.total}</div>
                  <p className="text-xs text-slate-600">
                    {stats.songs.ready} listas • {stats.songs.practicing} ensayando
                  </p>
                  <div className="flex gap-1 mt-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-1">
                      <div
                        className="bg-green-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${stats.songs.readyPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Calendario */}
            <Link href="/calendario">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Próximos Eventos</CardTitle>
                  <Calendar className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{stats.events.upcoming}</div>
                  <p className="text-xs text-slate-600">
                    {stats.events.today > 0 ? `${stats.events.today} hoy` : "Ninguno hoy"} • {stats.events.thisWeek}{" "}
                    esta semana
                  </p>
                  {stats.events.today > 0 && (
                    <Badge className="mt-2 bg-green-500 text-white text-xs">¡Evento hoy!</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Tareas */}
            <Link href="/tareas">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Tareas</CardTitle>
                  <CheckSquare className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{stats.tasks.pending}</div>
                  <p className="text-xs text-slate-600">
                    {stats.tasks.completed} completadas • {stats.tasks.completionRate}% progreso
                  </p>
                  <div className="flex gap-1 mt-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-1">
                      <div
                        className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${stats.tasks.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Comunicación */}
            <Link href="/chat">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Comunicación</CardTitle>
                  <MessageCircle className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{stats.communication.totalMessages}</div>
                  <p className="text-xs text-slate-600">
                    {stats.communication.todayMessages} hoy • {stats.communication.activeChannels} canales
                  </p>
                  {stats.communication.todayMessages > 0 && (
                    <Badge className="mt-2 bg-indigo-500 text-white text-xs">Actividad hoy</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Ideas */}
            <Link href="/ideas">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Banco de Ideas</CardTitle>
                  <Lightbulb className="h-4 w-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{stats.ideas.total}</div>
                  <p className="text-xs text-slate-600">
                    {stats.ideas.thisWeek} esta semana • {stats.ideas.totalLikes} likes totales
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Fotos */}
            <Link href="/fotos">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Galería</CardTitle>
                  <Camera className="h-4 w-4 text-pink-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 mb-1">{stats.photos.totalPhotos}</div>
                  <p className="text-xs text-slate-600">
                    {stats.photos.totalSessions} sesiones • {stats.photos.thisMonth} este mes
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Progreso General */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Progreso General</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {Math.round((stats.songs.readyPercentage + stats.tasks.completionRate) / 2)}%
                </div>
                <p className="text-xs text-slate-600">Promedio de completitud</p>
                <div className="flex gap-1 mt-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-1">
                    <div
                      className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((stats.songs.readyPercentage + stats.tasks.completionRate) / 2)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription className="text-slate-600">Últimas actualizaciones de toda la banda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-500">{getTimeAgo(activity.time)}</p>
                            {activity.author && (
                              <Badge variant="outline" className="text-xs">
                                {activity.author}
                              </Badge>
                            )}
                            {activity.status && (
                              <Badge
                                className={`text-xs ${
                                  activity.status === "ready"
                                    ? "bg-green-100 text-green-800"
                                    : activity.status === "practicing"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : activity.status === "completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {activity.status === "ready"
                                  ? "Lista"
                                  : activity.status === "practicing"
                                    ? "Ensayando"
                                    : activity.status === "completed"
                                      ? "Completada"
                                      : activity.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No hay actividad reciente</p>
                      <p className="text-xs text-slate-400 mt-1">¡Empieza creando contenido!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Star className="h-5 w-5 text-slate-600" />
                  Acciones Rápidas
                </CardTitle>
                <CardDescription className="text-slate-600">Accesos directos a funciones principales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/canciones">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                      <Music className="h-4 w-4 mr-2" />
                      Nueva Canción
                    </Button>
                  </Link>
                  <Link href="/calendario">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                      <Calendar className="h-4 w-4 mr-2" />
                      Nuevo Evento
                    </Button>
                  </Link>
                  <Link href="/ideas">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Nueva Idea
                    </Button>
                  </Link>
                  <Link href="/fotos">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                      <Camera className="h-4 w-4 mr-2" />
                      Subir Fotos
                    </Button>
                  </Link>
                  <Link href="/tareas">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Nueva Tarea
                    </Button>
                  </Link>
                  <Link href="/chat">
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Ir al Chat
                    </Button>
                  </Link>
                </div>

                {/* Próximos eventos destacados */}
                {stats.events.today > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">¡Eventos de hoy!</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Tienes {stats.events.today} evento{stats.events.today !== 1 ? "s" : ""} programado
                      {stats.events.today !== 1 ? "s" : ""} para hoy.
                    </p>
                    <Link href="/calendario">
                      <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700 text-white">
                        Ver Calendario
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
