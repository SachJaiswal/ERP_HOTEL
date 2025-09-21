'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Calendar, Clock, DollarSign } from 'lucide-react'
import { bookingApi, Booking } from '@/lib/api'

export default function EditBookingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState({
    serviceType: '',
    serviceName: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    price: 0,
    quantity: 1,
    status: 'Scheduled',
    paymentStatus: 'Pending',
    specialInstructions: '',
    notes: ''
  })
  const [errors, setErrors] = useState<any>({})

  useEffect(() => {
    if (params.id) {
      fetchBooking()
    }
  }, [params.id])

  const fetchBooking = async () => {
    try {
      setInitialLoading(true)
      const booking = await bookingApi.getById(params.id as string)
      
      // Populate form with existing data
      setFormData({
        serviceType: booking.serviceType,
        serviceName: booking.serviceName,
        description: booking.description || '',
        scheduledDate: new Date(booking.scheduledDate).toISOString().split('T')[0],
        scheduledTime: booking.scheduledTime,
        duration: booking.duration,
        price: booking.price,
        quantity: booking.quantity,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialInstructions: booking.specialInstructions || '',
        notes: booking.notes || ''
      })
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setInitialLoading(false)
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

  const validateForm = () => {
    const newErrors: any = {}

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
      
      // Update booking
      await bookingApi.update(params.id as string, formData)
      
      // Redirect to booking details
      router.push(`/bookings/${params.id}`)
    } catch (error: any) {
      console.error('Error updating booking:', error)
      if (error.response?.data?.errors) {
        const apiErrors: any = {}
        error.response.data.errors.forEach((err: any) => {
          apiErrors[err.path] = err.msg
        })
        setErrors(apiErrors)
      } else {
        setErrors({ general: 'Failed to update booking. Please try again.' })
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading booking...</p>
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
              <Link href={`/bookings/${params.id}`} className="text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Booking</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Status & Payment */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Payment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>
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
              href={`/bookings/${params.id}`}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Booking
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
