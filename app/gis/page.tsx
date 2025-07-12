"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MapPin, Navigation, Calculator, Zap, Map, Building, Route, BarChart3 } from "lucide-react"
import InteractiveMap from "@/components/interactive-map"
import VenueManager from "@/components/venue-manager"
import type { Venue, Coordinates } from "@/lib/gis-types"
import { calculateDistance, formatDistance, getCenterPoint } from "@/lib/gis-utils"
import { driveStorage } from "@/lib/google-drive-storage"

export default function GISPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 40.4168, lng: -3.7038 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadVenues()
    getUserLocation()
  }, [])

  const loadVenues = async () => {
    try {
      setIsLoading(true)
      const data = await driveStorage.loadData("venues.json")
      if (data && Array.isArray(data)) {
        setVenues(data)

        // Set map center to venues center if available
        if (data.length > 0) {
          const center = getCenterPoint(data.map((v) => v.coordinates))
          setMapCenter(center)
        }
      }
    } catch (error) {
      console.error("Error loading venues:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      setUserLocation(coords)
      setMapCenter(coords)
    } catch (error) {
      console.error("Error getting location:", error)
    }
  }

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue)
    setMapCenter(venue.coordinates)
  }

  const getVenueStats = () => {
    const stats = {
      total: venues.length,
      studios: venues.filter((v) => v.type === "studio").length,
      venues: venues.filter((v) => v.type === "venue").length,
      rehearsal: venues.filter((v) => v.type === "rehearsal").length,
      totalCapacity: venues.reduce((sum, v) => sum + (v.capacity || 0), 0),
      averageDistance: 0,
    }

    if (userLocation && venues.length > 0) {
      const distances = venues.map((v) => calculateDistance(userLocation, v.coordinates))
      stats.averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
    }

    return stats
  }

  const getNearestVenues = (limit = 5) => {
    if (!userLocation) return []

    return venues
      .map((venue) => ({
        ...venue,
        distance: calculateDistance(userLocation, venue.coordinates),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
  }

  const stats = getVenueStats()
  const nearestVenues = getNearestVenues()

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
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Sistema GIS</h1>
                <p className="text-slate-600">Gestión geoespacial de venues, eventos y ubicaciones</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Venues</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Capacidad Total</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalCapacity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Navigation className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Distancia Promedio</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {userLocation ? formatDistance(stats.averageDistance) : "--"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Zap className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Estado GIS</p>
                  <p className="text-lg font-bold text-green-600">Activo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="venues" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Rutas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InteractiveMap
                  venues={venues}
                  center={mapCenter}
                  zoom={12}
                  height="500px"
                  onVenueSelect={handleVenueSelect}
                  selectedVenueId={selectedVenue?.id}
                />
              </div>
              <div className="space-y-4">
                {selectedVenue && (
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Venue Seleccionado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-slate-800">{selectedVenue.name}</h3>
                          <p className="text-sm text-slate-600">{selectedVenue.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              selectedVenue.type === "studio"
                                ? "bg-red-100 text-red-800"
                                : selectedVenue.type === "venue"
                                  ? "bg-purple-100 text-purple-800"
                                  : selectedVenue.type === "rehearsal"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                            }
                          >
                            {selectedVenue.type === "studio"
                              ? "Estudio"
                              : selectedVenue.type === "venue"
                                ? "Venue"
                                : selectedVenue.type === "rehearsal"
                                  ? "Ensayo"
                                  : "Otro"}
                          </Badge>
                          {selectedVenue.capacity && <Badge variant="outline">{selectedVenue.capacity} personas</Badge>}
                        </div>
                        {userLocation && (
                          <div className="text-sm text-slate-600">
                            <strong>Distancia:</strong>{" "}
                            {formatDistance(calculateDistance(userLocation, selectedVenue.coordinates))}
                          </div>
                        )}
                        {selectedVenue.notes && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{selectedVenue.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {userLocation && nearestVenues.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Venues Más Cercanos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {nearestVenues.map((venue) => (
                          <div
                            key={venue.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer"
                            onClick={() => handleVenueSelect(venue)}
                          >
                            <div>
                              <p className="font-medium text-sm">{venue.name}</p>
                              <p className="text-xs text-slate-600">{venue.type}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {formatDistance(venue.distance)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="venues">
            <VenueManager onVenueSelect={handleVenueSelect} />
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Planificación de Rutas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Route className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Próximamente</h3>
                  <p className="text-slate-600">
                    Funcionalidad de planificación de rutas y optimización de recorridos entre venues.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Distribución por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Estudios</span>
                      </div>
                      <span className="font-semibold">{stats.studios}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Venues</span>
                      </div>
                      <span className="font-semibold">{stats.venues}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Salas de Ensayo</span>
                      </div>
                      <span className="font-semibold">{stats.rehearsal}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Métricas Espaciales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total de Venues</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Capacidad Total</span>
                      <span className="font-semibold">{stats.totalCapacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Distancia Promedio</span>
                      <span className="font-semibold">
                        {userLocation ? formatDistance(stats.averageDistance) : "--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cobertura Geográfica</span>
                      <span className="font-semibold text-green-600">Activa</span>
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
