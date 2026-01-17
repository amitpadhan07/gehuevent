"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Calendar, Activity, ShieldAlert, LogOut } from "lucide-react"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }

    // Verify user is actually an admin
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role !== "admin") {
          // If not admin, kick them to the regular dashboard
          router.push("/dashboard")
        } else {
          setUser(data.user)
          setLoading(false)
        }
      })
      .catch(() => router.push("/login"))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-primary">
        <div className="text-xl font-semibold animate-pulse">Loading Admin Portal...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-foreground dark:text-white">Admin Portal</h1>
            <p className="text-foreground-light dark:text-foreground-light mt-2">
              System Overview & Control Panel
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-error hover:opacity-90 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* User Management Card */}
          <div className="bg-background-dark dark:bg-primary-light border border-primary-light dark:border-primary p-6 rounded-xl hover:shadow-lg transition cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary bg-opacity-20 rounded-lg text-secondary group-hover:bg-secondary group-hover:text-white transition">
                <Users size={28} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">User Management</h3>
            <p className="text-sm text-foreground-light dark:text-foreground-light mb-4">
              Manage students, chairpersons, and faculty roles.
            </p>
            <span className="text-secondary font-semibold text-sm">View Users &rarr;</span>
          </div>

          {/* Event Oversight Card */}
          <div className="bg-background-dark dark:bg-primary-light border border-primary-light dark:border-primary p-6 rounded-xl hover:shadow-lg transition cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent bg-opacity-20 rounded-lg text-accent group-hover:bg-accent group-hover:text-white transition">
                <Calendar size={28} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">Event Approval</h3>
            <p className="text-sm text-foreground-light dark:text-foreground-light mb-4">
              Review, approve, or reject pending event requests.
            </p>
            <span className="text-accent font-semibold text-sm">Manage Events &rarr;</span>
          </div>

          {/* System Health Card */}
          <div className="bg-background-dark dark:bg-primary-light border border-primary-light dark:border-primary p-6 rounded-xl hover:shadow-lg transition cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-success bg-opacity-20 rounded-lg text-success group-hover:bg-success group-hover:text-white transition">
                <Activity size={28} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">System Logs</h3>
            <p className="text-sm text-foreground-light dark:text-foreground-light mb-4">
              Monitor system performance and audit logs.
            </p>
            <span className="text-success font-semibold text-sm">View Logs &rarr;</span>
          </div>

        </div>
      </div>
    </div>
  )
}