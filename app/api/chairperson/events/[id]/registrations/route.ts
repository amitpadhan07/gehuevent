import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const eventId = Number.parseInt(params.id)

    // Verify ownership
    const eventResult = await pool.query("SELECT created_by FROM events WHERE id = $1", [eventId])

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (eventResult.rows[0].created_by !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await pool.query(
      `SELECT er.id, er.user_id, er.registration_date, er.attendance_marked, er.attendance_status,
              u.full_name, u.email, u.roll_number, u.branch
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1 AND er.is_cancelled = false
       ORDER BY u.full_name ASC`,
      [eventId],
    )

    return NextResponse.json({ success: true, registrations: result.rows })
  } catch (error: any) {
    console.error("Registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
