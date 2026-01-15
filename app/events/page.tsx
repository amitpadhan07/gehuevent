"use client"

import { useEffect, useState } from "react"
import { Search, Filter } from "lucide-react"
import EventCard from "@/components/event-card"

interface Event {
  id: number
  title: string
  poster_url?: string
  club_name: string
  event_date: string
  registered_count: number
  event_type?: string
}

interface Club {
  id: number
  name: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClub, setSelectedClub] = useState<string>("")
  const [sortBy, setSortBy] = useState("upcoming")

  useEffect(() => {
    fetchClubs()
    fetchEvents()
  }, [])

  const fetchClubs = async () => {
    try {
      const res = await fetch("/api/clubs")
      const data = await res.json()
      setClubs(data.clubs || [])
    } catch (error) {
      console.error("Failed to fetch clubs:", error)
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedClub) params.append("clubId", selectedClub)
      params.append("sort", sortBy)

      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedClub, sortBy])

  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground dark:text-white mb-4">Discover Events</h1>
          <p className="text-foreground-light dark:text-foreground-light">
            Find and register for amazing events happening on campus.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-foreground-light" size={20} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-dark dark:bg-primary-light border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white placeholder-foreground-light focus:outline-none focus:border-secondary"
              />
            </div>

            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="px-4 py-2 bg-background-dark dark:bg-primary-light border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white focus:outline-none focus:border-secondary"
            >
              <option value="">All Clubs</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-background-dark dark:bg-primary-light border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white focus:outline-none focus:border-secondary"
            >
              <option value="upcoming">Upcoming</option>
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-background-dark dark:bg-primary rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Filter size={48} className="mx-auto mb-4 text-foreground-light opacity-50" />
            <p className="text-foreground-light dark:text-foreground-light">
              No events found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
