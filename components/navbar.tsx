"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setToken(localStorage.getItem("auth_token"))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    setToken(null)
    router.push("/")
  }

  return (
    <nav className="sticky top-0 z-50 bg-primary dark:bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold">EP</div>
            <span className="hidden sm:inline">Event Portal</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/events" className="hover:text-secondary-light transition">
              Events
            </Link>
            <Link href="/clubs" className="hover:text-secondary-light transition">
              Clubs
            </Link>
            <Link href="/about" className="hover:text-secondary-light transition">
              About
            </Link>
            <Link href="/contact" className="hover:text-secondary-light transition">
              Contact
            </Link>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-primary-light rounded-lg transition"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {token ? (
              <>
                <Link href="/dashboard" className="text-secondary-light font-semibold hover:text-secondary transition">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-error px-4 py-2 rounded-lg hover:opacity-90 transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-secondary-light hover:text-secondary transition">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-secondary px-4 py-2 rounded-lg hover:bg-secondary-light transition font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-primary-light rounded-lg transition"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-primary-light rounded-lg transition">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="/events" className="block hover:text-secondary-light transition py-2">
              Events
            </Link>
            <Link href="/clubs" className="block hover:text-secondary-light transition py-2">
              Clubs
            </Link>
            <Link href="/about" className="block hover:text-secondary-light transition py-2">
              About
            </Link>
            <Link href="/contact" className="block hover:text-secondary-light transition py-2">
              Contact
            </Link>

            {token ? (
              <>
                <Link href="/dashboard" className="block text-secondary-light font-semibold py-2">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 bg-error px-4 py-2 rounded-lg hover:opacity-90 transition text-white"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-secondary-light py-2">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block bg-secondary px-4 py-2 rounded-lg hover:bg-secondary-light transition font-semibold text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
