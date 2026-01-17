import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Event, Club, Registration, User } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const clubId = searchParams.get("clubId")
    const eventType = searchParams.get("type")
    const sortBy = searchParams.get("sort") || "startDate"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Build query filter
    const filter: any = {
      isPublished: true,
      "schedule.startDate": { $gt: new Date() },
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    if (clubId) {
      filter.clubId = new Types.ObjectId(clubId)
    }

    if (eventType) {
      filter.eventType = eventType
    }

    // Build sort
    let sortObj: any = {}
    if (sortBy === "upcoming") {
      sortObj = { "schedule.startDate": 1 }
    } else if (sortBy === "latest") {
      sortObj = { createdAt: -1 }
    } else if (sortBy === "popular") {
      sortObj = { "capacity.registeredCount": -1 }
    }

    // Fetch events with population
    const events = await Event.find(filter)
      .populate("clubId", "name assets")
      .sort(sortObj)
      .skip(offset)
      .limit(limit)
      .lean()

    // Format response
    const formattedEvents = events.map((e: any) => ({
      id: e._id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      posterUrl: e.posterUrl,
      venueAddress: e.location?.venueAddress,
      isOnline: e.location?.isOnline,
      onlineLink: e.location?.onlineLink,
      event_date: e.schedule?.startDate,
      maxCapacity: e.capacity?.max,
      clubId: e.clubId?._id,
      club_name: e.clubId?.name,
      logoUrl: e.clubId?.assets?.logoUrl,
      registered_count: e.capacity?.registeredCount,
    }))

    return NextResponse.json({ success: true, events: formattedEvents })
  } catch (error: any) {
    console.error("Events fetch error:", error.message || error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
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

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (payload.role !== "chairperson" && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      clubId,
      title,
      description,
      eventType,
      posterUrl,
      venueAddress,
      isOnline,
      onlineLink,
      startDate,
      endDate,
      maxCapacity,
      registrationOpen,
      registrationClose,
    } = await req.json()

    if (!title || !clubId || !startDate) {
      return NextResponse.json({ error: "Title, clubId, and startDate are required" }, { status: 400 })
    }

    // Verify user is chairperson of this club
    if (payload.role === "chairperson") {
      const user = await User.findById(payload.userId)
      const isMember = user?.clubMemberships.some(
        (m: any) => m.clubId.toString() === clubId && m.role === "chairperson"
      )

      if (!isMember) {
        return NextResponse.json({ error: "You are not authorized for this club" }, { status: 403 })
      }
    }

    // Create event
    const event = await Event.create({
      clubId: new Types.ObjectId(clubId),
      title,
      description,
      eventType: eventType || "other",
      posterUrl,
      location: {
        venueAddress,
        isOnline,
        onlineLink,
      },
      schedule: {
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        registrationOpen: registrationOpen ? new Date(registrationOpen) : undefined,
        registrationClose: registrationClose ? new Date(registrationClose) : undefined,
      },
      capacity: {
        max: maxCapacity,
        registeredCount: 0,
      },
      isPublished: true,
      createdBy: new Types.ObjectId(payload.userId),
    })

    return NextResponse.json(
      {
        success: true,
        event: {
          id: event._id,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          startDate: event.schedule.startDate,
          maxCapacity: event.capacity.max,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Event creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
