import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary dark:bg-primary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Event Portal</h3>
            <p className="text-foreground-light">Discover and register for amazing college events.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="hover:text-secondary-light transition">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="hover:text-secondary-light transition">
                  Clubs
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-secondary-light transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-secondary-light transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-light transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-foreground-light">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                info@eventportal.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} />
                College Campus
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-light mt-8 pt-8 text-center text-foreground-light">
          <p>&copy; 2026 College Event Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
