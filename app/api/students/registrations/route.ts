import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Registration } from "@/lib/models"
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

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get eventId from query parameters if provided
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    // Build filter query
    const filterQuery: any = {
      userId: new Types.ObjectId(payload.userId),
      status: { $ne: "cancelled" },
    }

    // If eventId is provided, add it to the filter
    if (eventId) {
      filterQuery.eventId = new Types.ObjectId(eventId)
    }

    const registrations = await Registration.find(filterQuery)
      .populate({
        path: "eventId",
        select: "title description schedule location isOnline onlineLink posterUrl clubId capacity",
        populate: {
          path: "clubId",
          select: "name assets",
        },
      })
      .sort({ "eventId.schedule.startDate": -1 })
      .lean()

    const formattedRegistrations = registrations.map((reg: any) => ({
      id: reg._id,
      event_id: reg.eventId._id,
      title: reg.eventId.title,
      event_date: reg.eventId.schedule.startDate,
      venueAddress: reg.eventId.location.venueAddress,
      isOnline: reg.eventId.isOnline,
      onlineLink: reg.eventId.onlineLink,
      posterUrl: reg.eventId.posterUrl,
      clubName: reg.eventId.clubId.name,
      clubLogoUrl: reg.eventId.clubId.assets?.logoUrl,
      status: reg.status,
      registeredAt: reg.createdAt,
      attendanceStatus: reg.attendance.currentStatus,
      attendanceMarked: reg.attendance.isMarked,
      qrCodeData: reg.qrCode.data,
    }))

    return NextResponse.json({ success: true, registrations: formattedRegistrations })
  } catch (error: any) {
    console.error("Registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
