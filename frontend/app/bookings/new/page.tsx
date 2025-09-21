'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Calendar, User, Clock, DollarSign, Plus } from 'lucide-react'
import { bookingApi, reservationApi, Reservation } from '@/lib/api'

export default function NewBookingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [formData, setFormData] = useState({
    reservation: '',
    serviceType: '',
    serviceName: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    price: 0,
    quantity: 1,
    specialInstructions: '',
    notes: ''
  })
  const [errors, setErrors] = useState<any>({})

  useEffect(() => {
    fetchConfirmedReservations()
  }, [])

  const fetchConfirmedReservations = async () => {
    try {
      const response = await reservationApi.getAll({ 
        status: 'Confirmed',
        limit: 1000 
      })
      setReservations(response.reservations || [])
    } catch (error) {
      console.error('Error fetching reservations:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' || name === 'quantity' ? 
        parseFloat(value) || 0 : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleReservationSelect = (reservationId: string) => {
    const reservation = reservations.find(r => r._id === reservationId)
    setSelectedReservation(reservation || null)
    setFormData(prev => ({
      ...prev,
      reservation: reservationId
    }))
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.reservation) newErrors.reservation = 'Reservation selection is required'
    if (!formData.serviceType) newErrors.serviceType = 'Service type is required'
    if (!formData.serviceName.trim()) newErrors.serviceName = 'Service name is required'
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Scheduled date is required'
    if (!formData.scheduledTime) newErrors.scheduledTime = 'Scheduled time is required'
    if (formData.duration < 15) newErrors.duration = 'Duration must be at least 15 minutes'
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0'
    if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1'

    // Validate scheduled date is not in the past
    if (formData.scheduledDate) {
      const scheduledDate = new Date(formData.scheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (scheduledDate < today) {
        newErrors.scheduledDate = 'Scheduled date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      // Create booking
      const booking = await bookingApi.create(formData)
      
      // Redirect to bookings list
      router.push('/bookings')
    } catch (error: any) {
      console.error('Error creating booking:', error)
      if (error.response?.data?.errors) {
        const apiErrors: any = {}
        error.response.data.errors.forEach((err: any) => {
          apiErrors[err.path] = err.msg
        })
        setErrors(apiErrors)
      } else {
        setErrors({ general: 'Failed to create booking. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalAmount = () => {
    return formData.price * formData.quantity
  }

  const serviceTypes = [
    'Room Service',
    'Spa',
    'Restaurant',
    'Conference Room',
    'Event Hall',
    'Transportation',
    'Tour',
    'Other'
  ]

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
              <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Reservation Selection */}
          <div className="card">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Select Reservation</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation *
              </label>
              <select
                name="reservation"
                value={formData.reservation}
                onChange={(e) => handleReservationSelect(e.target.value)}
                className={`input ${errors.reservation ? 'border-red-500' : ''}`}
              >
                <option value="">Choose a reservation...</option>
                {reservations.map(reservation => (
                  <option key={reservation._id} value={reservation._id}>
                {reservation.guest.firstName} {reservation.guest.lastName} - 
                Room {typeof reservation.room === 'object' ? reservation.room.roomNumber : 'Loading...'} - 
                {new Date(reservation.checkIn).toLocaleDateString()} to {new Date(reservation.checkOut).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {errors.reservation && (
                <p className="mt-1 text-sm text-red-600">{errors.reservation}</p>
              )}
            </div>

            {selectedReservation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Selected Reservation Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Guest:</span>
                    <span className="ml-2 font-medium">
                      {selectedReservation.guest.firstName} {selectedReservation.guest.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedReservation.guest.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Room:</span>
                    <span className="ml-2 font-medium">
                      {typeof selectedReservation.room === 'object' ? selectedReservation.room.roomNumber : 'Loading...'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Stay Period:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedReservation.checkIn).toLocaleDateString()} - {new Date(selectedReservation.checkOut).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Service Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className={`input ${errors.serviceType ? 'border-red-500' : ''}`}
                >
                  <option value="">Select service type...</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.serviceType && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  className={`input ${errors.serviceName ? 'border-red-500' : ''}`}
                  placeholder="Enter service name"
                />
                {errors.serviceName && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceName}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="input"
                placeholder="Describe the service..."
              />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  className={`input ${errors.scheduledDate ? 'border-red-500' : ''}`}
                />
                {errors.scheduledDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Time *
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleInputChange}
                  className={`input ${errors.scheduledTime ? 'border-red-500' : ''}`}
                />
                {errors.scheduledTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  step="15"
                  className={`input ${errors.duration ? 'border-red-500' : ''}`}
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card">
            <div className="flex items-center mb-6">
              <DollarSign className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Service *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`input ${errors.price ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className={`input ${errors.quantity ? 'border-red-500' : ''}`}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>
            </div>

            {/* Total Amount Display */}
            {formData.price > 0 && formData.quantity > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-lg font-bold text-primary-600">
                    ${calculateTotalAmount().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Special Instructions & Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions & Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Any special instructions for the service..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="card bg-red-50 border-red-200">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/bookings"
              className="btn btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Booking
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
