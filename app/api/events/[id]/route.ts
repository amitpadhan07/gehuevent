import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Event, Registration } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    await connectDB()

    const eventId = resolvedParams.id

    const event = await Event.findById(new Types.ObjectId(eventId))
      .populate("clubId", "name assets contact")
      .lean()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get registration count
    const registrationCount = await Registration.countDocuments({
      eventId: new Types.ObjectId(eventId),
      status: { $ne: "cancelled" },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        posterUrl: event.posterUrl,
        venueAddress: event.location.venueAddress,
        isOnline: event.location.isOnline,
        onlineLink: event.location.onlineLink,
        startDate: event.schedule.startDate,
        endDate: event.schedule.endDate,
        maxCapacity: event.capacity.max,
        registrationOpenDate: event.schedule.registrationOpen,
        registrationCloseDate: event.schedule.registrationClose,
        clubId: event.clubId._id,
        clubName: event.clubId.name,
        clubLogo: event.clubId.assets?.logoUrl,
        clubEmail: event.clubId.contact?.email,
        registeredCount: registrationCount,
      },
    })
  } catch (error: any) {
    console.error("Event fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
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

    const eventId = resolvedParams.id

    // Check if user owns event
    const event = await Event.findById(new Types.ObjectId(eventId))

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (payload.role === "chairperson" && event.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, description, eventType, posterUrl, startDate, venueAddress, maxCapacity } = await req.json()

    const updateData: any = {}
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (eventType) updateData.eventType = eventType
    if (posterUrl) updateData.posterUrl = posterUrl
    if (startDate) updateData["schedule.startDate"] = new Date(startDate)
    if (venueAddress) updateData["location.venueAddress"] = venueAddress
    if (maxCapacity !== undefined) updateData["capacity.max"] = maxCapacity

    const updatedEvent = await Event.findByIdAndUpdate(
      new Types.ObjectId(eventId),
      { $set: updateData },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent?._id,
        title: updatedEvent?.title,
        description: updatedEvent?.description,
        eventType: updatedEvent?.eventType,
        startDate: updatedEvent?.schedule.startDate,
      },
    })
  } catch (error: any) {
    console.error("Event update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
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

    const eventId = resolvedParams.id

    const event = await Event.findById(new Types.ObjectId(eventId))

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (payload.role === "chairperson" && event.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await Event.findByIdAndDelete(new Types.ObjectId(eventId))

    return NextResponse.json({ success: true, message: "Event deleted" })
  } catch (error: any) {
    console.error("Event delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
