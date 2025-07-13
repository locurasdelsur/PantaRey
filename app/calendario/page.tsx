"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Calendar, Clock, MapPin, Users, Plus, Bell, Music2, Mic } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface Event {
  id: number
  title: string
  type: "rehearsal" | "gig" | "recording" | "meeting"
  date: string
  time: string
  location: string
  description?: string
  attendees: string[]
  reminder: boolean
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([])

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "rehearsal" as const,
    date: "",
    time: "",
    location: "",
    description: "",
    attendees: [] as string[],
    reminder: true,
  })

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "rehearsal":
        return "bg-blue-500"
      case "gig":
        return "bg-green-500"
      case "recording":
        return "bg-purple-500"
      case "meeting":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getEventTypeText = (type: string) => {
    switch (type) {
      case "rehearsal":
        return "Ensayo"
      case "gig":
        return "Show"
      case "recording":
        return "Grabación"
      case "meeting":
        return "Reunión"
      default:
        return type
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "rehearsal":
        return Music2
      case "gig":
        return Mic
      case "recording":
        return Calendar
      case "meeting":
        return Users
      default:
        return Calendar
    }
  }

  const handleAddEvent = () => {
    const event: Event = {
      id: Date.now(),
      ...newEvent,
      attendees: ["Cholo", "Fernando", "Emanuel"], // Por defecto todos los miembros
    }
    setEvents([...events, event])
    setNewEvent({
      title: "",
      type: "rehearsal",
      date: "",
      time: "",
      location: "",
      description: "",
      attendees: [],
      reminder: true,
    })
  }

  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const todayEvents = events.filter((event) => event.date === new Date().toISOString().split("T")[0])

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
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Calendario Musical</h1>
                <p className="text-slate-600">Organiza ensayos, shows y reuniones</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Agregar Nuevo Evento</DialogTitle>
                <DialogDescription className="text-slate-600">Programa un ensayo, show o reunión</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Título del evento"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="rehearsal">Ensayo</SelectItem>
                    <SelectItem value="gig">Show</SelectItem>
                    <SelectItem value="recording">Grabación</SelectItem>
                    <SelectItem value="meeting">Reunión</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-800"
                  />
                  <Input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-800"
                  />
                </div>
                <Input
                  placeholder="Ubicación"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <Textarea
                  placeholder="Descripción del evento..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <Button
                  onClick={handleAddEvent}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                >
                  Agregar Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-400" />
                Eventos de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayEvents.map((event) => {
                  const Icon = getEventIcon(event.type)
                  return (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-400" />
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">{event.title}</h3>
                        <p className="text-sm text-slate-600">
                          {event.time} - {event.location}
                        </p>
                      </div>
                      <Badge className={`${getEventTypeColor(event.type)} text-white border-0`}>
                        {getEventTypeText(event.type)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Próximos Eventos</h2>
            <div className="space-y-4">
              {upcomingEvents.map((event) => {
                const Icon = getEventIcon(event.type)
                const eventDate = new Date(event.date)
                const isToday = event.date === new Date().toISOString().split("T")[0]
                const isTomorrow = event.date === new Date(Date.now() + 86400000).toISOString().split("T")[0]

                return (
                  <Card key={event.id} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                          <Icon className="h-5 w-5 text-blue-400" />
                          {event.title}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge className={`${getEventTypeColor(event.type)} text-white border-0`}>
                            {getEventTypeText(event.type)}
                          </Badge>
                          {event.reminder && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                              <Bell className="h-3 w-3 mr-1" />
                              Recordatorio
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-slate-600">
                        {isToday
                          ? "Hoy"
                          : isTomorrow
                            ? "Mañana"
                            : eventDate.toLocaleDateString("es-ES", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="h-4 w-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="h-4 w-4" />
                          <span>{event.attendees.join(", ")}</span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{event.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Calendar View */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Vista de Calendario</h2>
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">Enero 2025</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-slate-600 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1
                    const dateStr = `2025-01-${day.toString().padStart(2, "0")}`
                    const hasEvent = events.some((event) => event.date === dateStr)
                    const isToday = dateStr === new Date().toISOString().split("T")[0]

                    return (
                      <div
                        key={day}
                        className={`
                          text-center p-2 text-sm cursor-pointer rounded transition-colors
                          ${isToday ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-200"}
                          ${hasEvent ? "ring-2 ring-blue-400" : ""}
                        `}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
