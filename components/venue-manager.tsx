"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, MapPin, Phone, Mail, Globe, Users, Edit, Trash2, Navigation, Calculator } from "lucide-react"
import type { Venue, Coordinates } from "@/lib/gis-types"
import { calculateDistance, formatDistance, getCurrentLocation } from "@/lib/gis-utils"
import { driveStorage } from "@/lib/google-drive-storage"

interface VenueManagerProps {
  onVenueSelect?: (venue: Venue) => void
}

export default function VenueManager({ onVenueSelect }: VenueManagerProps) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const [newVenue, setNewVenue] = useState({
    name: "",
    address: "",
    type: "venue" as Venue["type"],
    capacity: "",
    phone: "",
    email: "",
    website: "",
    notes: "",
    lat: "",
    lng: "",
  })

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
      }
    } catch (error) {
      console.error("Error loading venues:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveVenues = async (venuesData: Venue[]) => {
    try {
      await driveStorage.saveData("venues.json", venuesData)
      setVenues(venuesData)
    } catch (error) {
      console.error("Error saving venues:", error)
    }
  }

  const getUserLocation = async () => {
    setIsGettingLocation(true)
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
    } catch (error) {
      console.error("Error getting user location:", error)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleAddVenue = async () => {
    if (!newVenue.name || !newVenue.address || !newVenue.lat || !newVenue.lng) {
      return
    }

    const venue: Venue = {
      id: Date.now().toString(),
      name: newVenue.name,
      address: newVenue.address,
      coordinates: {
        lat: Number.parseFloat(newVenue.lat),
        lng: Number.parseFloat(newVenue.lng),
      },
      type: newVenue.type,
      capacity: newVenue.capacity ? Number.parseInt(newVenue.capacity) : undefined,
      contact: {
        phone: newVenue.phone || undefined,
        email: newVenue.email || undefined,
        website: newVenue.website || undefined,
      },
      notes: newVenue.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedVenues = [...venues, venue]
    await saveVenues(updatedVenues)

    // Reset form
    setNewVenue({
      name: "",
      address: "",
      type: "venue",
      capacity: "",
      phone: "",
      email: "",
      website: "",
      notes: "",
      lat: "",
      lng: "",
    })
    setShowAddDialog(false)
  }

  const handleEditVenue = async () => {
    if (!editingVenue || !newVenue.name || !newVenue.address || !newVenue.lat || !newVenue.lng) {
      return
    }

    const updatedVenue: Venue = {
      ...editingVenue,
      name: newVenue.name,
      address: newVenue.address,
      coordinates: {
        lat: Number.parseFloat(newVenue.lat),
        lng: Number.parseFloat(newVenue.lng),
      },
      type: newVenue.type,
      capacity: newVenue.capacity ? Number.parseInt(newVenue.capacity) : undefined,
      contact: {
        phone: newVenue.phone || undefined,
        email: newVenue.email || undefined,
        website: newVenue.website || undefined,
      },
      notes: newVenue.notes || undefined,
      updatedAt: new Date().toISOString(),
    }

    const updatedVenues = venues.map((v) => (v.id === editingVenue.id ? updatedVenue : v))
    await saveVenues(updatedVenues)

    setEditingVenue(null)
    resetForm()
  }

  const handleDeleteVenue = async (venueId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este venue?")) {
      const updatedVenues = venues.filter((v) => v.id !== venueId)
      await saveVenues(updatedVenues)
    }
  }

  const startEdit = (venue: Venue) => {
    setEditingVenue(venue)
    setNewVenue({
      name: venue.name,
      address: venue.address,
      type: venue.type,
      capacity: venue.capacity?.toString() || "",
      phone: venue.contact?.phone || "",
      email: venue.contact?.email || "",
      website: venue.contact?.website || "",
      notes: venue.notes || "",
      lat: venue.coordinates.lat.toString(),
      lng: venue.coordinates.lng.toString(),
    })
  }

  const resetForm = () => {
    setNewVenue({
      name: "",
      address: "",
      type: "venue",
      capacity: "",
      phone: "",
      email: "",
      website: "",
      notes: "",
      lat: "",
      lng: "",
    })
  }

  const getVenueTypeColor = (type: Venue["type"]) => {
    switch (type) {
      case "studio":
        return "bg-red-100 text-red-800"
      case "venue":
        return "bg-purple-100 text-purple-800"
      case "rehearsal":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getVenueTypeLabel = (type: Venue["type"]) => {
    switch (type) {
      case "studio":
        return "Estudio"
      case "venue":
        return "Venue"
      case "rehearsal":
        return "Ensayo"
      default:
        return "Otro"
    }
  }

  const venuesWithDistance = userLocation
    ? venues
        .map((venue) => ({
          ...venue,
          distance: calculateDistance(userLocation, venue.coordinates),
        }))
        .sort((a, b) => a.distance - b.distance)
    : venues

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Venues</h2>
          <p className="text-slate-600">Administra estudios, salas y venues de la banda</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={getUserLocation} disabled={isGettingLocation}>
            <Navigation className="h-4 w-4 mr-2" />
            {isGettingLocation ? "Ubicando..." : "Mi ubicación"}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Venue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Venue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="venue-name">Nombre</Label>
                  <Input
                    id="venue-name"
                    value={newVenue.name}
                    onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                    placeholder="Nombre del venue"
                  />
                </div>
                <div>
                  <Label htmlFor="venue-address">Dirección</Label>
                  <Input
                    id="venue-address"
                    value={newVenue.address}
                    onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                    placeholder="Dirección completa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="venue-lat">Latitud</Label>
                    <Input
                      id="venue-lat"
                      type="number"
                      step="any"
                      value={newVenue.lat}
                      onChange={(e) => setNewVenue({ ...newVenue, lat: e.target.value })}
                      placeholder="40.4168"
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue-lng">Longitud</Label>
                    <Input
                      id="venue-lng"
                      type="number"
                      step="any"
                      value={newVenue.lng}
                      onChange={(e) => setNewVenue({ ...newVenue, lng: e.target.value })}
                      placeholder="-3.7038"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue-type">Tipo</Label>
                  <Select
                    value={newVenue.type}
                    onValueChange={(value: Venue["type"]) => setNewVenue({ ...newVenue, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">Estudio</SelectItem>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="rehearsal">Sala de Ensayo</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="venue-capacity">Capacidad (opcional)</Label>
                  <Input
                    id="venue-capacity"
                    type="number"
                    value={newVenue.capacity}
                    onChange={(e) => setNewVenue({ ...newVenue, capacity: e.target.value })}
                    placeholder="Número de personas"
                  />
                </div>
                <div>
                  <Label htmlFor="venue-phone">Teléfono (opcional)</Label>
                  <Input
                    id="venue-phone"
                    value={newVenue.phone}
                    onChange={(e) => setNewVenue({ ...newVenue, phone: e.target.value })}
                    placeholder="+34 123 456 789"
                  />
                </div>
                <div>
                  <Label htmlFor="venue-email">Email (opcional)</Label>
                  <Input
                    id="venue-email"
                    type="email"
                    value={newVenue.email}
                    onChange={(e) => setNewVenue({ ...newVenue, email: e.target.value })}
                    placeholder="contacto@venue.com"
                  />
                </div>
                <div>
                  <Label htmlFor="venue-website">Website (opcional)</Label>
                  <Input
                    id="venue-website"
                    value={newVenue.website}
                    onChange={(e) => setNewVenue({ ...newVenue, website: e.target.value })}
                    placeholder="https://venue.com"
                  />
                </div>
                <div>
                  <Label htmlFor="venue-notes">Notas (opcional)</Label>
                  <Input
                    id="venue-notes"
                    value={newVenue.notes}
                    onChange={(e) => setNewVenue({ ...newVenue, notes: e.target.value })}
                    placeholder="Información adicional"
                  />
                </div>
                <Button onClick={handleAddVenue} className="w-full">
                  Agregar Venue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Estudios</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-1">{venues.filter((v) => v.type === "studio").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium">Venues</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-1">{venues.filter((v) => v.type === "venue").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Ensayo</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {venues.filter((v) => v.type === "rehearsal").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-1">{venues.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Venues List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando venues...</p>
          </CardContent>
        </Card>
      ) : venues.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay venues registrados</h3>
            <p className="text-slate-600 mb-4">Agrega tu primer venue para comenzar</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Venue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venuesWithDistance.map((venue) => (
            <Card key={venue.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getVenueTypeColor(venue.type)}>{getVenueTypeLabel(venue.type)}</Badge>
                      {venue.capacity && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {venue.capacity}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(venue)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVenue(venue.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">{venue.address}</span>
                  </div>

                  {userLocation && "distance" in venue && (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">{formatDistance(venue.distance)}</span>
                    </div>
                  )}

                  {venue.contact?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">{venue.contact.phone}</span>
                    </div>
                  )}

                  {venue.contact?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">{venue.contact.email}</span>
                    </div>
                  )}

                  {venue.contact?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      <a
                        href={venue.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Website
                      </a>
                    </div>
                  )}

                  {venue.notes && <p className="text-slate-600 text-xs mt-2 p-2 bg-slate-50 rounded">{venue.notes}</p>}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => onVenueSelect?.(venue)} className="flex-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    Ver en mapa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingVenue} onOpenChange={() => setEditingVenue(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Venue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-venue-name">Nombre</Label>
              <Input
                id="edit-venue-name"
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                placeholder="Nombre del venue"
              />
            </div>
            <div>
              <Label htmlFor="edit-venue-address">Dirección</Label>
              <Input
                id="edit-venue-address"
                value={newVenue.address}
                onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="edit-venue-lat">Latitud</Label>
                <Input
                  id="edit-venue-lat"
                  type="number"
                  step="any"
                  value={newVenue.lat}
                  onChange={(e) => setNewVenue({ ...newVenue, lat: e.target.value })}
                  placeholder="40.4168"
                />
              </div>
              <div>
                <Label htmlFor="edit-venue-lng">Longitud</Label>
                <Input
                  id="edit-venue-lng"
                  type="number"
                  step="any"
                  value={newVenue.lng}
                  onChange={(e) => setNewVenue({ ...newVenue, lng: e.target.value })}
                  placeholder="-3.7038"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-venue-type">Tipo</Label>
              <Select
                value={newVenue.type}
                onValueChange={(value: Venue["type"]) => setNewVenue({ ...newVenue, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Estudio</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="rehearsal">Sala de Ensayo</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-venue-capacity">Capacidad (opcional)</Label>
              <Input
                id="edit-venue-capacity"
                type="number"
                value={newVenue.capacity}
                onChange={(e) => setNewVenue({ ...newVenue, capacity: e.target.value })}
                placeholder="Número de personas"
              />
            </div>
            <div>
              <Label htmlFor="edit-venue-phone">Teléfono (opcional)</Label>
              <Input
                id="edit-venue-phone"
                value={newVenue.phone}
                onChange={(e) => setNewVenue({ ...newVenue, phone: e.target.value })}
                placeholder="+34 123 456 789"
              />
            </div>
            <div>
              <Label htmlFor="edit-venue-email">Email (opcional)</Label>
              <Input
                id="edit-venue-email"
                type="email"
                value={newVenue.email}
                onChange={(e) => setNewVenue({ ...newVenue, email: e.target.value })}
                placeholder="contacto@venue.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-venue-website">Website (opcional)</Label>
              <Input
                id="edit-venue-website"
                value={newVenue.website}
                onChange={(e) => setNewVenue({ ...newVenue, website: e.target.value })}
                placeholder="https://venue.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-venue-notes">Notas (opcional)</Label>
              <Input
                id="edit-venue-notes"
                value={newVenue.notes}
                onChange={(e) => setNewVenue({ ...newVenue, notes: e.target.value })}
                placeholder="Información adicional"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingVenue(null)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleEditVenue} className="flex-1">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
