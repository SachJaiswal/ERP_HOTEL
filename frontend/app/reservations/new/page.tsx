'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Calendar, User, Bed, DollarSign } from 'lucide-react'
import { reservationApi, roomApi, Room } from '@/lib/api'

export default function NewReservationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    guest: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    room: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
    specialRequests: '',
    notes: ''
  })
  const [errors, setErrors] = useState<any>({})

  useEffect(() => {
    fetchAvailableRooms()
  }, [])

  const fetchAvailableRooms = async () => {
    try {
      const response = await roomApi.getAll({ status: 'Available' })
      setRooms(response.rooms || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name.startsWith('guest.address.')) {
      const addressField = name.split('.')[2]
      setFormData(prev => ({
        ...prev,
        guest: {
          ...prev.guest,
          address: {
            ...prev.guest.address,
            [addressField]: value
          }
        }
      }))
    } else if (name.startsWith('guest.')) {
      const guestField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        guest: {
          ...prev.guest,
          [guestField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r._id === roomId)
    setSelectedRoom(room || null)
    setFormData(prev => ({
      ...prev,
      room: roomId
    }))
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.guest.firstName.trim()) newErrors['guest.firstName'] = 'First name is required'
    if (!formData.guest.lastName.trim()) newErrors['guest.lastName'] = 'Last name is required'
    if (!formData.guest.email.trim()) newErrors['guest.email'] = 'Email is required'
    if (!formData.guest.phone.trim()) newErrors['guest.phone'] = 'Phone is required'
    if (!formData.room) newErrors.room = 'Room selection is required'
    if (!formData.checkIn) newErrors.checkIn = 'Check-in date is required'
    if (!formData.checkOut) newErrors.checkOut = 'Check-out date is required'
    if (formData.numberOfGuests < 1) newErrors.numberOfGuests = 'Number of guests must be at least 1'

    // Validate dates
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn)
      const checkOutDate = new Date(formData.checkOut)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (checkInDate < today) {
        newErrors.checkIn = 'Check-in date cannot be in the past'
      }
      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = 'Check-out date must be after check-in date'
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
      
      // Check room availability
      const availability = await reservationApi.checkAvailability(
        formData.room,
        formData.checkIn,
        formData.checkOut
      )

      if (!availability.available) {
        setErrors({ room: 'Room is not available for the selected dates' })
        return
      }

      // Create reservation
      const reservation = await reservationApi.create(formData)
      
      // Redirect to reservations list
      router.push('/reservations')
    } catch (error: any) {
      console.error('Error creating reservation:', error)
      if (error.response?.data?.errors) {
        const apiErrors: any = {}
        error.response.data.errors.forEach((err: any) => {
          apiErrors[err.path] = err.msg
        })
        setErrors(apiErrors)
      } else {
        setErrors({ general: 'Failed to create reservation. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalAmount = () => {
    if (selectedRoom && formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn)
      const checkOutDate = new Date(formData.checkOut)
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime()
      const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24))
      return selectedRoom.pricePerNight * numberOfNights
    }
    return 0
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
              <h1 className="text-2xl font-bold text-gray-900">New Reservation</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Guest Information */}
          <div className="card">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Guest Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="guest.firstName"
                  value={formData.guest.firstName}
                  onChange={handleInputChange}
                  className={`input ${errors['guest.firstName'] ? 'border-red-500' : ''}`}
                  placeholder="Enter first name"
                />
                {errors['guest.firstName'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['guest.firstName']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="guest.lastName"
                  value={formData.guest.lastName}
                  onChange={handleInputChange}
                  className={`input ${errors['guest.lastName'] ? 'border-red-500' : ''}`}
                  placeholder="Enter last name"
                />
                {errors['guest.lastName'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['guest.lastName']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="guest.email"
                  value={formData.guest.email}
                  onChange={handleInputChange}
                  className={`input ${errors['guest.email'] ? 'border-red-500' : ''}`}
                  placeholder="Enter email address"
                />
                {errors['guest.email'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['guest.email']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="guest.phone"
                  value={formData.guest.phone}
                  onChange={handleInputChange}
                  className={`input ${errors['guest.phone'] ? 'border-red-500' : ''}`}
                  placeholder="Enter phone number"
                />
                {errors['guest.phone'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['guest.phone']}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Address (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="guest.address.street"
                    value={formData.guest.address.street}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="guest.address.city"
                    value={formData.guest.address.city}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="guest.address.state"
                    value={formData.guest.address.state}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="guest.address.zipCode"
                    value={formData.guest.address.zipCode}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter ZIP code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="guest.address.country"
                    value={formData.guest.address.country}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter country"
                  />
                </div>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  className={`input ${errors.checkIn ? 'border-red-500' : ''}`}
                />
                {errors.checkIn && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  className={`input ${errors.checkOut ? 'border-red-500' : ''}`}
                />
                {errors.checkOut && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests *
                </label>
                <select
                  name="numberOfGuests"
                  value={formData.numberOfGuests}
                  onChange={handleInputChange}
                  className={`input ${errors.numberOfGuests ? 'border-red-500' : ''}`}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
                {errors.numberOfGuests && (
                  <p className="mt-1 text-sm text-red-600">{errors.numberOfGuests}</p>
                )}
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Bed className="h-6 w-6 text-primary-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Room Selection</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Room *
              </label>
              <select
                name="room"
                value={formData.room}
                onChange={(e) => handleRoomSelect(e.target.value)}
                className={`input ${errors.room ? 'border-red-500' : ''}`}
              >
                <option value="">Choose a room...</option>
                {rooms.map(room => (
                  <option key={room._id} value={room._id}>
                    Room {room.roomNumber} - {room.roomType} (${room.pricePerNight}/night)
                  </option>
                ))}
              </select>
              {errors.room && (
                <p className="mt-1 text-sm text-red-600">{errors.room}</p>
              )}
            </div>

            {selectedRoom && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Selected Room Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Room Number:</span>
                    <span className="ml-2 font-medium">{selectedRoom.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{selectedRoom.roomType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Capacity:</span>
                    <span className="ml-2 font-medium">{selectedRoom.capacity} guests</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price per night:</span>
                    <span className="ml-2 font-medium">${selectedRoom.pricePerNight}</span>
                  </div>
                </div>
                {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-600 text-sm">Amenities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRoom.amenities.map(amenity => (
                        <span key={amenity} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          {selectedRoom && formData.checkIn && formData.checkOut && (
            <div className="card">
              <div className="flex items-center mb-6">
                <DollarSign className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Pricing Summary</h2>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Room rate per night:</span>
                  <span className="font-medium">${selectedRoom.pricePerNight}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Number of nights:</span>
                  <span className="font-medium">
                    {formData.checkIn && formData.checkOut ? 
                      Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 3600 * 24)) : 0
                    }
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-lg font-bold text-primary-600">${calculateTotalAmount()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Special Requests */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Requests & Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Any special requests or preferences..."
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
              href="/reservations"
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
                  Create Reservation
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
