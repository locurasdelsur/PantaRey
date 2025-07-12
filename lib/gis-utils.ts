import type { Coordinates, GeocodingResult, MapBounds, Venue } from "./gis-types"

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLng = toRadians(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Find venues within a certain radius
export function findVenuesWithinRadius(center: Coordinates, venues: Venue[], radiusKm: number): Venue[] {
  return venues.filter((venue) => {
    const distance = calculateDistance(center, venue.coordinates)
    return distance <= radiusKm
  })
}

// Get the center point of multiple coordinates
export function getCenterPoint(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 }
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 },
  )

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  }
}

// Calculate bounds for a set of coordinates
export function calculateBounds(coordinates: Coordinates[], padding = 0.01): MapBounds {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  const lats = coordinates.map((c) => c.lat)
  const lngs = coordinates.map((c) => c.lng)

  return {
    north: Math.max(...lats) + padding,
    south: Math.min(...lats) - padding,
    east: Math.max(...lngs) + padding,
    west: Math.min(...lngs) - padding,
  }
}

// Sort venues by distance from a point
export function sortVenuesByDistance(center: Coordinates, venues: Venue[]): (Venue & { distance: number })[] {
  return venues
    .map((venue) => ({
      ...venue,
      distance: calculateDistance(center, venue.coordinates),
    }))
    .sort((a, b) => a.distance - b.distance)
}

// Geocoding using browser's geolocation API
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  })
}

// Simple address geocoding (you might want to integrate with a real geocoding service)
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  // This is a placeholder - in a real app, you'd use Google Maps Geocoding API
  // or another geocoding service
  try {
    // For demo purposes, return some sample coordinates for Madrid
    if (address.toLowerCase().includes("madrid")) {
      return {
        coordinates: { lat: 40.4168, lng: -3.7038 },
        formattedAddress: "Madrid, Spain",
        components: {
          city: "Madrid",
          country: "Spain",
        },
      }
    }

    // Return null if we can't geocode
    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

// Reverse geocoding (coordinates to address)
export async function reverseGeocode(coordinates: Coordinates): Promise<string | null> {
  // This is a placeholder - in a real app, you'd use a reverse geocoding service
  try {
    // For demo purposes, return a generic address
    return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return null
  }
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`
  } else {
    return `${Math.round(distanceKm)}km`
  }
}

// Check if a point is within bounds
export function isWithinBounds(point: Coordinates, bounds: MapBounds): boolean {
  return point.lat >= bounds.south && point.lat <= bounds.north && point.lng >= bounds.west && point.lng <= bounds.east
}
