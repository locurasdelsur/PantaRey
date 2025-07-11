"use client"

import { useEffect, useRef, useState } from "react"
import type { MapMarker, GeoLocation } from "@/lib/gis-types"
import { GISUtils } from "@/lib/gis-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "lucide-react"

interface InteractiveMapProps {
  markers: MapMarker[]
  center?: GeoLocation
  zoom?: number
  height?: string
  showControls?: boolean
  onMarkerClick?: (marker: MapMarker) => void
}

export function InteractiveMap({
  markers = [],
  center,
  zoom = 10,
  height = "400px",
  showControls = true,
  onMarkerClick,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Inicializar mapa con Leaflet
  useEffect(() => {
    if (typeof window === "undefined") return

    const initMap = async () => {
      // Importar Leaflet dinámicamente
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")

      if (mapRef.current && !map) {
        const defaultCenter = center || { latitude: -34.6037, longitude: -58.3816 } // Buenos Aires por defecto

        const leafletMap = L.map(mapRef.current).setView([defaultCenter.latitude, defaultCenter.longitude], zoom)

        // Agregar capa de mapa
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(leafletMap)

        setMap(leafletMap)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  // Actualizar marcadores cuando cambien
  useEffect(() => {
    if (!map || typeof window === "undefined") return

    const updateMarkers = async () => {
      const L = (await import("leaflet")).default

      // Limpiar marcadores existentes
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer)
        }
      })

      // Agregar nuevos marcadores
      markers.forEach((marker) => {
        const icon = L.divIcon({
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${getMarkerColor(marker.type)} text-white">
              ${getMarkerIcon(marker.type)}
            </div>
          `,
          className: "custom-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const leafletMarker = L.marker([marker.position.latitude, marker.position.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-sm">${marker.title}</h3>
              ${marker.description ? `<p class="text-xs text-gray-600 mt-1">${marker.description}</p>` : ""}
            </div>
          `)

        leafletMarker.on("click", () => {
          setSelectedMarker(marker)
          onMarkerClick?.(marker)
        })
      })

      // Ajustar vista si hay marcadores
      if (markers.length > 0) {
        const bounds = markers.map((m) => [m.position.latitude, m.position.longitude])
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }

    updateMarkers()
  }, [map, markers])

  const getMarkerColor = (type: string): string => {
    switch (type) {
      case "event":
        return "bg-blue-500"
      case "venue":
        return "bg-green-500"
      case "photo":
        return "bg-purple-500"
      case "fan":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getMarkerIcon = (type: string): string => {
    switch (type) {
      case "event":
        return "🎵"
      case "venue":
        return "🏛️"
      case "photo":
        return "📷"
      case "fan":
        return "👤"
      default:
        return "📍"
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await GISUtils.getCurrentLocation()
      setUserLocation(location)

      if (map) {
        const L = (await import("leaflet")).default

        // Agregar marcador de ubicación actual
        const userIcon = L.divIcon({
          html: '<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
          className: "user-location-marker",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })

        L.marker([location.latitude, location.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup("Tu ubicación actual")

        map.setView([location.latitude, location.longitude], 15)
      }
    } catch (error) {
      console.error("Error getting location:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height, width: "100%" }}
        className="rounded-lg overflow-hidden border border-gray-200"
      />

      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button size="sm" onClick={getCurrentLocation} className="bg-white text-gray-700 hover:bg-gray-50 shadow-lg">
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedMarker && (
        <Card className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${getMarkerColor(selectedMarker.type)}`}></span>
              {selectedMarker.title}
            </CardTitle>
          </CardHeader>
          {selectedMarker.description && (
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600">{selectedMarker.description}</p>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
