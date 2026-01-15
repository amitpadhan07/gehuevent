import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
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

    const { registration_id, event_id, status, notes } = await req.json()

    if (!registration_id || !event_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify ownership
    const eventResult = await pool.query("SELECT created_by FROM events WHERE id = $1", [event_id])

    if (eventResult.rows.length === 0 || eventResult.rows[0].created_by !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update registration
    const updateResult = await pool.query(
      `UPDATE event_registrations 
       SET attendance_marked = true, attendance_status = $1, attended_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND event_id = $3
       RETURNING id`,
      [status, registration_id, event_id],
    )

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Log attendance
    const regResult = await pool.query("SELECT user_id FROM event_registrations WHERE id = $1", [registration_id])

    await pool.query(
      `INSERT INTO attendance_logs (registration_id, event_id, user_id, status, marked_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [registration_id, event_id, regResult.rows[0].user_id, status, payload.userId, notes || null],
    )

    return NextResponse.json({ success: true, message: "Attendance updated" })
  } catch (error: any) {
    console.error("Manual attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
