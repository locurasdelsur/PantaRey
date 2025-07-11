import type { GeoLocation } from "./gis-types"

export class GISUtils {
  // Calcular distancia entre dos puntos usando fórmula de Haversine
  static calculateDistance(point1: GeoLocation, point2: GeoLocation): number {
    const R = 6371 // Radio de la Tierra en km
    const dLat = this.toRadians(point2.latitude - point1.latitude)
    const dLon = this.toRadians(point2.longitude - point1.longitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Convertir grados a radianes
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Obtener ubicación actual del usuario
  static getCurrentLocation(): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
          })
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      )
    })
  }

  // Geocodificación reversa usando API de OpenStreetMap
  static async reverseGeocode(location: GeoLocation): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=16&addressdetails=1`,
      )
      const data = await response.json()
      return data.display_name || `${location.latitude}, ${location.longitude}`
    } catch (error) {
      console.error("Reverse geocoding failed:", error)
      return `${location.latitude}, ${location.longitude}`
    }
  }

  // Geocodificación directa
  static async geocode(address: string): Promise<GeoLocation | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          latitude: Number.parseFloat(data[0].lat),
          longitude: Number.parseFloat(data[0].lon),
        }
      }
      return null
    } catch (error) {
      console.error("Geocoding failed:", error)
      return null
    }
  }

  // Calcular centro geográfico de un conjunto de puntos
  static calculateCenter(points: GeoLocation[]): GeoLocation {
    if (points.length === 0) {
      return { latitude: 0, longitude: 0 }
    }

    const sum = points.reduce(
      (acc, point) => ({
        latitude: acc.latitude + point.latitude,
        longitude: acc.longitude + point.longitude,
      }),
      { latitude: 0, longitude: 0 },
    )

    return {
      latitude: sum.latitude / points.length,
      longitude: sum.longitude / points.length,
    }
  }

  // Determinar si un punto está dentro de un radio
  static isWithinRadius(center: GeoLocation, point: GeoLocation, radiusKm: number): boolean {
    const distance = this.calculateDistance(center, point)
    return distance <= radiusKm
  }

  // Generar bounds para un mapa basado en puntos
  static calculateBounds(points: GeoLocation[]): {
    northeast: GeoLocation
    southwest: GeoLocation
  } {
    if (points.length === 0) {
      return {
        northeast: { latitude: 0, longitude: 0 },
        southwest: { latitude: 0, longitude: 0 },
      }
    }

    const latitudes = points.map((p) => p.latitude)
    const longitudes = points.map((p) => p.longitude)

    return {
      northeast: {
        latitude: Math.max(...latitudes),
        longitude: Math.max(...longitudes),
      },
      southwest: {
        latitude: Math.min(...latitudes),
        longitude: Math.min(...longitudes),
      },
    }
  }
}
