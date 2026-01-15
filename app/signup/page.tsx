"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, AlertCircle } from "lucide-react"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    roll_number: "",
    branch: "",
    year: "",
    role: "student",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Signup failed")
        return
      }

      localStorage.setItem("auth_token", data.token)
      router.push("/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error("Signup error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-background dark:bg-primary-light rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white text-center mb-8">Create Account</h1>

          {error && (
            <div className="bg-error bg-opacity-20 border border-error rounded-lg p-4 mb-6 flex items-center gap-2 text-error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-foreground-light" size={20} />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2 bg-background-dark dark:bg-primary border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white placeholder-foreground-light focus:outline-none focus:border-secondary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">College Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-foreground-light" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@college.edu"
                  className="w-full pl-10 pr-4 py-2 bg-background-dark dark:bg-primary border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white placeholder-foreground-light focus:outline-none focus:border-secondary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-foreground-light" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-background-dark dark:bg-primary border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white placeholder-foreground-light focus:outline-none focus:border-secondary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Roll Number</label>
                <input
                  type="text"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  placeholder="21CS001"
                  className="w-full px-4 py-2 bg-background-dark dark:bg-primary border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white placeholder-foreground-light focus:outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Branch</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="CSE"
                  className="w-full px-4 py-2 bg-background-dark dark:bg-primary border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white placeholder-foreground-light focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background-dark dark:bg-primary border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white focus:outline-none focus:border-secondary"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary-light text-white font-bold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-foreground-light dark:text-foreground-light">
              Already have an account?{" "}
              <Link href="/login" className="text-secondary hover:text-secondary-light font-semibold">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
