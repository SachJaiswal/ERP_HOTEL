'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Bed, Clock, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { reservationApi, bookingApi, roomApi, Reservation, Booking, Room } from '@/lib/api'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalReservations: 0,
    activeBookings: 0,
    availableRooms: 0,
    checkInsToday: 0
  })
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [todaysCheckIns, setTodaysCheckIns] = useState<Reservation[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [reservationsResponse, bookingsResponse, roomsResponse] = await Promise.all([
        reservationApi.getAll({ limit: 1000 }), // Get all reservations for stats
        bookingApi.getAll({ limit: 1000 }), // Get all bookings for stats
        roomApi.getAll({ limit: 1000 }) // Get all rooms for stats
      ])

      const reservations = reservationsResponse.reservations || []
      const bookings = bookingsResponse.bookings || []
      const rooms = roomsResponse.rooms || []

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const checkInsToday = reservations.filter(res => {
        const checkInDate = new Date(res.checkIn)
        checkInDate.setHours(0, 0, 0, 0)
        return checkInDate.getTime() === today.getTime() && res.status === 'Checked In'
      })

      const availableRooms = rooms.filter(room => room.status === 'Available')
      const activeBookings = bookings.filter(booking => 
        ['Scheduled', 'Confirmed', 'In Progress'].includes(booking.status)
      )

      setStats({
        totalReservations: reservations.length,
        activeBookings: activeBookings.length,
        availableRooms: availableRooms.length,
        checkInsToday: checkInsToday.length
      })

      // Get recent reservations (last 4)
      const recentRes = await reservationApi.getAll({ 
        limit: 4, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      })
      setRecentReservations(recentRes.reservations || [])

      // Get today's check-ins
      const checkInsRes = await reservationApi.getAll({ 
        status: 'Checked In',
        limit: 3,
        sortBy: 'checkIn',
        sortOrder: 'asc'
      })
      setTodaysCheckIns(checkInsRes.reservations || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    { 
      name: 'Total Reservations', 
      value: stats.totalReservations.toLocaleString(), 
      icon: Calendar, 
      change: '', 
      changeType: 'neutral' 
    },
    { 
      name: 'Active Bookings', 
      value: stats.activeBookings.toLocaleString(), 
      icon: Bed, 
      change: '', 
      changeType: 'neutral' 
    },
    { 
      name: 'Available Rooms', 
      value: stats.availableRooms.toLocaleString(), 
      icon: Users, 
      change: '', 
      changeType: 'neutral' 
    },
    { 
      name: 'Check-ins Today', 
      value: stats.checkInsToday.toLocaleString(), 
      icon: Clock, 
      change: '', 
      changeType: 'neutral' 
    },
  ]

  const quickActions = [
    { name: 'New Reservation', href: '/reservations/new', icon: Plus, color: 'bg-primary-600' },
    { name: 'Room Management', href: '/rooms', icon: Bed, color: 'bg-green-600' },
    { name: 'Booking Services', href: '/bookings', icon: Calendar, color: 'bg-purple-600' },
    { name: 'Search Reservations', href: '/reservations', icon: Search, color: 'bg-orange-600' },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ERP Reservation System</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/reservations" className="text-gray-600 hover:text-gray-900 font-medium">
                Reservations
              </Link>
              <Link href="/bookings" className="text-gray-600 hover:text-gray-900 font-medium">
                Bookings
              </Link>
              <Link href="/rooms" className="text-gray-600 hover:text-gray-900 font-medium">
                Rooms
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search reservations, guests, or rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <div className="animate-pulse">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-300 rounded"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            statsData.map((stat) => (
              <div key={stat.name} className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'}`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="card hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">{action.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reservations</h2>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-32"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-6 bg-gray-300 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentReservations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reservations found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReservations.map((reservation) => (
                  <div key={reservation._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.guest.firstName} {reservation.guest.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Room {typeof reservation.room === 'object' ? reservation.room.roomNumber : 'Loading...'} - 
                        {typeof reservation.room === 'object' ? reservation.room.roomType : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`status-badge ${
                        reservation.status === 'Confirmed' ? 'status-confirmed' :
                        reservation.status === 'Checked In' ? 'status-checked-in' :
                        reservation.status === 'Pending' ? 'status-pending' :
                        reservation.status === 'Checked Out' ? 'status-checked-out' :
                        reservation.status === 'Cancelled' ? 'status-cancelled' :
                        'status-no-show'
                      }`}>
                        {reservation.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(reservation.checkIn).toLocaleDateString()} - {new Date(reservation.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/reservations" className="text-primary-600 hover:text-primary-700 font-medium">
                View all reservations →
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Check-ins</h2>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-32"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-6 bg-gray-300 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todaysCheckIns.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No check-ins today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysCheckIns.map((reservation) => (
                  <div key={reservation._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.guest.firstName} {reservation.guest.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Room {typeof reservation.room === 'object' ? reservation.room.roomNumber : 'Loading...'} - 
                        {typeof reservation.room === 'object' ? reservation.room.roomType : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="status-badge status-checked-in">Checked In</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(reservation.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/reservations?status=Checked In" className="text-primary-600 hover:text-primary-700 font-medium">
                View all check-ins →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
