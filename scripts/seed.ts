import mongoose from "mongoose"
import { User, Club, Event } from "@/lib/models"
import { hashPassword } from "@/lib/auth"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local" })

const MONGO_URL = process.env.MONGO_URL

async function connectDB() {
  if (!MONGO_URL) {
    throw new Error("MONGO_URL environment variable is not set")
  }
  if (mongoose.connection.readyState >= 1) {
    return
  }
  await mongoose.connect(MONGO_URL)
}

async function seedDatabase() {
  try {
    await connectDB()
    console.log("✅ Connected to MongoDB")

    // Clear existing demo data
    await User.deleteMany({ email: { $in: ["chairperson@demo.com", "student@demo.com", "admin@demo.com"] } })
    await Club.deleteMany({ name: "Demo Club" })
    await Event.deleteMany({ title: { $regex: "^Demo" } })
    console.log("🗑️  Cleared existing demo data")

    // Create Demo Chairperson
    const chairpersonPassword = await hashPassword("password123")
    const chairperson = await User.create({
      email: "chairperson@demo.com",
      passwordHash: chairpersonPassword,
      fullName: "Demo Chairperson",
      rollNumber: "CP001",
      branch: "CSE",
      year: 4,
      role: "chairperson",
      emailVerified: true,
      isActive: true,
    })
    console.log("✅ Created demo chairperson:", chairperson.email)

    // Create Demo Club
    const club = await Club.create({
      name: "Demo Club",
      description: "This is a demo club for testing purposes",
      contactEmail: "club@demo.com",
      website: "https://demo-club.example.com",
      assets: {
        logo: "https://via.placeholder.com/200?text=Demo+Club",
        banner: "https://via.placeholder.com/800x300?text=Demo+Club+Banner",
      },
      contact: {
        president: chairperson.fullName,
        vice_president: "John Doe",
        phone: "+1 (555) 123-4567",
      },
    })
    console.log("✅ Created demo club:", club.name)

    // Add chairperson to club
    chairperson.clubMemberships.push({
      clubId: club._id,
      role: "president",
      joinedAt: new Date(),
    })
    await chairperson.save()

    // Create Demo Events
    const now = new Date()
    const events = [
      {
        title: "Demo Tech Conference 2026",
        description: "Join us for an exciting tech conference featuring industry experts and innovation showcases.",
        clubId: club._id,
        createdBy: chairperson._id,
        location: {
          venueAddress: "Main Auditorium, College Campus",
          city: "Tech City",
          state: "State",
          zipCode: "123456",
        },
        schedule: {
          startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
          startTime: "10:00 AM",
          endTime: "2:00 PM",
        },
        capacity: {
          registeredCount: 0,
          totalSlots: 100,
          waitlist: 0,
        },
        status: "upcoming",
        tags: ["technology", "conference", "learning"],
        thumbnail:
          "https://via.placeholder.com/400x300?text=Tech+Conference",
      },
      {
        title: "Demo Workshop: Web Development",
        description: "Learn web development from basics to advanced concepts. Hands-on workshop with live coding.",
        clubId: club._id,
        createdBy: chairperson._id,
        location: {
          venueAddress: "Computer Lab A, Building 2",
          city: "Tech City",
          state: "State",
          zipCode: "123456",
        },
        schedule: {
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
          startTime: "2:00 PM",
          endTime: "5:00 PM",
        },
        capacity: {
          registeredCount: 0,
          totalSlots: 50,
          waitlist: 0,
        },
        status: "upcoming",
        tags: ["workshop", "web-development", "hands-on"],
        thumbnail:
          "https://via.placeholder.com/400x300?text=Web+Development",
      },
      {
        title: "Demo Networking Event",
        description: "Connect with peers, make new friends, and build your professional network over refreshments.",
        clubId: club._id,
        createdBy: chairperson._id,
        location: {
          venueAddress: "Cafeteria, Main Building",
          city: "Tech City",
          state: "State",
          zipCode: "123456",
        },
        schedule: {
          startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
          endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
          startTime: "4:00 PM",
          endTime: "6:00 PM",
        },
        capacity: {
          registeredCount: 0,
          totalSlots: 200,
          waitlist: 0,
        },
        status: "upcoming",
        tags: ["networking", "social", "community"],
        thumbnail:
          "https://via.placeholder.com/400x300?text=Networking+Event",
      },
    ]

    const createdEvents = await Event.insertMany(events)
    console.log("✅ Created 3 demo events:")
    createdEvents.forEach((event) => {
      console.log(`   • ${event.title} (${event._id})`)
    })

    // Create Demo Student
    const studentPassword = await hashPassword("password123")
    const student = await User.create({
      email: "student@demo.com",
      passwordHash: studentPassword,
      fullName: "Demo Student",
      rollNumber: "21CS001",
      branch: "CSE",
      year: 3,
      role: "student",
      emailVerified: true,
      isActive: true,
    })
    console.log("✅ Created demo student:", student.email)

    // Create Demo Admin
    const adminPassword = await hashPassword("password123")
    const admin = await User.create({
      email: "admin@demo.com",
      passwordHash: adminPassword,
      fullName: "Demo Administrator",
      rollNumber: "ADMIN001",
      branch: "IT",
      year: 4,
      role: "admin",
      emailVerified: true,
      isActive: true,
    })
    console.log("✅ Created demo admin:", admin.email)

    console.log("\n" + "=".repeat(60))
    console.log("🎉 Database seeding completed successfully!")
    console.log("=".repeat(60))
    console.log("\n📝 Demo Credentials:\n")
    console.log("Admin:")
    console.log("  Email: admin@demo.com")
    console.log("  Password: password123")
    console.log("  Role: admin\n")
    console.log("Chairperson:")
    console.log("  Email: chairperson@demo.com")
    console.log("  Password: password123")
    console.log("  Role: chairperson\n")
    console.log("Student:")
    console.log("  Email: student@demo.com")
    console.log("  Password: password123")
    console.log("  Role: student\n")
    console.log("Club:")
    console.log(`  Name: Demo Club`)
    console.log(`  ID: ${club._id}\n`)
    console.log("Events Created: 3")
    console.log("  • Demo Tech Conference 2026")
    console.log("  • Demo Workshop: Web Development")
    console.log("  • Demo Networking Event\n")
    console.log("=".repeat(60))

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
