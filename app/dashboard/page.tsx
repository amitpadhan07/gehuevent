"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Users, CheckCircle, AlertCircle, X } from "lucide-react"

interface Registration {
  id: number
  event_id: number
  title: string
  club_name: string
  event_date: string
  attendance_status?: string
  attendance_marked: boolean
  qr_code_data?: string
}

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchUserData(token)
    fetchRegistrations(token)
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
      setError("Failed to load user data")
    }
  }

  const fetchRegistrations = async (token: string) => {
    try {
      const res = await fetch("/api/students/registrations", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to fetch registrations")

      const data = await res.json()
      setRegistrations(data.registrations || [])
    } catch (err) {
      console.error("Registrations fetch error:", err)
      setError("Failed to load registrations")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRegistration = async (registrationId: number) => {
    const token = localStorage.getItem("auth_token")
    if (!token) return

    try {
      const res = await fetch(`/api/students/registrations/${registrationId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to cancel registration")

      setRegistrations(registrations.filter((r) => r.id !== registrationId))
    } catch (err) {
      console.error("Cancel error:", err)
      alert("Failed to cancel registration")
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-background dark:bg-primary flex items-center justify-center">
        <div className="text-xl font-semibold text-foreground-light">Loading...</div>
      </div>
    )

  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground dark:text-white mb-2">Student Dashboard</h1>
          {user && (
            <p className="text-foreground-light dark:text-foreground-light">
              Welcome back, <span className="font-semibold">{user.full_name}</span>!
            </p>
          )}
        </div>

        {error && (
          <div className="bg-error bg-opacity-20 border border-error rounded-lg p-4 mb-6 text-error">{error}</div>
        )}

        {/* Stats */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-background-dark dark:bg-primary-light rounded-lg p-6 border border-primary-light dark:border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-light dark:text-foreground-light text-sm">Email</p>
                  <p className="font-semibold text-foreground dark:text-white">{user.email}</p>
                </div>
                <Users size={32} className="text-secondary opacity-50" />
              </div>
            </div>

            <div className="bg-background-dark dark:bg-primary-light rounded-lg p-6 border border-primary-light dark:border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-light dark:text-foreground-light text-sm">Roll Number</p>
                  <p className="font-semibold text-foreground dark:text-white">{user.roll_number || "N/A"}</p>
                </div>
                <Calendar size={32} className="text-accent opacity-50" />
              </div>
            </div>

            <div className="bg-background-dark dark:bg-primary-light rounded-lg p-6 border border-primary-light dark:border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-light dark:text-foreground-light text-sm">Registrations</p>
                  <p className="font-semibold text-foreground dark:text-white">{registrations.length}</p>
                </div>
                <CheckCircle size={32} className="text-success opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Registered Events */}
        <div className="bg-background-dark dark:bg-primary-light rounded-lg border border-primary-light dark:border-primary p-8">
          <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">My Registered Events</h2>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-foreground-light opacity-50" />
              <p className="text-foreground-light dark:text-foreground-light mb-4">No registered events yet.</p>
              <a
                href="/events"
                className="inline-block bg-secondary hover:bg-secondary-light text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Browse Events
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-background dark:bg-primary rounded-lg border border-primary-light dark:border-primary hover:shadow-lg transition"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground dark:text-white">{reg.title}</h3>
                    <p className="text-secondary dark:text-secondary-light text-sm font-semibold mb-2">
                      {reg.club_name}
                    </p>
                    <div className="flex flex-col gap-1 text-sm text-foreground-light dark:text-foreground-light">
                      <p className="flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(reg.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    {reg.attendance_marked ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-success bg-opacity-20 rounded-lg border border-success">
                        <CheckCircle size={20} className="text-success" />
                        <span className="font-semibold text-success">{reg.attendance_status || "Attended"}</span>
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-warning bg-opacity-20 rounded-lg border border-warning">
                        <span className="font-semibold text-warning">Pending</span>
                      </div>
                    )}

                    {reg.qr_code_data && (
                      <a
                        href={reg.qr_code_data}
                        download={`event-${reg.event_id}-qr.png`}
                        className="px-4 py-2 bg-secondary hover:bg-secondary-light text-white rounded-lg font-semibold transition"
                      >
                        Download QR
                      </a>
                    )}

                    <button
                      onClick={() => handleCancelRegistration(reg.id)}
                      className="px-4 py-2 bg-error hover:opacity-90 text-white rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
