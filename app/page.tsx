"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Calendar, Users, Zap } from "lucide-react"
import EventCard from "@/components/event-card"

interface Event {
  id: number
  title: string
  poster_url: string
  club_name: string
  event_date: string
  registered_count: number
}

export default function HomePage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total_events: 0, active_clubs: 0, registered_students: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await fetch("/api/events?limit=6&sort=upcoming")
        const eventsData = await eventsRes.json()
        setUpcomingEvents(eventsData.events || [])

        // Mock stats - would come from API in production
        setStats({
          total_events: 24,
          active_clubs: 18,
          registered_students: 342,
        })
      } catch (error) {
        console.error("Failed to fetch events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary-light text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Discover, Register & Attend College Events</h1>
            <p className="text-lg md:text-xl text-foreground-light max-w-2xl mx-auto">
              Connect with your community through amazing events. Find seminars, workshops, hackathons, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-light text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Explore Events
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/clubs"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-foreground-light text-primary px-8 py-3 rounded-lg font-semibold transition"
              >
                Browse Clubs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-background-dark dark:bg-primary text-foreground dark:text-white p-8 rounded-lg text-center">
            <Calendar size={40} className="mx-auto mb-4 text-secondary" />
            <h3 className="text-3xl font-bold mb-2">{stats.total_events}+</h3>
            <p className="text-foreground-light dark:text-foreground-light">Events This Semester</p>
          </div>
          <div className="bg-background-dark dark:bg-primary text-foreground dark:text-white p-8 rounded-lg text-center">
            <Users size={40} className="mx-auto mb-4 text-accent" />
            <h3 className="text-3xl font-bold mb-2">{stats.active_clubs}</h3>
            <p className="text-foreground-light dark:text-foreground-light">Active Clubs</p>
          </div>
          <div className="bg-background-dark dark:bg-primary text-foreground dark:text-white p-8 rounded-lg text-center">
            <Zap size={40} className="mx-auto mb-4 text-success" />
            <h3 className="text-3xl font-bold mb-2">{stats.registered_students}+</h3>
            <p className="text-foreground-light dark:text-foreground-light">Registered Students</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Upcoming Events</h2>
          <Link
            href="/events"
            className="text-secondary hover:text-secondary-light font-semibold flex items-center gap-2"
          >
            View All <ArrowRight size={20} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-background-dark dark:bg-primary rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-background-dark dark:bg-primary py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Use Event Portal?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Registration</h3>
              <p className="text-foreground-light">Register for events in seconds with our streamlined process.</p>
            </div>
            <div className="text-center">
              <div className="bg-accent text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-foreground-light">Stay updated with instant notifications and reminders.</p>
            </div>
            <div className="text-center">
              <div className="bg-success text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Network</h3>
              <p className="text-foreground-light">Meet students and clubs with similar interests.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
