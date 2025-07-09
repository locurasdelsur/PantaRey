"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Music,
  CheckSquare,
  Lightbulb,
  MessageCircle,
  Play,
  Clock,
  AlertCircle,
  TrendingUp,
  Camera,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/user-menu"

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  // Cambiar los datos iniciales para que estén vacíos
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [songStats, setSongStats] = useState({
    total: 0,
    ready: 0,
    practicing: 0,
    developing: 0,
  })

  // Cargar estadísticas reales al inicializar
  useEffect(() => {
    // Cargar canciones
    const savedSongs = localStorage.getItem("bandSongs")
    if (savedSongs) {
      try {
        const songs = JSON.parse(savedSongs)
        const stats = {
          total: songs.length,
          ready: songs.filter((s) => s.status === "ready").length,
          practicing: songs.filter((s) => s.status === "practicing").length,
          developing: songs.filter((s) => s.status === "developing").length,
        }
        setSongStats(stats)
      } catch (error) {
        console.error("Error loading song stats:", error)
      }
    }

    // Cargar eventos próximos
    const savedEvents = localStorage.getItem("bandEvents")
    if (savedEvents) {
      try {
        const events = JSON.parse(savedEvents)
        const upcoming = events
          .filter((event) => new Date(event.date) >= new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5)
        setUpcomingEvents(upcoming)
      } catch (error) {
        console.error("Error loading events:", error)
      }
    }

    // Cargar actividad reciente (últimas acciones)
    const activities = []

    // Agregar últimas canciones
    if (savedSongs) {
      try {
        const songs = JSON.parse(savedSongs)
        songs.slice(-3).forEach((song) => {
          activities.push({
            icon: Music,
            title: `Nueva canción: ${song.title}`,
            time: "reciente",
            color: "text-blue-600",
          })
        })
      } catch (error) {}
    }

    // Agregar últimas tareas
    const savedTasks = localStorage.getItem("bandTasks")
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks)
        tasks
          .filter((t) => t.status === "done")
          .slice(-2)
          .forEach((task) => {
            activities.push({
              icon: CheckSquare,
              title: `Tarea completada: ${task.title}`,
              time: "reciente",
              color: "text-green-600",
            })
          })
      } catch (error) {}
    }

    setRecentActivity(activities.slice(0, 5))
  }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
        <div className="container mx-auto p-4 md:p-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-8 md:hidden">
            <MobileNav />
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Panta Rei Project" width={40} height={40} />
              <h1 className="text-xl font-bold text-slate-800">Panta Rei</h1>
            </div>
            <UserMenu />
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center mb-6">
                <Image src="/logo.png" alt="Panta Rei Project" width={120} height={120} className="drop-shadow-lg" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">Panta Rei Project</h1>
              <p className="text-lg md:text-xl text-slate-600 font-light">Centro de gestión musical</p>
              <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="absolute top-6 right-6">
              <UserMenu />
            </div>
          </div>

          {/* Welcome Message Mobile */}
          <div className="md:hidden mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Hola, {currentUser?.name?.split(" ")[0]}! 👋</h2>
            <p className="text-slate-600">Bienvenido de vuelta</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-700">Repertorio</CardTitle>
                <div className="p-1 md:p-2 bg-blue-50 rounded-lg">
                  <Music className="h-3 w-3 md:h-5 md:w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-3xl font-bold text-slate-800">{songStats.total}</div>
                <p className="text-xs text-slate-500 flex items-center mt-1">
                  <TrendingUp className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                  +2 este mes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-700">Listas</CardTitle>
                <div className="p-1 md:p-2 bg-emerald-50 rounded-lg">
                  <Play className="h-3 w-3 md:h-5 md:w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-3xl font-bold text-slate-800">{songStats.ready}</div>
                <p className="text-xs text-slate-500">33% del repertorio</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-700">Ensayando</CardTitle>
                <div className="p-1 md:p-2 bg-amber-50 rounded-lg">
                  <Clock className="h-3 w-3 md:h-5 md:w-5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-3xl font-bold text-slate-800">{songStats.practicing}</div>
                <p className="text-xs text-slate-500">50% del repertorio</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-700">Desarrollo</CardTitle>
                <div className="p-1 md:p-2 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-3 w-3 md:h-5 md:w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-3xl font-bold text-slate-800">{songStats.developing}</div>
                <p className="text-xs text-slate-500">17% del repertorio</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
            <Link href="/canciones" className="group">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl w-fit group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                    <Music className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-slate-800 group-hover:text-blue-600 transition-colors">
                    Gestor de Canciones
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Organiza tu repertorio completo con letras, acordes, grabaciones y seguimiento de progreso
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/calendario" className="group">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 md:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl w-fit group-hover:from-emerald-100 group-hover:to-emerald-200 transition-all duration-300">
                    <Calendar className="h-6 w-6 md:h-8 md:w-8 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-slate-800 group-hover:text-emerald-600 transition-colors">
                    Calendario Musical
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Programa ensayos, shows y sesiones de grabación con recordatorios automáticos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/tareas" className="group">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 md:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl w-fit group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-300">
                    <CheckSquare className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-slate-800 group-hover:text-purple-600 transition-colors">
                    Gestión de Tareas
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Organiza pendientes y proyectos del grupo con sistema Kanban visual
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/ideas" className="group">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 md:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl w-fit group-hover:from-yellow-100 group-hover:to-yellow-200 transition-all duration-300">
                    <Lightbulb className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-slate-800 group-hover:text-yellow-600 transition-colors">
                    Banco de Ideas
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Captura y comparte riffs, letras y conceptos creativos del grupo
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/chat" className="group">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 md:p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl w-fit group-hover:from-cyan-100 group-hover:to-cyan-200 transition-all duration-300">
                    <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-slate-800 group-hover:text-cyan-600 transition-colors">
                    Comunicación
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Chat interno organizado por temas para mantener la comunicación fluida
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/fotos" className="group">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 md:p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl w-fit group-hover:from-pink-100 group-hover:to-pink-200 transition-all duration-300">
                    <Camera className="h-6 w-6 md:h-8 md:w-8 text-pink-600" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-slate-800 group-hover:text-pink-600 transition-colors">
                    Galería de Fotos
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Momentos capturados de ensayos, shows y sesiones de grabación
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Recent Activity & Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2 text-lg md:text-xl">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="p-1.5 md:p-2 bg-white rounded-lg shadow-sm">
                        <activity.icon className={`h-3 w-3 md:h-4 md:w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm md:text-sm font-medium text-slate-800">{activity.title}</p>
                        <p className="text-xs text-slate-500">hace {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2 text-lg md:text-xl">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Próximos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm md:text-sm font-medium text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(event.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          - {event.time}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                          border-0 text-white text-xs
                          ${
                            event.type === "rehearsal"
                              ? "bg-blue-500"
                              : event.type === "gig"
                                ? "bg-emerald-500"
                                : "bg-purple-500"
                          }
                        `}
                      >
                        {event.type === "rehearsal" ? "Ensayo" : event.type === "gig" ? "Show" : "Grabación"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
