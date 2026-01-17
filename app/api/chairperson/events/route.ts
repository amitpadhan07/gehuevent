import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Event, Registration, User } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload || payload.role !== "chairperson") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get events created by chairperson
    const events = await Event.find({
      createdBy: new Types.ObjectId(payload.userId),
    })
      .populate("clubId", "name")
      .sort({ "schedule.startDate": -1 })
      .lean()

    // Get stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event: any) => {
        const registeredCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $ne: "cancelled" },
        })

        const attendedCount = await Registration.countDocuments({
          eventId: event._id,
          "attendance.isMarked": true,
          "attendance.currentStatus": "present",
        })

        return {
          id: event._id,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          startDate: event.schedule.startDate,
          venueAddress: event.location.venueAddress,
          maxCapacity: event.capacity.max,
          isPublished: event.isPublished,
          clubId: event.clubId._id,
          clubName: event.clubId.name,
          registeredCount,
          attendedCount,
        }
      })
    )

    return NextResponse.json({ success: true, events: eventsWithStats })
  } catch (error: any) {
    console.error("Chairperson events fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload || payload.role !== "chairperson") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, eventDate, location, capacity } = body

    if (!title || !description || !eventDate || !location || !capacity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user to find their club
    const user = await User.findById(new Types.ObjectId(payload.userId))
    if (!user || !user.clubMemberships || user.clubMemberships.length === 0) {
      return NextResponse.json({ error: "User not associated with a club" }, { status: 400 })
    }

    // Get the first club membership (or the one with chairperson role if available)
    const clubMembership = user.clubMemberships.find((m: any) => m.role === "chairperson") || user.clubMemberships[0]
    const clubId = clubMembership.clubId

    const newEvent = new Event({
      title,
      description,
      eventType: "other",
      schedule: {
        startDate: new Date(eventDate),
        endDate: new Date(eventDate),
      },
      location: {
        venueAddress: location,
      },
      capacity: {
        max: parseInt(capacity),
      },
      clubId: new Types.ObjectId(clubId),
      createdBy: payload.userId,
      isPublished: true,
    })

    await newEvent.save()

    return NextResponse.json(
      {
        success: true,
        event: {
          id: newEvent._id,
          title: newEvent.title,
          description: newEvent.description,
          eventDate: newEvent.schedule.startDate,
          location: newEvent.location.venueAddress,
          capacity: newEvent.capacity.max,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create event error:", error.message || error)
    console.error("Error details:", error)
    return NextResponse.json({ error: error.message || "Internal server error", details: error.message }, { status: 500 })
  }
}
