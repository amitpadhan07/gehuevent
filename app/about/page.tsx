export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground dark:text-white mb-6">About Event Portal</h1>
        <div className="prose dark:prose-invert max-w-3xl">
          <p className="text-foreground-light dark:text-foreground-light">
            Event Portal is a comprehensive college event management system designed to streamline event discovery,
            registration, and attendance tracking.
          </p>
        </div>
      </div>
    </div>
  )
}
