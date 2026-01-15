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

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT er.id, er.event_id, er.registration_date, er.attendance_marked, 
              er.attendance_status, er.qr_code_data,
              e.id as event_id, e.title, e.event_date, e.venue_address, 
              e.is_online, e.online_link, e.poster_url,
              c.name as club_name, c.logo_url
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       JOIN clubs c ON e.club_id = c.id
       WHERE er.user_id = $1 AND er.is_cancelled = false
       ORDER BY e.event_date DESC`,
      [payload.userId],
    )

    return NextResponse.json({ success: true, registrations: result.rows })
  } catch (error: any) {
    console.error("Registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
