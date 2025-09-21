'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Bed, Wifi, Tv, Coffee, Car, Home, Shield, Wind, Utensils, DollarSign, Users, MapPin } from 'lucide-react'
import { roomApi, Room } from '@/lib/api'

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchRoom()
    }
  }, [params.id])

  const fetchRoom = async () => {
    try {
      setLoading(true)
      const data = await roomApi.getById(params.id as string)
      setRoom(data)
    } catch (error) {
      console.error('Error fetching room:', error)
      setError('Failed to load room details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Available': 'status-badge bg-green-100 text-green-800',
      'Occupied': 'status-badge bg-blue-100 text-blue-800',
      'Maintenance': 'status-badge bg-yellow-100 text-yellow-800',
      'Out of Order': 'status-badge bg-red-100 text-red-800'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'status-badge'
  }

  const getAmenityIcon = (amenity: string) => {
    const icons = {
      'WiFi': Wifi,
      'TV': Tv,
      'Mini Bar': Coffee,
      'Balcony': Home,
      'Ocean View': Home,
      'City View': Home,
      'Air Conditioning': Wind,
      'Room Service': Utensils,
      'Safe': Shield,
      'Jacuzzi': Car
    }
    return icons[amenity as keyof typeof icons] || Home
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading room details...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error || 'Room not found'}</p>
          <Link href="/rooms" className="btn btn-primary">
            Back to Rooms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/rooms" className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Room {room.roomNumber}
              </h1>
            </div>
            <Link
              href={`/rooms/${room._id}/edit`}
              className="btn btn-primary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Room
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Room Information */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Bed className="h-6 w-6 text-primary-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Room Information</h2>
                </div>
                <span className={getStatusBadge(room.status)}>
                  {room.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <p className="text-gray-900">{room.roomNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <p className="text-gray-900">{room.roomType}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">Floor {room.floor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="card">
              <div className="flex items-center mb-6">
                <DollarSign className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Price per Night:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(room.pricePerNight)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="card">
                <div className="flex items-center mb-6">
                  <Wifi className="h-6 w-6 text-primary-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {room.amenities.map(amenity => {
                    const Icon = getAmenityIcon(amenity)
                    return (
                      <div key={amenity} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Icon className="h-5 w-5 text-primary-600 mr-3" />
                        <span className="text-gray-900">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {room.description && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-900 leading-relaxed">{room.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                  <span className={getStatusBadge(room.status)}>
                    {room.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
                  <span className={`status-badge ${
                    room.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Statistics */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Room Statistics</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Type:</span>
                  <span className="font-medium text-gray-900">{room.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium text-gray-900">{room.capacity} guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Floor:</span>
                  <span className="font-medium text-gray-900">{room.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amenities:</span>
                  <span className="font-medium text-gray-900">{room.amenities?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Images */}
            {room.images && room.images.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Room Images</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  {room.images.map((image, index) => (
                    <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Room ${room.roomNumber} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(room.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(room.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
