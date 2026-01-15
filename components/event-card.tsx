"use client"

import Link from "next/link"
import { Calendar, Users } from "lucide-react"

interface Event {
  id: number
  title: string
  poster_url?: string
  club_name: string
  event_date: string
  registered_count: number
}

export default function EventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-background dark:bg-primary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer transform hover:-translate-y-1">
        <div className="w-full h-48 bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center">
          {event.poster_url ? (
            <img
              src={event.poster_url || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-center">
              <Calendar size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">No Image</p>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg line-clamp-2 text-foreground dark:text-white">{event.title}</h3>

          <p className="text-sm text-secondary dark:text-secondary-light font-semibold">{event.club_name}</p>

          <div className="space-y-2 text-sm text-foreground-light dark:text-foreground-light">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              {formattedDate}
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              {event.registered_count} registered
            </div>
          </div>

          <button className="w-full mt-4 bg-secondary hover:bg-secondary-light text-white font-semibold py-2 rounded-lg transition">
            Register Now
          </button>
        </div>
      </div>
    </Link>
  )
}
