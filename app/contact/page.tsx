export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground dark:text-white mb-6">Contact Us</h1>
        <div className="max-w-2xl">
          <p className="text-foreground-light dark:text-foreground-light mb-8">
            Have questions? We'd love to hear from you.
          </p>
          <div className="space-y-4">
            <p>
              <strong>Email:</strong> info@eventportal.com
            </p>
            <p>
              <strong>Phone:</strong> +1 (555) 123-4567
            </p>
            <p>
              <strong>Location:</strong> College Campus
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
