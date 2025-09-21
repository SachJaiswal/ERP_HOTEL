import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface Room {
  _id: string
  roomNumber: string
  roomType: string
  capacity: number
  pricePerNight: number
  amenities: string[]
  status: 'Available' | 'Occupied' | 'Maintenance' | 'Out of Order'
  floor: number
  description?: string
  images?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Guest {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  idType?: 'Passport' | 'Driver License' | 'National ID' | 'Other'
  idNumber?: string
}

export interface Reservation {
  _id: string
  reservationNumber: string
  guest: Guest
  room: Room | string
  checkIn: string
  checkOut: string
  numberOfGuests: number
  numberOfNights: number
  totalAmount: number
  status: 'Pending' | 'Confirmed' | 'Checked In' | 'Checked Out' | 'Cancelled' | 'No Show'
  paymentStatus: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded'
  paymentMethod?: string
  specialRequests?: string
  notes?: string
  createdBy?: string
  lastModifiedBy?: string
  createdAt: string
  updatedAt: string
}

export interface Booking {
  _id: string
  bookingNumber: string
  reservation: Reservation | string
  serviceType: 'Room Service' | 'Spa' | 'Restaurant' | 'Conference Room' | 'Event Hall' | 'Transportation' | 'Tour' | 'Other'
  serviceName: string
  description?: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  price: number
  quantity: number
  totalAmount: number
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show'
  paymentStatus: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded'
  assignedStaff?: string
  specialInstructions?: string
  notes?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// API Functions

// Reservations
export const reservationApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
    roomType?: string
    checkIn?: string
    checkOut?: string
    guestEmail?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    const response = await api.get('/reservations', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/reservations/${id}`)
    return response.data
  },

  create: async (data: Partial<Reservation>) => {
    const response = await api.post('/reservations', data)
    return response.data
  },

  update: async (id: string, data: Partial<Reservation>) => {
    const response = await api.put(`/reservations/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/reservations/${id}/status`, { status })
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/reservations/${id}`)
    return response.data
  },

  checkAvailability: async (room: string, checkIn: string, checkOut: string) => {
    const response = await api.get('/reservations/availability/check', {
      params: { room, checkIn, checkOut }
    })
    return response.data
  }
}

// Bookings
export const bookingApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
    serviceType?: string
    scheduledDate?: string
    reservation?: string
    assignedStaff?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    const response = await api.get('/bookings', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },

  create: async (data: Partial<Booking>) => {
    const response = await api.post('/bookings', data)
    return response.data
  },

  update: async (id: string, data: Partial<Booking>) => {
    const response = await api.put(`/bookings/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/bookings/${id}/status`, { status })
    return response.data
  },

  assignStaff: async (id: string, staffId: string) => {
    const response = await api.patch(`/bookings/${id}/assign`, { assignedStaff: staffId })
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/bookings/${id}`)
    return response.data
  },

  getByReservation: async (reservationId: string) => {
    const response = await api.get(`/bookings/reservation/${reservationId}`)
    return response.data
  },

  getByStaff: async (staffId: string, date?: string) => {
    const response = await api.get(`/bookings/staff/${staffId}`, {
      params: date ? { date } : {}
    })
    return response.data
  }
}

// Rooms
export const roomApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    roomType?: string
    status?: string
    floor?: number
    minPrice?: number
    maxPrice?: number
    amenities?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    const response = await api.get('/rooms', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/rooms/${id}`)
    return response.data
  },

  create: async (data: Partial<Room>) => {
    const response = await api.post('/rooms', data)
    return response.data
  },

  update: async (id: string, data: Partial<Room>) => {
    const response = await api.put(`/rooms/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/rooms/${id}/status`, { status })
    return response.data
  },

  delete: async (id: string) => {
    const response = await api.delete(`/rooms/${id}`)
    return response.data
  },

  getAvailable: async (checkIn: string, checkOut: string, roomType?: string, capacity?: number) => {
    const response = await api.get('/rooms/available', {
      params: { checkIn, checkOut, roomType, capacity }
    })
    return response.data
  },

  getTypes: async () => {
    const response = await api.get('/rooms/types')
    return response.data
  },

  getStatus: async () => {
    const response = await api.get('/rooms/status')
    return response.data
  }
}

export default api
