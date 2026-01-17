import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Event, Registration } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
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

    const eventId = resolvedParams.id

    // Verify ownership
    const event = await Event.findById(new Types.ObjectId(eventId))

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const registrations = await Registration.find({
      eventId: new Types.ObjectId(eventId),
      status: { $ne: "cancelled" },
    })
      .populate("userId", "fullName email rollNumber branch")
      .sort({ createdAt: -1 })
      .lean()

    const formattedRegistrations = registrations.map((reg: any) => ({
      id: reg._id,
      userId: reg.userId._id,
      registeredAt: reg.createdAt,
      attendanceMarked: reg.attendance.isMarked,
      attendanceStatus: reg.attendance.currentStatus,
      fullName: reg.userId.fullName,
      email: reg.userId.email,
      rollNumber: reg.userId.rollNumber,
      branch: reg.userId.branch,
    }))

    return NextResponse.json({ success: true, registrations: formattedRegistrations })
  } catch (error: any) {
    console.error("Registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
