"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }

      localStorage.setItem("auth_token", data.token)

      // Route based on role
      if (data.user.role === "chairperson") {
        router.push("/chairperson")
      } else if (data.user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-background dark:bg-primary-light rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white text-center mb-8">Welcome Back</h1>

          {error && (
            <div className="bg-error bg-opacity-20 border border-error rounded-lg p-4 mb-6 flex items-center gap-2 text-error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">College Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-foreground-light" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@college.edu"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-background-dark dark:bg-primary border border-primary-light dark:border-primary rounded-lg text-foreground dark:text-white placeholder-foreground-light focus:outline-none focus:border-secondary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary-light text-white font-bold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-foreground-light dark:text-foreground-light">
              Don't have an account?{" "}
              <Link href="/signup" className="text-secondary hover:text-secondary-light font-semibold">
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-primary-light dark:border-primary">
            <p className="text-xs text-foreground-light dark:text-foreground-light text-center">
              Demo Credentials:
              <br />
              Email: student@college.edu
              <br />
              Password: password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
