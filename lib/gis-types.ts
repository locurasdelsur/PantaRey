// Tipos para funcionalidades GIS
import type { Photo } from "./photo-types" // Assuming Photo is declared in another file

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  heading?: number
}

export interface GeoEvent extends Event {
  location: string
  geoLocation?: GeoLocation
  venue?: Venue
  radius?: number // Radio de influencia en metros
}

export interface GeoPhoto extends Photo {
  geoLocation?: GeoLocation
  address?: string
  city?: string
  country?: string
}

export interface Venue {
  id: number
  name: string
  address: string
  geoLocation: GeoLocation
  type: "studio" | "venue" | "rehearsal" | "club" | "festival" | "outdoor"
  capacity?: number
  equipment?: string[]
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  rating?: number
  notes?: string
  photos?: string[]
}

export interface Tour {
  id: number
  name: string
  startDate: string
  endDate: string
  events: GeoEvent[]
  totalDistance?: number
  estimatedDuration?: number
}

export interface MapMarker {
  id: string
  position: GeoLocation
  type: "event" | "photo" | "venue" | "fan"
  title: string
  description?: string
  icon?: string
  color?: string
}

export interface HeatmapPoint {
  location: GeoLocation
  weight: number
  type: string
}
