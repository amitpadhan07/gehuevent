import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Registration, Event } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

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

    const { registrationId, eventId, status, notes } = await req.json()

    if (!registrationId || !eventId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify ownership
    const event = await Event.findById(new Types.ObjectId(eventId))

    if (!event || event.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update registration
    const registration = await Registration.findById(new Types.ObjectId(registrationId))

    if (!registration || registration.eventId.toString() !== eventId) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update attendance
    registration.attendance.isMarked = true
    registration.attendance.currentStatus = status
    registration.attendance.logs.push({
      markedBy: new Types.ObjectId(payload.userId),
      markedAt: new Date(),
      status,
      notes,
    })
    await registration.save()

    return NextResponse.json({ success: true, message: "Attendance updated" })
  } catch (error: any) {
    console.error("Manual attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
