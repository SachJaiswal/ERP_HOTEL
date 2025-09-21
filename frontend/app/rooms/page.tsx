'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Bed, Users, DollarSign, Wifi, Car, Coffee } from 'lucide-react'
import { roomApi, Room } from '@/lib/api'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRooms()
  }, [currentPage, roomTypeFilter, statusFilter])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await roomApi.getAll({
        page: currentPage,
        limit: 12,
        roomType: roomTypeFilter || undefined,
        status: statusFilter || undefined,
        sortBy: 'roomNumber',
        sortOrder: 'asc'
      })
      setRooms(response.rooms)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchRooms()
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
      'TV': Users,
      'Mini Bar': Coffee,
      'Balcony': Users,
      'Ocean View': Users,
      'City View': Users,
      'Air Conditioning': Users,
      'Room Service': Users,
      'Safe': Users,
      'Jacuzzi': Users
    }
    return icons[amenity as keyof typeof icons] || Users
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
            </div>
            <Link
              href="/rooms/new"
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by room number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="input pl-10"
              >
                <option value="">All Room Types</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
                <option value="Executive">Executive</option>
                <option value="Presidential">Presidential</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pl-10"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Order">Out of Order</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="btn btn-primary"
            >
              Search
            </button>
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="ml-3 text-gray-600">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600 mb-4">Get started by adding a new room.</p>
            <Link href="/rooms/new" className="btn btn-primary">
              Add Room
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room) => (
                <div key={room._id} className="card hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Room {room.roomNumber}
                    </h3>
                    <span className={getStatusBadge(room.status)}>
                      {room.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Bed className="h-4 w-4 mr-2" />
                      <span className="font-medium">{room.roomType}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span className="font-medium">{formatCurrency(room.pricePerNight)}/night</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">Floor {room.floor}</span>
                    </div>
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity) => {
                          const Icon = getAmenityIcon(amenity)
                          return (
                            <span
                              key={amenity}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {amenity}
                            </span>
                          )
                        })}
                        {room.amenities.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {room.description && (
                    <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  <div className="mt-6 flex space-x-2">
                    <Link
                      href={`/rooms/${room._id}`}
                      className="flex-1 btn btn-secondary text-center"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/rooms/${room._id}/edit`}
                      className="flex-1 btn btn-primary text-center"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
