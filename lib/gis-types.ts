export interface Coordinates {
  lat: number
  lng: number
}

export interface Venue {
  id: string
  name: string
  address: string
  coordinates: Coordinates
  type: "studio" | "venue" | "rehearsal" | "other"
  capacity?: number
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface GeocodingResult {
  coordinates: Coordinates
  formattedAddress: string
  components: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}

export interface DistanceResult {
  distance: number // in kilometers
  duration?: number // in minutes
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface GISEvent {
  id: string
  title: string
  date: string
  venueId?: string
  coordinates?: Coordinates
  address?: string
  type: "concert" | "rehearsal" | "recording" | "meeting" | "other"
}

export interface PhotoLocation {
  id: string
  photoId: string
  coordinates: Coordinates
  address?: string
  timestamp: string
}
