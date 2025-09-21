'use client'

import { useState } from 'react'
import { Calendar, Users, Bed, Clock, Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  const stats = [
    { name: 'Total Reservations', value: '1,234', icon: Calendar, change: '+12%', changeType: 'positive' },
    { name: 'Active Bookings', value: '89', icon: Bed, change: '+5%', changeType: 'positive' },
    { name: 'Available Rooms', value: '45', icon: Users, change: '-2%', changeType: 'negative' },
    { name: 'Check-ins Today', value: '23', icon: Clock, change: '+8%', changeType: 'positive' },
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
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
              </div>
            </div>
          ))}
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
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">John Doe</p>
                    <p className="text-sm text-gray-600">Room 101 - Deluxe Suite</p>
                  </div>
                  <div className="text-right">
                    <span className="status-badge status-confirmed">Confirmed</span>
                    <p className="text-sm text-gray-600 mt-1">Dec 15-17, 2023</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/reservations" className="text-primary-600 hover:text-primary-700 font-medium">
                View all reservations →
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Check-ins</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">Jane Smith</p>
                    <p className="text-sm text-gray-600">Room 205 - Standard</p>
                  </div>
                  <div className="text-right">
                    <span className="status-badge status-checked-in">Checked In</span>
                    <p className="text-sm text-gray-600 mt-1">2:30 PM</p>
                  </div>
                </div>
              ))}
            </div>
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
