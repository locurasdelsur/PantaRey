"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InteractiveMap } from "@/components/interactive-map"
import { VenueManager } from "@/components/venue-manager"
import type { GeoLocation, MapMarker, Venue, GeoEvent } from "@/lib/gis-types"
import { GISUtils } from "@/lib/gis-utils"
import { Map, MapPin, Navigation, BarChart3, Calendar, TrendingUp, Globe, Zap } from "lucide-react"

export default function GISPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [events, setEvents] = useState<GeoEvent[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null)
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [selectedTab, setSelectedTab] = useState("overview")

  useEffect(() => {
    loadGISData()
    getCurrentLocation()
  }, [])

  const loadGISData = () => {
    // Cargar venues
    const savedVenues = localStorage.getItem("bandVenues")
    if (savedVenues) {
      try {
        setVenues(JSON.parse(savedVenues))
      } catch (error) {
        console.error("Error loading venues:", error)
      }
    }

    // Cargar eventos
    const savedEvents = localStorage.getItem("bandEvents")
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents)
        setEvents(parsedEvents)
      } catch (error) {
        console.error("Error loading events:", error)
      }
    }

    // Cargar fotos (simuladas con geolocalización)
    const savedPhotos = localStorage.getItem("bandPhotos")
    if (savedPhotos) {
      try {
        setPhotos(JSON.parse(savedPhotos))
      } catch (error) {
        console.error("Error loading photos:", error)
      }
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await GISUtils.getCurrentLocation()
      setUserLocation(location)
    } catch (error) {
      console.error("Error getting current location:", error)
    }
  }

  // Generar marcadores para el mapa
  useEffect(() => {
    const markers: MapMarker[] = []

    // Agregar venues
    venues.forEach((venue) => {
      markers.push({
        id: `venue-${venue.id}`,
        position: venue.geoLocation,
        type: "venue",
        title: venue.name,
        description: `${venue.type} - ${venue.address}`,
      })
    })

    // Agregar eventos (simulados con geolocalización)
    events.forEach((event) => {
      if (event.geoLocation) {
        markers.push({
          id: `event-${event.id}`,
          position: event.geoLocation,
          type: "event",
          title: event.title,
          description: `${event.date} - ${event.location}`,
        })
      }
    })

    setMapMarkers(markers)
  }, [venues, events])

  const getGISStats = () => {
    const totalVenues = venues.length
    const venuesByType = venues.reduce(
      (acc, venue) => {
        acc[venue.type] = (acc[venue.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const upcomingEvents = events.filter((event) => new Date(event.date) >= new Date()).length
    const eventsWithLocation = events.filter((event) => event.geoLocation).length

    let averageDistance = 0
    if (userLocation && venues.length > 0) {
      const distances = venues.map((venue) => GISUtils.calculateDistance(userLocation, venue.geoLocation))
      averageDistance = distances.reduce((a, b) => a + b, 0) / distances.length
    }

    return {
      totalVenues,
      venuesByType,
      upcomingEvents,
      eventsWithLocation,
      averageDistance: Math.round(averageDistance * 10) / 10,
      coverage: venues.length > 0 ? Math.round((eventsWithLocation / Math.max(events.length, 1)) * 100) : 0,
    }
  }

  const stats = getGISStats()

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
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Sistema GIS Musical</h1>
                <p className="text-slate-600">Gestión geoespacial de venues, eventos y ubicaciones</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Total Venues</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalVenues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Eventos Próximos</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.upcomingEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Navigation className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Distancia Promedio</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.averageDistance}km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Cobertura GIS</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.coverage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de contenido */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="venues" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-emerald-600" />
                  Mapa General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap markers={mapMarkers} height="500px" center={userLocation || undefined} />
              </CardContent>
            </Card>

            {/* Distribución por tipo de venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Venues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.venuesByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <span className="capitalize text-sm">{type}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cobertura Geográfica</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Eventos con ubicación</span>
                      <span className="font-medium">
                        {stats.eventsWithLocation}/{events.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.coverage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {stats.coverage}% de eventos tienen datos de geolocalización
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Venues */}
          <TabsContent value="venues">
            <VenueManager />
          </TabsContent>

          {/* Tab: Eventos */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Eventos con Geolocalización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events
                    .filter((event) => event.geoLocation)
                    .map((event) => (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <Badge className="bg-blue-500 text-white w-fit">{event.type}</Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              <strong>Fecha:</strong> {event.date}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Ubicación:</strong> {event.location}
                            </p>
                            {event.geoLocation && userLocation && (
                              <p className="text-sm text-gray-600">
                                <strong>Distancia:</strong>{" "}
                                {Math.round(GISUtils.calculateDistance(userLocation, event.geoLocation) * 10) / 10}km
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {events.filter((event) => event.geoLocation).length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos con geolocalización</h3>
                    <p className="text-gray-600">Los eventos necesitan coordenadas GPS para aparecer en el mapa</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Análisis */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Análisis Espacial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Venue más Cercano</h4>
                      {userLocation && venues.length > 0 ? (
                        (() => {
                          const distances = venues.map((venue) => ({
                            venue,
                            distance: GISUtils.calculateDistance(userLocation, venue.geoLocation),
                          }))
                          const closest = distances.reduce((prev, current) =>
                            current.distance < prev.distance ? current : prev,
                          )
                          return (
                            <div>
                              <p className="text-sm text-green-700">{closest.venue.name}</p>
                              <p className="text-xs text-green-600">
                                {Math.round(closest.distance * 10) / 10}km de distancia
                              </p>
                            </div>
                          )
                        })()
                      ) : (
                        <p className="text-sm text-green-700">Ubicación no disponible</p>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Concentración de Venues</h4>
                      <p className="text-sm text-blue-700">
                        {venues.length > 0 ? `${venues.length} venues registrados` : "No hay datos suficientes"}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Rutas Optimizadas</h4>
                      <p className="text-sm text-purple-700">Función disponible con más de 3 venues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    Métricas de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Datos GIS activos</span>
                      <Badge className="bg-green-100 text-green-800">{mapMarkers.length} puntos</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Precisión GPS</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {userLocation?.accuracy ? `±${Math.round(userLocation.accuracy)}m` : "N/A"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cobertura del mapa</span>
                      <Badge className="bg-purple-100 text-purple-800">{stats.coverage}%</Badge>
                    </div>

                    <div className="pt-4 border-t">
                      <Button className="w-full" onClick={getCurrentLocation}>
                        <Navigation className="h-4 w-4 mr-2" />
                        Actualizar Ubicación
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
