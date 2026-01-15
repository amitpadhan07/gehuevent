"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import QRScanner from "@/components/qr-scanner"
import { Users, CheckCircle, AlertCircle, BarChart3 } from "lucide-react"

interface Registration {
  id: number
  full_name: string
  email: string
  roll_number: string
  attendance_marked: boolean
  attendance_status?: string
}

interface Analytics {
  total_registrations: number
  attendance_present: number
  attendance_absent: number
  attendance_pending: number
  attendance_percentage: number
  no_show_percentage: number
}

export default function EventManagementPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scanStatus, setScanStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchRegistrations(token)
    fetchAnalytics(token)
  }, [router, eventId])

  const fetchRegistrations = async (token: string) => {
    try {
      const res = await fetch(`/api/chairperson/events/${eventId}/registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch registrations")
      const data = await res.json()
      setRegistrations(data.registrations || [])
    } catch (err) {
      console.error("Registrations fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (token: string) => {
    try {
      const res = await fetch(`/api/chairperson/analytics/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const data = await res.json()
      setAnalytics(data.analytics)
    } catch (err) {
      console.error("Analytics fetch error:", err)
    }
  }

  const handleQRScan = async (qrData: string) => {
    const token = localStorage.getItem("auth_token")
    if (!token) return

    try {
      const res = await fetch("/api/chairperson/attendance/scan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qr_data: qrData, event_id: eventId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setScanStatus({ type: "error", message: data.error || "Scan failed" })
        return
      }

      setScanStatus({ type: "success", message: "Attendance marked!" })

      // Refresh registrations
      fetchRegistrations(token)
      fetchAnalytics(token)

      setTimeout(() => {
        setShowScanner(false)
        setScanStatus(null)
      }, 2000)
    } catch (err) {
      setScanStatus({ type: "error", message: "Error processing scan" })
    }
  }

  if (loading)
    return <div className="min-h-screen bg-background dark:bg-primary flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="text-secondary hover:text-secondary-light mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-foreground dark:text-white">Event Management</h1>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-background-dark dark:bg-primary-light rounded-lg p-6 border border-primary-light dark:border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-light dark:text-foreground-light text-sm">Total Registrations</p>
                  <p className="text-3xl font-bold text-foreground dark:text-white">{analytics.total_registrations}</p>
                </div>
                <Users size={32} className="text-secondary opacity-50" />
              </div>
            </div>

            <div className="bg-background-dark dark:bg-primary-light rounded-lg p-6 border border-primary-light dark:border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-light dark:text-foreground-light text-sm">Attended</p>
                  <p className="text-3xl font-bold text-success">{analytics.attendance_present}</p>
                  <p className="text-sm text-foreground-light dark:text-foreground-light">
                    {analytics.attendance_percentage}%
                  </p>
                </div>
                <CheckCircle size={32} className="text-success opacity-50" />
              </div>
            </div>

            <div className="bg-background-dark dark:bg-primary-light rounded-lg p-6 border border-primary-light dark:border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-light dark:text-foreground-light text-sm">No-shows</p>
                  <p className="text-3xl font-bold text-error">{analytics.attendance_absent}</p>
                  <p className="text-sm text-foreground-light dark:text-foreground-light">
                    {analytics.no_show_percentage}%
                  </p>
                </div>
                <AlertCircle size={32} className="text-error opacity-50" />
              </div>
            </div>

            <div className="bg-background-dark dark:bg-primary-light rounded-lg p-6 border border-primary-light dark:border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground-light dark:text-foreground-light text-sm">Pending</p>
                  <p className="text-3xl font-bold text-warning">{analytics.attendance_pending}</p>
                </div>
                <BarChart3 size={32} className="text-warning opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner & Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner */}
          <div className="lg:col-span-1">
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="w-full bg-secondary hover:bg-secondary-light text-white px-6 py-3 rounded-lg font-semibold transition mb-4"
            >
              {showScanner ? "Close Scanner" : "Scan QR Code"}
            </button>

            {showScanner && (
              <div className="bg-background-dark dark:bg-primary-light rounded-lg border border-primary-light dark:border-primary p-6">
                <QRScanner onScan={handleQRScan} />
                {scanStatus && (
                  <div
                    className={`mt-4 p-3 rounded-lg text-sm font-semibold ${scanStatus.type === "success" ? "bg-success bg-opacity-20 text-success" : "bg-error bg-opacity-20 text-error"}`}
                  >
                    {scanStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Registrations List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Registered Students</h2>
            <div className="bg-background-dark dark:bg-primary-light rounded-lg border border-primary-light dark:border-primary overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary dark:bg-primary border-b border-primary-light dark:border-primary">
                    <tr className="text-white">
                      <th className="px-6 py-3 text-left font-semibold">Name</th>
                      <th className="px-6 py-3 text-left font-semibold">Roll No.</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-light dark:divide-primary">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-primary-light dark:hover:bg-primary transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-foreground dark:text-white">{reg.full_name}</p>
                            <p className="text-sm text-foreground-light dark:text-foreground-light">{reg.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-foreground dark:text-white">{reg.roll_number}</td>
                        <td className="px-6 py-4">
                          {reg.attendance_marked ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-success bg-opacity-20 text-success rounded-full text-sm font-semibold">
                              <CheckCircle size={16} />
                              {reg.attendance_status || "Present"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-warning bg-opacity-20 text-warning rounded-full text-sm font-semibold">
                              <AlertCircle size={16} />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
