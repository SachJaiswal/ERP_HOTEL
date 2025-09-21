'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, User, Bed, DollarSign, Phone, Mail, MapPin, Clock } from 'lucide-react'
import { reservationApi, bookingApi, Reservation, Booking } from '@/lib/api'

export default function ReservationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchReservation()
      fetchBookings()
    }
  }, [params.id])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      const data = await reservationApi.getById(params.id as string)
      setReservation(data)
    } catch (error) {
      console.error('Error fetching reservation:', error)
      setError('Failed to load reservation details')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.getByReservation(params.id as string)
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Pending': 'status-badge status-pending',
      'Confirmed': 'status-badge status-confirmed',
      'Checked In': 'status-badge status-checked-in',
      'Checked Out': 'status-badge status-checked-out',
      'Cancelled': 'status-badge status-cancelled',
      'No Show': 'status-badge status-no-show'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'status-badge'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          <p className="mt-2 text-gray-600">Loading reservation details...</p>
        </div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error || 'Reservation not found'}</p>
          <Link href="/reservations" className="btn btn-primary">
            Back to Reservations
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
              <Link href="/reservations" className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Reservation {reservation.reservationNumber}
              </h1>
            </div>
            <Link
              href={`/reservations/${reservation._id}/edit`}
              className="btn btn-primary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Reservation
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Guest Information */}
            <div className="card">
              <div className="flex items-center mb-6">
                <User className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Guest Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">
                    {reservation.guest.firstName} {reservation.guest.lastName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`mailto:${reservation.guest.email}`} className="text-primary-600 hover:text-primary-700">
                      {reservation.guest.email}
                    </a>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`tel:${reservation.guest.phone}`} className="text-primary-600 hover:text-primary-700">
                      {reservation.guest.phone}
                    </a>
                  </div>
                </div>

                {reservation.guest.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <div className="text-gray-900">
                        {reservation.guest.address.street && <div>{reservation.guest.address.street}</div>}
                        {reservation.guest.address.city && reservation.guest.address.state && (
                          <div>{reservation.guest.address.city}, {reservation.guest.address.state}</div>
                        )}
                        {reservation.guest.address.zipCode && <div>{reservation.guest.address.zipCode}</div>}
                        {reservation.guest.address.country && <div>{reservation.guest.address.country}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reservation Details */}
            <div className="card">
              <div className="flex items-center mb-6">
                <Calendar className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Reservation Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{formatDate(reservation.checkIn)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{formatDate(reservation.checkOut)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                  <span className="text-gray-900">{reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'Guest' : 'Guests'}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Nights</label>
                  <span className="text-gray-900">{reservation.numberOfNights} {reservation.numberOfNights === 1 ? 'Night' : 'Nights'}</span>
                </div>
              </div>
            </div>

            {/* Room Information */}
            <div className="card">
              <div className="flex items-center mb-6">
                <Bed className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Room Information</h2>
              </div>
              
              {typeof reservation.room === 'object' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <span className="text-gray-900">{reservation.room.roomNumber}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                    <span className="text-gray-900">{reservation.room.roomType}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <span className="text-gray-900">{reservation.room.capacity} {reservation.room.capacity === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night</label>
                    <span className="text-gray-900">{formatCurrency(reservation.room.pricePerNight)}</span>
                  </div>
                  
                  {reservation.room.amenities && reservation.room.amenities.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {reservation.room.amenities.map(amenity => (
                          <span key={amenity} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Loading room information...</p>
              )}
            </div>

            {/* Associated Bookings */}
            {bookings.length > 0 && (
              <div className="card">
                <div className="flex items-center mb-6">
                  <Clock className="h-6 w-6 text-primary-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Associated Bookings</h2>
                </div>
                
                <div className="space-y-4">
                  {bookings.map(booking => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{booking.serviceName}</h3>
                          <p className="text-sm text-gray-600">{booking.serviceType}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`status-badge ${
                            booking.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'Confirmed' ? 'status-confirmed' :
                            booking.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                            booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            'status-cancelled'
                          }`}>
                            {booking.status}
                          </span>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status & Payment */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Payment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Status</label>
                  <span className={getStatusBadge(reservation.status)}>
                    {reservation.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <span className={`status-badge ${
                    reservation.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    reservation.paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                    reservation.paymentStatus === 'Refunded' ? 'bg-blue-100 text-blue-800' :
                    'status-pending'
                  }`}>
                    {reservation.paymentStatus}
                  </span>
                </div>
                
                {reservation.paymentMethod && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <span className="text-gray-900">{reservation.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="card">
              <div className="flex items-center mb-4">
                <DollarSign className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Pricing Summary</h2>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room rate per night:</span>
                  <span className="font-medium">
                    {typeof reservation.room === 'object' ? formatCurrency(reservation.room.pricePerNight) : 'Loading...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Number of nights:</span>
                  <span className="font-medium">{reservation.numberOfNights}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(reservation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Requests & Notes */}
            {(reservation.specialRequests || reservation.notes) && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                
                {reservation.specialRequests && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                    <p className="text-gray-900">{reservation.specialRequests}</p>
                  </div>
                )}
                
                {reservation.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-gray-900">{reservation.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(reservation.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(reservation.updatedAt).toLocaleString()}
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
