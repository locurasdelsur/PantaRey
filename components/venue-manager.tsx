"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Venue } from "@/lib/gis-types"
import { GISUtils } from "@/lib/gis-utils"
import { InteractiveMap } from "./interactive-map"
import { MapPin, Plus, Star, Phone, Mail, Globe, Trash2 } from "lucide-react"

export function VenueManager() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [newVenue, setNewVenue] = useState<Partial<Venue>>({
    name: "",
    address: "",
    type: "venue",
    capacity: undefined,
    equipment: [],
    contact: {},
    rating: undefined,
    notes: "",
  })

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = () => {
    const savedVenues = localStorage.getItem("bandVenues")
    if (savedVenues) {
      try {
        setVenues(JSON.parse(savedVenues))
      } catch (error) {
        console.error("Error loading venues:", error)
      }
    }
  }

  const saveVenues = (updatedVenues: Venue[]) => {
    setVenues(updatedVenues)
    localStorage.setItem("bandVenues", JSON.stringify(updatedVenues))
  }

  const handleAddVenue = async () => {
    if (!newVenue.name || !newVenue.address) {
      alert("Por favor completa nombre y dirección")
      return
    }

    setIsLoading(true)

    try {
      // Geocodificar dirección
      const geoLocation = await GISUtils.geocode(newVenue.address)

      if (!geoLocation) {
        alert("No se pudo encontrar la ubicación. Verifica la dirección.")
        setIsLoading(false)
        return
      }

      const venue: Venue = {
        id: Date.now(),
        name: newVenue.name,
        address: newVenue.address,
        geoLocation,
        type: newVenue.type as any,
        capacity: newVenue.capacity,
        equipment: newVenue.equipment || [],
        contact: newVenue.contact || {},
        rating: newVenue.rating,
        notes: newVenue.notes,
        photos: [],
      }

      const updatedVenues = [...venues, venue]
      saveVenues(updatedVenues)

      setNewVenue({
        name: "",
        address: "",
        type: "venue",
        capacity: undefined,
        equipment: [],
        contact: {},
        rating: undefined,
        notes: "",
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding venue:", error)
      alert("Error al agregar el venue")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteVenue = (venueId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este venue?")) {
      const updatedVenues = venues.filter((v) => v.id !== venueId)
      saveVenues(updatedVenues)
    }
  }

  const getVenueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      studio: "Estudio",
      venue: "Venue",
      rehearsal: "Sala de Ensayo",
      club: "Club",
      festival: "Festival",
      outdoor: "Aire Libre",
    }
    return labels[type] || type
  }

  const getVenueTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      studio: "bg-purple-500",
      venue: "bg-blue-500",
      rehearsal: "bg-green-500",
      club: "bg-orange-500",
      festival: "bg-red-500",
      outdoor: "bg-teal-500",
    }
    return colors[type] || "bg-gray-500"
  }

  const mapMarkers = venues.map((venue) => ({
    id: venue.id.toString(),
    position: venue.geoLocation,
    type: "venue" as const,
    title: venue.name,
    description: `${getVenueTypeLabel(venue.type)} - ${venue.address}`,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Venues</h2>
          <p className="text-slate-600">Administra estudios, salas y lugares de presentación</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Venue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nombre del venue"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                />
                <Select
                  value={newVenue.type}
                  onValueChange={(value) => setNewVenue({ ...newVenue, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Estudio</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="rehearsal">Sala de Ensayo</SelectItem>
                    <SelectItem value="club">Club</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="outdoor">Aire Libre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Dirección completa"
                value={newVenue.address}
                onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Capacidad"
                  value={newVenue.capacity || ""}
                  onChange={(e) => setNewVenue({ ...newVenue, capacity: Number.parseInt(e.target.value) || undefined })}
                />
                <Input
                  type="number"
                  placeholder="Rating (1-5)"
                  min="1"
                  max="5"
                  value={newVenue.rating || ""}
                  onChange={(e) => setNewVenue({ ...newVenue, rating: Number.parseInt(e.target.value) || undefined })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Teléfono"
                  value={newVenue.contact?.phone || ""}
                  onChange={(e) =>
                    setNewVenue({
                      ...newVenue,
                      contact: { ...newVenue.contact, phone: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newVenue.contact?.email || ""}
                  onChange={(e) =>
                    setNewVenue({
                      ...newVenue,
                      contact: { ...newVenue.contact, email: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Website"
                  value={newVenue.contact?.website || ""}
                  onChange={(e) =>
                    setNewVenue({
                      ...newVenue,
                      contact: { ...newVenue.contact, website: e.target.value },
                    })
                  }
                />
              </div>

              <Textarea
                placeholder="Notas adicionales..."
                value={newVenue.notes}
                onChange={(e) => setNewVenue({ ...newVenue, notes: e.target.value })}
              />

              <Button onClick={handleAddVenue} disabled={isLoading} className="w-full">
                {isLoading ? "Agregando..." : "Agregar Venue"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mapa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Mapa de Venues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InteractiveMap
            markers={mapMarkers}
            height="400px"
            onMarkerClick={(marker) => {
              const venue = venues.find((v) => v.id.toString() === marker.id)
              setSelectedVenue(venue || null)
            }}
          />
        </CardContent>
      </Card>

      {/* Lista de Venues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((venue) => (
          <Card key={venue.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <Badge className={`${getVenueTypeColor(venue.type)} text-white mt-1`}>
                    {getVenueTypeLabel(venue.type)}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteVenue(venue.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{venue.address}</p>
              </div>

              {venue.capacity && (
                <p className="text-sm text-gray-600">
                  <strong>Capacidad:</strong> {venue.capacity} personas
                </p>
              )}

              {venue.rating && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < venue.rating! ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">({venue.rating}/5)</span>
                </div>
              )}

              {(venue.contact?.phone || venue.contact?.email || venue.contact?.website) && (
                <div className="flex gap-3 pt-2 border-t">
                  {venue.contact.phone && (
                    <Button variant="ghost" size="sm" className="h-8 p-2">
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                  {venue.contact.email && (
                    <Button variant="ghost" size="sm" className="h-8 p-2">
                      <Mail className="h-3 w-3" />
                    </Button>
                  )}
                  {venue.contact.website && (
                    <Button variant="ghost" size="sm" className="h-8 p-2">
                      <Globe className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {venue.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{venue.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {venues.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay venues registrados</h3>
            <p className="text-gray-600 mb-4">Comienza agregando estudios, salas de ensayo y venues donde tocan</p>
            <Button onClick={() => setIsDialogOpen(true)}>Agregar Primer Venue</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
