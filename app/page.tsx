"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  Music,
  Camera,
  CheckSquare,
  Lightbulb,
  MapPin,
  Navigation,
  Zap,
  Settings,
  Bell,
  TrendingUp,
  Clock,
  Globe,
  BarChart3,
} from "lucide-react"
import { driveStorage } from "@/lib/google-drive-storage"

interface DashboardStats {
  totalEvents: number
  totalSongs: number
  totalPhotos: number
  totalTasks: number
  totalIdeas: number
  totalVenues: number
  completedTasks: number
  upcomingEvents: number
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalSongs: 0,
    totalPhotos: 0,
    totalTasks: 0,
    totalIdeas: 0,
    totalVenues: 0,
    completedTasks: 0,
    upcomingEvents: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [gisEnabled, setGisEnabled] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // Load all data in parallel
      const [events, songs, photos, tasks, ideas, venues] = await Promise.all([
        driveStorage.loadData("events.json").catch(() => []),
        driveStorage.loadData("songs.json").catch(() => []),
        driveStorage.loadData("photo-sessions.json").catch(() => []),
        driveStorage.loadData("tasks.json").catch(() => []),
        driveStorage.loadData("ideas.json").catch(() => []),
        driveStorage.loadData("venues.json").catch(() => []),
      ])

      // Calculate stats
      const now = new Date()
      const upcomingEvents = events?.filter((event: any) => new Date(event.date) > now).length || 0
      const completedTasks = tasks?.filter((task: any) => task.completed).length || 0
      const totalPhotos = photos?.reduce((sum: number, session: any) => sum + (session.photos?.length || 0), 0) || 0

      setStats({
        totalEvents: events?.length || 0,
        totalSongs: songs?.length || 0,
        totalPhotos,
        totalTasks: tasks?.length || 0,
        totalIdeas: ideas?.length || 0,
        totalVenues: venues?.length || 0,
        completedTasks,
        upcomingEvents,
      })

      // Generate recent activity
      const activity = []
      if (events?.length > 0) {
        activity.push({
          type: "event",
          title: "Próximo evento",
          description: events[0].title,
          time: "2 días",
          icon: Calendar,
        })
      }
      if (tasks?.length > 0) {
        const pendingTasks = tasks.filter((task: any) => !task.completed)
        if (pendingTasks.length > 0) {
          activity.push({
            type: "task",
            title: "Tareas pendientes",
            description: `${pendingTasks.length} tareas por completar`,
            time: "Hoy",
            icon: CheckSquare,
          })
        }
      }
      if (venues?.length > 0) {
        activity.push({
          type: "gis",
          title: "Sistema GIS activo",
          description: `${venues.length} venues registrados`,
          time: "Actualizado",
          icon: MapPin,
        })
      }

      setRecentActivity(activity)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  const getTaskCompletionPercentage = () => {
    if (stats.totalTasks === 0) return 0
    return Math.round((stats.completedTasks / stats.totalTasks) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Panta Rei Project" width={80} height={80} className="drop-shadow-lg" />
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
                {getGreeting()}
                {currentUser ? `, ${currentUser.name}` : ""}
              </h1>
              <p className="text-slate-600 text-lg">Bienvenido al centro de control de Panta Rei Project</p>
              <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mt-2"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Eventos</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalEvents}</p>
                  <p className="text-xs text-blue-600">{stats.upcomingEvents} próximos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Music className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Canciones</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalSongs}</p>
                  <p className="text-xs text-purple-600">En repertorio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Tareas</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {stats.completedTasks}/{stats.totalTasks}
                  </p>
                  <p className="text-xs text-green-600">{getTaskCompletionPercentage()}% completado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Camera className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Fotos</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalPhotos}</p>
                  <p className="text-xs text-amber-600">En galería</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GIS Section - Destacado */}
        {gisEnabled && (
          <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white mb-8 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                Sistema GIS Integrado
                <Badge className="bg-white/20 text-white border-white/30">Nuevo</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    <span className="font-medium">Venues Registrados</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalVenues}</p>
                  <p className="text-sm opacity-90">Estudios, salas y venues mapeados</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span className="font-medium">Cobertura Geográfica</span>
                  </div>
                  <p className="text-2xl font-bold">Activa</p>
                  <p className="text-sm opacity-90">Mapas interactivos disponibles</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium">Análisis Espacial</span>
                  </div>
                  <p className="text-2xl font-bold">Disponible</p>
                  <p className="text-sm opacity-90">Distancias y rutas optimizadas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <Link href="/gis">
                  <Button className="bg-white text-emerald-600 hover:bg-white/90">
                    <MapPin className="h-4 w-4 mr-2" />
                    Abrir Sistema GIS
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <Zap className="h-4 w-4" />
                  <span>Funcionalidades geoespaciales completas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link href="/calendario">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 w-full hover:bg-blue-50 hover:border-blue-200 bg-transparent"
                    >
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <span className="text-sm">Calendario</span>
                    </Button>
                  </Link>
                  <Link href="/canciones">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 w-full hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                    >
                      <Music className="h-6 w-6 text-purple-600" />
                      <span className="text-sm">Canciones</span>
                    </Button>
                  </Link>
                  <Link href="/fotos">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 w-full hover:bg-amber-50 hover:border-amber-200 bg-transparent"
                    >
                      <Camera className="h-6 w-6 text-amber-600" />
                      <span className="text-sm">Fotos</span>
                    </Button>
                  </Link>
                  <Link href="/tareas">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 w-full hover:bg-green-50 hover:border-green-200 bg-transparent"
                    >
                      <CheckSquare className="h-6 w-6 text-green-600" />
                      <span className="text-sm">Tareas</span>
                    </Button>
                  </Link>
                  <Link href="/ideas">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 w-full hover:bg-yellow-50 hover:border-yellow-200 bg-transparent"
                    >
                      <Lightbulb className="h-6 w-6 text-yellow-600" />
                      <span className="text-sm">Ideas</span>
                    </Button>
                  </Link>
                  <Link href="/gis">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 w-full hover:bg-emerald-50 hover:border-emerald-200 bg-transparent"
                    >
                      <MapPin className="h-6 w-6 text-emerald-600" />
                      <span className="text-sm">GIS</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <activity.icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{activity.title}</p>
                          <p className="text-sm text-slate-600">{activity.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No hay actividad reciente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            {currentUser && (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Mi Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{currentUser.name}</p>
                      <p className="text-sm text-slate-600">{currentUser.role}</p>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumen Rápido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Ideas creativas</span>
                    <Badge variant="secondary">{stats.totalIdeas}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Venues GIS</span>
                    <Badge variant="secondary">{stats.totalVenues}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Progreso tareas</span>
                    <Badge variant="secondary">{getTaskCompletionPercentage()}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Próximos eventos</span>
                    <Badge variant="secondary">{stats.upcomingEvents}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Lightbulb className="h-5 w-5" />
                  Tip del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  💡 Usa el nuevo sistema GIS para encontrar venues cercanos y optimizar las rutas entre estudios y
                  salas de ensayo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
