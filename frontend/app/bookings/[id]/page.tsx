'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, User, Clock, DollarSign, Phone, Mail } from 'lucide-react'
import { bookingApi, Booking } from '@/lib/api'

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchBooking()
    }
  }, [params.id])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const data = await bookingApi.getById(params.id as string)
      setBooking(data)
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'Scheduled': 'status-badge bg-blue-100 text-blue-800',
      'Confirmed': 'status-badge status-confirmed',
      'In Progress': 'status-badge bg-purple-100 text-purple-800',
      'Completed': 'status-badge bg-green-100 text-green-800',
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

  const formatTime = (timeString: string) => {
    return timeString
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
          <p className="mt-2 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
          <Link href="/bookings" className="btn btn-primary">
            Back to Bookings
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
              <Link href="/bookings" className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Booking {booking.bookingNumber}
              </h1>
            </div>
            <Link
              href={`/bookings/${booking._id}/edit`}
              className="btn btn-primary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Booking
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Service Information */}
            <div className="card">
              <div className="flex items-center mb-6">
                <Calendar className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Service Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <p className="text-gray-900">{booking.serviceName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <p className="text-gray-900">{booking.serviceType}</p>
                </div>
                
                {booking.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{booking.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="card">
              <div className="flex items-center mb-6">
                <Clock className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{formatDate(booking.scheduledDate)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{formatTime(booking.scheduledTime)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <span className="text-gray-900">{booking.duration} minutes</span>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="card">
              <div className="flex items-center mb-6">
                <User className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Guest Information</h2>
              </div>
              
              {typeof booking.reservation === 'object' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                    <p className="text-gray-900">
                      {booking.reservation.guest.firstName} {booking.reservation.guest.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <a href={`mailto:${booking.reservation.guest.email}`} className="text-primary-600 hover:text-primary-700">
                        {booking.reservation.guest.email}
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <a href={`tel:${booking.reservation.guest.phone}`} className="text-primary-600 hover:text-primary-700">
                        {booking.reservation.guest.phone}
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                    <p className="text-gray-900">
                      Room {typeof booking.reservation.room === 'object' ? booking.reservation.room.roomNumber : 'Loading...'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading guest information...</p>
              )}
            </div>

            {/* Special Instructions & Notes */}
            {(booking.specialInstructions || booking.notes) && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions & Notes</h2>
                
                {booking.specialInstructions && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                    <p className="text-gray-900">{booking.specialInstructions}</p>
                  </div>
                )}
                
                {booking.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-gray-900">{booking.notes}</p>
                  </div>
                )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Status</label>
                  <span className={getStatusBadge(booking.status)}>
                    {booking.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <span className={`status-badge ${
                    booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                    booking.paymentStatus === 'Refunded' ? 'bg-blue-100 text-blue-800' :
                    'status-pending'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
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
                  <span className="text-gray-600">Price per service:</span>
                  <span className="font-medium">{formatCurrency(booking.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{booking.quantity}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Assignment */}
            {booking.assignedStaff && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Assignment</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Staff</label>
                  <p className="text-gray-900">{booking.assignedStaff}</p>
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
                    {new Date(booking.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(booking.updatedAt).toLocaleString()}
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
