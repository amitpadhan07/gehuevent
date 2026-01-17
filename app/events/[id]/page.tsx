"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Calendar, MapPin, Users, AlertCircle, CheckCircle } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  eventType: string
  startDate: string
  location: string
  maxCapacity: number
  clubName: string
  posterUrl?: string
}

interface Registration {
  id: string
  status: string
  registeredAt: string
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchEventDetails(token)
    checkRegistration(token)
  }, [router, eventId])

  const fetchEventDetails = async (token: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch event")
      const data = await res.json()
      if (data.event) {
        setEvent({
          id: data.event.id,
          title: data.event.title,
          description: data.event.description,
          eventType: data.event.eventType,
          startDate: data.event.startDate,
          location: data.event.venueAddress,
          maxCapacity: data.event.maxCapacity,
          clubName: data.event.clubName,
          posterUrl: data.event.posterUrl,
        })
      }
    } catch (err) {
      console.error("Event fetch error:", err)
      setError("Failed to load event details")
    } finally {
      setLoading(false)
    }
  }

  const checkRegistration = async (token: string) => {
    try {
      const res = await fetch(`/api/students/registrations?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.registrations && data.registrations.length > 0) {
          setRegistration(data.registrations[0])
          setIsRegistered(true)
        }
      }
    } catch (err) {
      console.error("Check registration error:", err)
    }
  }

  const handleRegister = async () => {
    setRegistering(true)
    setError("")
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to register")
      }

      const data = await res.json()
      setRegistration(data.registration)
      setIsRegistered(true)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-primary flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background dark:bg-primary py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-background-dark dark:hover:bg-primary-light rounded-lg transition"
            >
              <ChevronLeft size={20} className="text-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground dark:text-white">Event Not Found</h1>
          </div>
          <Link href="/events" className="text-secondary hover:text-secondary-light">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-background-dark dark:hover:bg-primary-light rounded-lg transition"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-4xl font-bold text-foreground dark:text-white">{event.title}</h1>
        </div>

        {/* Event Details */}
        <div className="bg-background-dark dark:bg-primary-light rounded-lg border border-primary-light dark:border-primary p-8 space-y-6">
          {/* Poster */}
          {event.posterUrl && (
            <div className="rounded-lg overflow-hidden">
              <img src={event.posterUrl} alt={event.title} className="w-full h-auto max-h-96 object-cover" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Status */}
          {isRegistered && (
            <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-600 dark:text-green-400 font-semibold">Registered</p>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Registered on {new Date(registration?.registeredAt || "").toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-secondary flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-foreground-light dark:text-foreground-light">Date & Time</p>
                <p className="text-foreground dark:text-white font-semibold">
                  {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-secondary flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-foreground-light dark:text-foreground-light">Location</p>
                <p className="text-foreground dark:text-white font-semibold">{event.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users size={20} className="text-secondary flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-foreground-light dark:text-foreground-light">Capacity</p>
                <p className="text-foreground dark:text-white font-semibold">{event.maxCapacity} attendees</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-foreground-light dark:text-foreground-light mb-1">Club</p>
              <p className="text-foreground dark:text-white font-semibold">{event.clubName}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">About This Event</h2>
            <p className="text-foreground-light dark:text-foreground-light leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Register Button */}
          {!isRegistered && (
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleRegister}
                disabled={registering}
                className="flex-1 bg-secondary hover:bg-secondary-light disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {registering ? "Registering..." : "Register for Event"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
