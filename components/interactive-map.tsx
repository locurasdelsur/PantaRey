"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui"
import { MapPin, Navigation } from "lucide-react"
import type { Coordinates, Venue } from "@/lib/gis-types"
import { calculateDistance, formatDistance } from "@/lib/gis-utils"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

interface InteractiveMapProps {
  venues: Venue[]
  center?: Coordinates
  zoom?: number
  height?: string
  onVenueSelect?: (venue: Venue) => void
  selectedVenueId?: string
}

export default function InteractiveMap({
  venues,
  center = { lat: 40.4168, lng: -3.7038 }, // Madrid default
  zoom = 10,
  height = "400px",
  onVenueSelect,
  selectedVenueId,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) return

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = await import("leaflet").then((module) => module.default)

      // Create map
      const mapInstance = L.map(mapRef.current!).setView([center.lat, center.lng], zoom)

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance)

      setMap(mapInstance)
    }

    initMap()

    // Cleanup function
    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  // Update venues on map
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer.options && layer.options.isVenueMarker) {
        map.removeLayer(layer)
      }
    })

    // Add venue markers
    venues.forEach((venue) => {
      const isSelected = venue.id === selectedVenueId

      // Create custom icon based on venue type
      const iconColor = getVenueColor(venue.type)
      const iconHtml = `
        <div style="
          background-color: ${isSelected ? "#f59e0b" : iconColor};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">
          ${getVenueIcon(venue.type)}
        </div>
      `

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-venue-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker([venue.coordinates.lat, venue.coordinates.lng], {
        icon: customIcon,
        isVenueMarker: true,
      }).addTo(map)

      // Add popup
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${venue.name}</h3>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${venue.address}</p>
          <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
            <span style="
              background-color: ${iconColor};
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              text-transform: capitalize;
            ">${venue.type}</span>
            ${venue.capacity ? `<span style="color: #666; font-size: 12px;">Cap: ${venue.capacity}</span>` : ""}
          </div>
          ${venue.notes ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">${venue.notes}</p>` : ""}
        </div>
      `

      marker.bindPopup(popupContent)

      // Add click handler
      marker.on("click", () => {
        if (onVenueSelect) {
          onVenueSelect(venue)
        }
      })
    })
  }, [map, venues, selectedVenueId, onVenueSelect])

  // Add user location marker
  useEffect(() => {
    if (!map || !userLocation) return

    // Remove existing user location marker
    map.eachLayer((layer: any) => {
      if (layer.options && layer.options.isUserLocation) {
        map.removeLayer(layer)
      }
    })

    // Add user location marker
    const userIcon = L.divIcon({
      html: `
        <div style="
          background-color: #3b82f6;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      className: "user-location-marker",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      isUserLocation: true,
    })
      .addTo(map)
      .bindPopup("Tu ubicación")
  }, [map, userLocation])

  const getUserLocation = async () => {
    setIsLoadingLocation(true)
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

      // Center map on user location
      if (map) {
        map.setView([coords.lat, coords.lng], 12)
      }
    } catch (error) {
      console.error("Error getting location:", error)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const getVenueColor = (type: string): string => {
    switch (type) {
      case "studio":
        return "#ef4444"
      case "venue":
        return "#8b5cf6"
      case "rehearsal":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  const getVenueIcon = (type: string): string => {
    switch (type) {
      case "studio":
        return "🎵"
      case "venue":
        return "🎤"
      case "rehearsal":
        return "🥁"
      default:
        return "📍"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa Interactivo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={getUserLocation} disabled={isLoadingLocation}>
              <Navigation className="h-4 w-4 mr-1" />
              {isLoadingLocation ? "Ubicando..." : "Mi ubicación"}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
            Estudios
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
            Venues
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            Ensayo
          </Badge>
          {userLocation && (
            <Badge variant="secondary" className="text-xs">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
              Tu ubicación
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-b-lg overflow-hidden" />
        {userLocation && venues.length > 0 && (
          <div className="p-4 border-t bg-slate-50">
            <h4 className="font-medium text-sm mb-2">Venues más cercanos:</h4>
            <div className="space-y-1">
              {venues
                .map((venue) => ({
                  ...venue,
                  distance: calculateDistance(userLocation, venue.coordinates),
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3)
                .map((venue) => (
                  <div key={venue.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{venue.name}</span>
                    <span className="text-slate-500">{formatDistance(venue.distance)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
