"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/user-menu"
import { AuthGuard } from "@/components/auth-guard"
import { DriveConnectionGuard } from "@/components/drive-connection-guard"
import Link from "next/link"
import Image from "next/image"
import {
  Music2,
  Calendar,
  CheckSquare,
  Camera,
  MessageCircle,
  Lightbulb,
  Users,
  Clock,
  MapPin,
  Navigation,
  Globe,
  Zap,
  TrendingUp,
} from "lucide-react"

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    songs: 0,
    events: 0,
    tasks: 0,
    photos: 0,
    ideas: 0,
    venues: 0,
    gisPoints: 0,
  })

  useEffect(() => {
    // Cargar usuario actual
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }

    // Cargar estadísticas
    loadStats()
  }, [])

  const loadStats = () => {
    const songsData = localStorage.getItem("bandSongs")
    const eventsData = localStorage.getItem("bandEvents")
    const tasksData = localStorage.getItem("bandTasks")
    const photosData = localStorage.getItem("bandPhotos")
    const ideasData = localStorage.getItem("bandIdeas")
    const venuesData = localStorage.getItem("bandVenues")

    setStats({
      songs: songsData ? JSON.parse(songsData).length : 0,
      events: eventsData ? JSON.parse(eventsData).length : 0,
      tasks: tasksData ? JSON.parse(tasksData).length : 0,
      photos: photosData ? JSON.parse(photosData).length : 0,
      ideas: ideasData ? JSON.parse(ideasData).length : 0,
      venues: venuesData ? JSON.parse(venuesData).length : 0,
      gisPoints:
        (venuesData ? JSON.parse(venuesData).length : 0) +
        (eventsData ? JSON.parse(eventsData).filter((e: any) => e.geoLocation).length : 0),
    })
  }

  const menuItems = [
    {
      title: "Canciones",
      description: "Gestiona repertorio y grabaciones",
      href: "/canciones",
      icon: Music2,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      stats: `${stats.songs} canciones`,
    },
    {
      title: "Calendario",
      description: "Ensayos, shows y eventos",
      href: "/calendario",
      icon: Calendar,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      stats: `${stats.events} eventos`,
    },
    {
      title: "Tareas",
      description: "Organiza el trabajo de la banda",
      href: "/tareas",
      icon: CheckSquare,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      stats: `${stats.tasks} tareas`,
    },
    {
      title: "Fotos",
      description: "Galería compartida en Drive",
      href: "/fotos",
      icon: Camera,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      stats: `${stats.photos} fotos`,
    },
    {
      title: "Ideas",
      description: "Captura inspiración musical",
      href: "/ideas",
      icon: Lightbulb,
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      stats: `${stats.ideas} ideas`,
    },
    {
      title: "Chat",
      description: "Comunicación de la banda",
      href: "/chat",
      icon: MessageCircle,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      stats: "Mensajes en tiempo real",
    },
    {
      title: "Sistema GIS",
      description: "Mapas y geolocalización",
      href: "/gis",
      icon: MapPin,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      stats: `${stats.venues} venues, ${stats.gisPoints} puntos`,
      isNew: true,
    },
  ]

  const quickActions = [
    { title: "Nueva Canción", href: "/canciones", icon: Music2, color: "text-blue-600" },
    { title: "Programar Ensayo", href: "/calendario", icon: Calendar, color: "text-green-600" },
    { title: "Subir Fotos", href: "/fotos", icon: Camera, color: "text-purple-600" },
    { title: "Ver Mapa", href: "/gis", icon: Navigation, color: "text-emerald-600" },
  ]

  const recentActivity = [
    { action: "Nueva canción agregada", item: "Sueños de Libertad", time: "hace 2 horas", type: "song" },
    { action: "Ensayo programado", item: "Studio Central", time: "hace 4 horas", type: "event" },
    { action: "Fotos subidas", item: "Sesión en vivo", time: "hace 1 día", type: "photo" },
    { action: "Venue agregado", item: "Club de Jazz Downtown", time: "hace 2 días", type: "venue" },
  ]

  return (
    <AuthGuard>
      <DriveConnectionGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image src="/logo.png" alt="Panta Rei Project" width={50} height={50} className="drop-shadow-lg" />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panta Rei Project</h1>
                    <p className="text-sm text-slate-600">Dashboard Musical con GIS</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    <Globe className="h-3 w-3 mr-1" />
                    GIS Activo
                  </Badge>
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
                <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
                <h2 className="text-3xl font-bold text-slate-800">¡Hola, {currentUser?.name || "Músico"}! 👋</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
              </div>
              <p className="text-slate-600 text-lg mb-6">
                Gestiona tu banda con herramientas integradas y capacidades de mapeo geoespacial
              </p>

              {/* Quick Stats con GIS */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Music2 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-800">{stats.songs}</p>
                    <p className="text-xs text-slate-600">Canciones</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-800">{stats.events}</p>
                    <p className="text-xs text-slate-600">Eventos</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <CheckSquare className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-800">{stats.tasks}</p>
                    <p className="text-xs text-slate-600">Tareas</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Camera className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-800">{stats.photos}</p>
                    <p className="text-xs text-slate-600">Fotos</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Lightbulb className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-800">{stats.ideas}</p>
                    <p className="text-xs text-slate-600">Ideas</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <MapPin className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-800">{stats.venues}</p>
                    <p className="text-xs text-slate-600">Venues</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Globe className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-800">{stats.gisPoints}</p>
                    <p className="text-xs text-slate-600">Puntos GIS</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Menu con GIS destacado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <Link key={index} href={item.href}>
                    <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-slate-200 relative overflow-hidden">
                      {item.isNew && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                            <Zap className="h-3 w-3 mr-1" />
                            Nuevo
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-4">
                        <div
                          className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                        >
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-slate-800 group-hover:text-slate-900 transition-colors">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 group-hover:text-slate-700 transition-colors">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-slate-600 border-slate-300">
                            {item.stats}
                          </Badge>
                          <div className="text-slate-400 group-hover:text-slate-600 transition-colors">→</div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Layout de dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna principal */}
              <div className="lg:col-span-2 space-y-8">
                {/* Acciones Rápidas */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Acciones Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {quickActions.map((action, index) => {
                        const ActionIcon = action.icon
                        return (
                          <Link key={index} href={action.href}>
                            <Button
                              variant="outline"
                              className="h-auto flex-col gap-2 p-4 hover:shadow-lg transition-all duration-200 bg-white/50 hover:bg-white/80 border-slate-200"
                            >
                              <ActionIcon className={`h-5 w-5 ${action.color}`} />
                              <span className="text-xs text-slate-700">{action.title}</span>
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Sistema GIS - Destacado */}
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Sistema GIS Activado
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">Nuevo</Badge>
                    </CardTitle>
                    <CardDescription className="text-emerald-700">
                      Ahora puedes gestionar venues, eventos y fotos con geolocalización
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <MapPin className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-emerald-800">Mapas Interactivos</p>
                        <p className="text-xs text-emerald-600">Visualiza ubicaciones</p>
                      </div>
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <Navigation className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-emerald-800">Geolocalización</p>
                        <p className="text-xs text-emerald-600">GPS integrado</p>
                      </div>
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-emerald-800">Análisis Espacial</p>
                        <p className="text-xs text-emerald-600">Métricas y rutas</p>
                      </div>
                    </div>
                    <Link href="/gis">
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg">
                        <Globe className="h-4 w-4 mr-2" />
                        Explorar Sistema GIS
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Actividad Reciente */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                            <p className="text-xs text-slate-600 truncate">{activity.item}</p>
                            <p className="text-xs text-slate-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Estado de la Banda */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-500" />
                      Estado de la Banda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Miembros activos</span>
                        <Badge className="bg-green-100 text-green-800">3/3</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Próximo ensayo</span>
                        <Badge className="bg-blue-100 text-blue-800">Hoy 19:00</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Canciones listas</span>
                        <Badge className="bg-purple-100 text-purple-800">{stats.songs}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Venues mapeados</span>
                        <Badge className="bg-emerald-100 text-emerald-800">{stats.venues}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips GIS */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-amber-800 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Tips GIS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/60 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-1">📍 Agrega Venues</p>
                        <p className="text-xs text-amber-700">Registra estudios y salas para optimizar rutas</p>
                      </div>
                      <div className="p-3 bg-white/60 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-1">🗺️ Geolocaliza Eventos</p>
                        <p className="text-xs text-amber-700">Añade coordenadas GPS a tus shows</p>
                      </div>
                      <div className="p-3 bg-white/60 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-1">📊 Análisis Espacial</p>
                        <p className="text-xs text-amber-700">Descubre patrones en tu actividad musical</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DriveConnectionGuard>
    </AuthGuard>
  )
}
