import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Event, Registration } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
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

    const eventId = resolvedParams.eventId

    // Verify ownership
    const event = await Event.findById(new Types.ObjectId(eventId))

    if (!event || event.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all registrations for this event
    const registrations = await Registration.find({
      eventId: new Types.ObjectId(eventId),
      status: { $ne: "cancelled" },
    }).lean()

    // Calculate analytics
    const totalRegistrations = registrations.length
    const presentCount = registrations.filter(
      (r: any) => r.attendance.isMarked && r.attendance.currentStatus === "present"
    ).length
    const absentCount = registrations.filter(
      (r: any) => r.attendance.isMarked && r.attendance.currentStatus === "absent"
    ).length
    const lateCount = registrations.filter(
      (r: any) => r.attendance.isMarked && r.attendance.currentStatus === "late"
    ).length
    const pendingCount = registrations.filter((r: any) => !r.attendance.isMarked).length

    const feedbackCount = registrations.filter((r: any) => r.feedback.submittedAt).length
    const avgRating =
      feedbackCount > 0
        ? (registrations.reduce((sum: number, r: any) => sum + (r.feedback.rating || 0), 0) / feedbackCount).toFixed(2)
        : 0

    const attendancePercentage = totalRegistrations > 0 ? ((presentCount / totalRegistrations) * 100).toFixed(2) : 0
    const noShowPercentage = totalRegistrations > 0 ? ((absentCount / totalRegistrations) * 100).toFixed(2) : 0

    return NextResponse.json({
      success: true,
      analytics: {
        totalRegistrations,
        attendancePresent: presentCount,
        attendanceAbsent: absentCount,
        attendanceLate: lateCount,
        attendancePending: pendingCount,
        feedbackCount,
        avgRating: Number(avgRating),
        attendancePercentage: Number(attendancePercentage),
        noShowPercentage: Number(noShowPercentage),
      },
    })
  } catch (error: any) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
