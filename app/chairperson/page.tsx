"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, CheckCircle, AlertCircle, Plus } from "lucide-react"

interface Event {
  id: number
  title: string
  event_date: string
  registered_count: number
  attended_count: number
}

export default function ChairpersonDashboard() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchUserData(token)
    fetchEvents(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch user")
      const data = await res.json()
      setUser(data.user)
    } catch (err) {
      console.error("User fetch error:", err)
    }
  }

  const fetchEvents = async (token: string) => {
    try {
      const res = await fetch("/api/chairperson/events", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch events")
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error("Events fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-background dark:bg-primary flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )

  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground dark:text-white">Chairperson Dashboard</h1>
            {user && (
              <p className="text-foreground-light dark:text-foreground-light">Manage events and track attendance</p>
            )}
          </div>
          <Link
            href="/chairperson/create-event"
            className="flex items-center gap-2 bg-secondary hover:bg-secondary-light text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <Plus size={20} />
            Create Event
          </Link>
        </div>

        {/* Events */}
        <div className="space-y-6">
          {events.length === 0 ? (
            <div className="text-center py-12 bg-background-dark dark:bg-primary-light rounded-lg border border-primary-light dark:border-primary">
              <AlertCircle size={48} className="mx-auto mb-4 text-foreground-light opacity-50" />
              <p className="text-foreground-light dark:text-foreground-light mb-4">No events created yet</p>
              <Link
                href="/chairperson/create-event"
                className="inline-block bg-secondary hover:bg-secondary-light text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Create Your First Event
              </Link>
            </div>
          ) : (
            events.map((event) => (
              <Link key={event.id} href={`/chairperson/events/${event.id}`}>
                <div className="bg-background-dark dark:bg-primary-light rounded-lg border border-primary-light dark:border-primary p-6 hover:shadow-lg transition cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">{event.title}</h3>
                      <p className="text-foreground-light dark:text-foreground-light text-sm">
                        {new Date(event.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })} at {new Date(event.event_date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>

                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-secondary dark:text-secondary-light mb-1">
                          <Users size={20} />
                          <span className="font-bold">{event.registered_count}</span>
                        </div>
                        <p className="text-sm text-foreground-light dark:text-foreground-light">Registered</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-success mb-1">
                          <CheckCircle size={20} />
                          <span className="font-bold">{event.attended_count}</span>
                        </div>
                        <p className="text-sm text-foreground-light dark:text-foreground-light">Attended</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
