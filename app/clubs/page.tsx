"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Users, MapPin, Mail } from "lucide-react"

interface Club {
  _id: string
  name: string
  description: string
  contactEmail?: string
  website?: string
  assets?: {
    logo?: string
    banner?: string
  }
  contact?: {
    president?: string
    vice_president?: string
    phone?: string
  }
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/clubs")
      const data = await res.json()

      if (data.success) {
        setClubs(data.data || [])
        setFilteredClubs(data.data || [])
      } else {
        setError(data.error || "Failed to load clubs")
      }
    } catch (err) {
      setError("Error loading clubs")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(term) ||
        club.description?.toLowerCase().includes(term)
    )
    setFilteredClubs(filtered)
  }

  return (
    <div className="min-h-screen bg-background dark:bg-primary-dark flex flex-col">

      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground dark:text-white mb-4">College Clubs</h1>
          <p className="text-foreground-light dark:text-foreground-light text-lg">
            Discover and join various clubs in your college
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-foreground-light" size={20} />
            <Input
              type="text"
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-64 bg-background-light dark:bg-primary-light animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-error bg-opacity-20 border border-error rounded-lg p-6 text-center text-error">
            <p className="text-lg font-semibold">{error}</p>
            <Button onClick={fetchClubs} className="mt-4">
              Retry
            </Button>
          </div>
        )}

        {/* Clubs Grid */}
        {!loading && !error && (
          <>
            {filteredClubs.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-foreground-light mb-4" />
                <p className="text-lg text-foreground-light dark:text-foreground-light">
                  {searchTerm ? "No clubs found matching your search" : "No clubs available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club) => (
                  <Card
                    key={club._id}
                    className="overflow-hidden hover:shadow-lg transition dark:bg-primary-light"
                  >
                    {/* Club Banner/Logo */}
                    {club.assets?.banner || club.assets?.logo ? (
                      <div
                        className="h-40 bg-gradient-to-r from-primary to-secondary bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${club.assets.banner || club.assets.logo})`,
                        }}
                      />
                    ) : (
                      <div className="h-40 bg-gradient-to-r from-primary to-secondary" />
                    )}

                    {/* Club Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
                        {club.name}
                      </h3>

                      <p className="text-foreground-light dark:text-foreground-light text-sm mb-4">
                        {club.description || "No description available"}
                      </p>

                      {/* Contact Info */}
                      <div className="space-y-2 text-sm text-foreground-light dark:text-foreground-light mb-4">
                        {club.contact?.president && (
                          <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span>{club.contact.president}</span>
                          </div>
                        )}

                        {club.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail size={16} />
                            <a
                              href={`mailto:${club.contactEmail}`}
                              className="hover:text-secondary"
                            >
                              {club.contactEmail}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button className="w-full mt-4">Join Club</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Results Count */}
            <div className="text-center mt-8 text-foreground-light dark:text-foreground-light">
              Showing {filteredClubs.length} of {clubs.length} clubs
            </div>
          </>
        )}
      </main>

    </div>
  )
}
