import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload || payload.role !== "chairperson") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const eventId = Number.parseInt(params.eventId)

    // Verify ownership
    const eventResult = await pool.query("SELECT created_by FROM events WHERE id = $1", [eventId])

    if (eventResult.rows.length === 0 || eventResult.rows[0].created_by !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get analytics
    const analyticsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT er.id) as total_registrations,
        COUNT(DISTINCT CASE WHEN er.attendance_marked AND er.attendance_status = 'present' THEN er.id END) as attendance_present,
        COUNT(DISTINCT CASE WHEN er.attendance_marked AND er.attendance_status = 'absent' THEN er.id END) as attendance_absent,
        COUNT(DISTINCT CASE WHEN er.attendance_marked AND er.attendance_status = 'late' THEN er.id END) as attendance_late,
        COUNT(DISTINCT CASE WHEN NOT er.attendance_marked THEN er.id END) as attendance_pending,
        COUNT(DISTINCT er.id) FILTER (WHERE er.feedback_submitted_at IS NOT NULL) as feedback_count,
        AVG(er.feedback_rating) as avg_rating
       FROM event_registrations er
       WHERE er.event_id = $1 AND er.is_cancelled = false`,
      [eventId],
    )

    const analytics = analyticsResult.rows[0]

    // Calculate percentages
    const totalReg = Number(analytics.total_registrations)
    const attendancePercentage = totalReg > 0 ? (Number(analytics.attendance_present) / totalReg) * 100 : 0
    const noShowPercentage = totalReg > 0 ? (Number(analytics.attendance_absent) / totalReg) * 100 : 0

    return NextResponse.json({
      success: true,
      analytics: {
        ...analytics,
        attendance_percentage: Number(attendancePercentage.toFixed(2)),
        no_show_percentage: Number(noShowPercentage.toFixed(2)),
      },
    })
  } catch (error: any) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
