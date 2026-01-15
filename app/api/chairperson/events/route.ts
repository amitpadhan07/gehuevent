import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
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

    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.venue_address,
              e.max_capacity, e.is_published, c.id as club_id, c.name as club_name,
              COUNT(DISTINCT er.id) as registered_count,
              COUNT(DISTINCT CASE WHEN er.attendance_marked THEN er.id END) as attended_count
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       JOIN club_members cm ON c.id = cm.club_id
       LEFT JOIN event_registrations er ON e.id = er.event_id AND er.is_cancelled = false
       WHERE cm.user_id = $1 AND cm.role = 'chairperson' AND e.created_by = $1
       GROUP BY e.id, c.id
       ORDER BY e.event_date DESC`,
      [payload.userId],
    )

    return NextResponse.json({ success: true, events: result.rows })
  } catch (error: any) {
    console.error("Chairperson events fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
