'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Bed, Wifi, Tv, Coffee, Car, Home, Shield, Wind, Utensils } from 'lucide-react'
import { roomApi } from '@/lib/api'

export default function NewRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'Standard',
    capacity: 1,
    pricePerNight: 0,
    amenities: [] as string[],
    floor: 1,
    description: '',
    status: 'Available'
  })
  const [errors, setErrors] = useState<any>({})

  const availableAmenities = [
    { id: 'WiFi', label: 'WiFi', icon: Wifi },
    { id: 'TV', label: 'TV', icon: Tv },
    { id: 'Mini Bar', label: 'Mini Bar', icon: Coffee },
    { id: 'Balcony', label: 'Balcony', icon: Home },
    { id: 'Ocean View', label: 'Ocean View', icon: Home },
    { id: 'City View', label: 'City View', icon: Home },
    { id: 'Air Conditioning', label: 'Air Conditioning', icon: Wind },
    { id: 'Room Service', label: 'Room Service', icon: Utensils },
    { id: 'Safe', label: 'Safe', icon: Shield },
    { id: 'Jacuzzi', label: 'Jacuzzi', icon: Car }
  ]

  const roomTypes = [
    'Standard',
    'Deluxe',
    'Suite',
    'Executive',
    'Presidential'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'pricePerNight' || name === 'floor' ? 
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

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }))
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.roomNumber.trim()) newErrors.roomNumber = 'Room number is required'
    if (!formData.roomType) newErrors.roomType = 'Room type is required'
    if (formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1'
    if (formData.pricePerNight <= 0) newErrors.pricePerNight = 'Price must be greater than 0'
    if (formData.floor < 1) newErrors.floor = 'Floor must be at least 1'

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
      
      // Create room
      const room = await roomApi.create(formData)
      
      // Redirect to rooms list
      router.push('/rooms')
    } catch (error: any) {
      console.error('Error creating room:', error)
      if (error.response?.data?.errors) {
        const apiErrors: any = {}
        error.response.data.errors.forEach((err: any) => {
          apiErrors[err.path] = err.msg
        })
        setErrors(apiErrors)
      } else {
        setErrors({ general: 'Failed to create room. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Add New Room</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Bed className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  className={`input ${errors.roomNumber ? 'border-red-500' : ''}`}
                  placeholder="e.g., 101, 201A, Suite 1"
                />
                {errors.roomNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.roomNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type *
                </label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleInputChange}
                  className={`input ${errors.roomType ? 'border-red-500' : ''}`}
                >
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.roomType && (
                  <p className="mt-1 text-sm text-red-600">{errors.roomType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <select
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`input ${errors.capacity ? 'border-red-500' : ''}`}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor *
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  min="1"
                  className={`input ${errors.floor ? 'border-red-500' : ''}`}
                />
                {errors.floor && (
                  <p className="mt-1 text-sm text-red-600">{errors.floor}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Bed className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Night *
                </label>
                <input
                  type="number"
                  name="pricePerNight"
                  value={formData.pricePerNight}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`input ${errors.pricePerNight ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
                {errors.pricePerNight && (
                  <p className="mt-1 text-sm text-red-600">{errors.pricePerNight}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Out of Order">Out of Order</option>
                </select>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Wifi className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {availableAmenities.map(amenity => {
                const Icon = amenity.icon
                const isSelected = formData.amenities.includes(amenity.id)
                
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </button>
                )
              })}
            </div>

            {formData.amenities.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map(amenityId => {
                    const amenity = availableAmenities.find(a => a.id === amenityId)
                    return (
                      <span
                        key={amenityId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {amenity?.label}
                        <button
                          type="button"
                          onClick={() => handleAmenityToggle(amenityId)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Describe the room features, view, and any special characteristics..."
              />
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
              href="/rooms"
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
                  Create Room
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
