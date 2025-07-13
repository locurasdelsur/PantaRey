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
  Users,
  Play,
  Clock,
  AlertCircle,
  TrendingUp,
  Camera,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/auth/supabase-provider"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [recentActivity] = useState([
    { type: "song", title: 'Nueva versión de "Despertar"', time: "2 horas", icon: Music, color: "text-amber-400" },
    {
      type: "rehearsal",
      title: "Ensayo programado para mañana",
      time: "1 día",
      icon: Calendar,
      color: "text-emerald-400",
    },
    { type: "idea", title: "Juan subió un riff nuevo", time: "3 horas", icon: Lightbulb, color: "text-yellow-400" },
    { type: "task", title: "Comprar cuerdas - Completado", time: "5 horas", icon: CheckSquare, color: "text-blue-400" },
  ])

  const [upcomingEvents] = useState([
    { title: "Ensayo - Estudio Central", date: "2025-01-09", time: "19:00", type: "rehearsal" },
    { title: "Show - Bar El Refugio", date: "2025-01-15", time: "22:30", type: "gig" },
    { title: "Grabación - Estudio Norte", date: "2025-01-20", time: "15:00", type: "recording" },
  ])

  const [songStats] = useState({
    total: 24,
    ready: 8,
    practicing: 12,
    developing: 4,
  })

  const supabase = useSupabase()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
      <div className="container mx-auto p-6">
        {/* Header with Logo and User Info */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <Image src="/logo.png" alt="Panta Rei Project" width={120} height={120} className="drop-shadow-lg" />
          </div>
          <h1 className="text-5xl font-bold text-slate-800 mb-3 tracking-tight">Panta Rei Project</h1>
          <p className="text-xl text-slate-600 font-light">Centro de gestión musical</p>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-4 rounded-full"></div>

          {userEmail && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="text-slate-700 text-lg font-medium">Bienvenido, {userEmail}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-slate-300 text-slate-600 hover:bg-slate-100 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Repertorio Total</CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Music className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{songStats.total}</div>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2 este mes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Listas para Tocar</CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Play className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{songStats.ready}</div>
              <p className="text-xs text-slate-500">33% del repertorio</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">En Ensayo</CardTitle>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{songStats.practicing}</div>
              <p className="text-xs text-slate-500">50% del repertorio</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">En Desarrollo</CardTitle>
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{songStats.developing}</div>
              <p className="text-xs text-slate-500">17% del repertorio</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Link href="/canciones" className="group">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl w-fit group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                  <Music className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-slate-800 group-hover:text-blue-600 transition-colors">
                  Gestor de Canciones
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Organiza tu repertorio completo con letras, acordes, grabaciones y seguimiento de progreso
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/calendario" className="group">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl w-fit group-hover:from-emerald-100 group-hover:to-emerald-200 transition-all duration-300">
                  <Calendar className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Calendario Musical
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Programa ensayos, shows y sesiones de grabación con recordatorios automáticos
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/tareas" className="group">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl w-fit group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-300">
                  <CheckSquare className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-slate-800 group-hover:text-purple-600 transition-colors">
                  Gestión de Tareas
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Organiza pendientes y proyectos del grupo con sistema Kanban visual
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/ideas" className="group">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl w-fit group-hover:from-yellow-100 group-hover:to-yellow-200 transition-all duration-300">
                  <Lightbulb className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-xl text-slate-800 group-hover:text-yellow-600 transition-colors">
                  Banco de Ideas
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Captura y comparte riffs, letras y conceptos creativos del grupo
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/chat" className="group">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl w-fit group-hover:from-cyan-100 group-hover:to-cyan-200 transition-all duration-300">
                  <MessageCircle className="h-8 w-8 text-cyan-600" />
                </div>
                <CardTitle className="text-xl text-slate-800 group-hover:text-cyan-600 transition-colors">
                  Comunicación
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Chat interno organizado por temas para mantener la comunicación fluida
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/fotos" className="group">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl w-fit group-hover:from-pink-100 group-hover:to-pink-200 transition-all duration-300">
                  <Camera className="h-8 w-8 text-pink-600" />
                </div>
                <CardTitle className="text-xl text-slate-800 group-hover:text-pink-600 transition-colors">
                  Galería de Fotos
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Momentos capturados de ensayos, shows y sesiones de grabación
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl w-fit">
                <Users className="h-8 w-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">Miembros Activos</CardTitle>
              <CardDescription className="text-slate-600">
                <div className="flex items-center justify-center gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Cholo, Fernando, Emanuel</span>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                      <p className="text-xs text-slate-500">hace {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{event.title}</p>
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
  )
}
