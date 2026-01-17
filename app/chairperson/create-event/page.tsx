"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, AlertCircle } from "lucide-react"

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    eventTime: "",
    location: "",
    capacity: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }

    verifyChairperson(token)
  }, [router])

  const verifyChairperson = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to verify user")
      const data = await res.json()
      if (data.user.role !== "chairperson") {
        router.push("/dashboard")
        return
      }
    } catch (err) {
      console.error("Verification error:", err)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }

      const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime}`)

      const res = await fetch("/api/chairperson/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          eventDate: eventDateTime,
          location: formData.location,
          capacity: parseInt(formData.capacity),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create event")
      }

      const data = await res.json()
      router.push("/chairperson/events/" + data.event.id)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-primary flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/chairperson"
            className="p-2 hover:bg-background-dark dark:hover:bg-primary-light rounded-lg transition"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </Link>
          <h1 className="text-4xl font-bold text-foreground dark:text-white">Create Event</h1>
        </div>

        {/* Form */}
        <div className="bg-background-dark dark:bg-primary-light rounded-lg border border-primary-light dark:border-primary p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                Event Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-background dark:bg-primary rounded-lg border border-primary-light dark:border-primary-dark text-foreground dark:text-white placeholder-foreground-light dark:placeholder-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter event title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 bg-background dark:bg-primary rounded-lg border border-primary-light dark:border-primary-dark text-foreground dark:text-white placeholder-foreground-light dark:placeholder-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter event description"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Event Date *
                </label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-background dark:bg-primary rounded-lg border border-primary-light dark:border-primary-dark text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label htmlFor="eventTime" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Event Time *
                </label>
                <input
                  id="eventTime"
                  name="eventTime"
                  type="time"
                  value={formData.eventTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-background dark:bg-primary rounded-lg border border-primary-light dark:border-primary-dark text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                Location *
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-background dark:bg-primary rounded-lg border border-primary-light dark:border-primary-dark text-foreground dark:text-white placeholder-foreground-light dark:placeholder-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter event location"
              />
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                Capacity *
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 bg-background dark:bg-primary rounded-lg border border-primary-light dark:border-primary-dark text-foreground dark:text-white placeholder-foreground-light dark:placeholder-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter maximum capacity"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-secondary hover:bg-secondary-light disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {submitting ? "Creating..." : "Create Event"}
              </button>
              <Link
                href="/chairperson"
                className="flex-1 bg-background-light hover:bg-background-darker dark:bg-primary-dark dark:hover:bg-primary-light text-foreground dark:text-white px-6 py-3 rounded-lg font-semibold transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
