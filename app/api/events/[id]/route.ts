import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = Number.parseInt(params.id)

    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.event_type, e.poster_url, 
              e.venue_address, e.is_online, e.online_link, e.event_date, e.end_date, 
              e.max_capacity, e.registration_open_date, e.registration_close_date,
              c.id as club_id, c.name as club_name, c.logo_url, c.email as club_email,
              COUNT(er.id) as registered_count
       FROM events e
       LEFT JOIN clubs c ON e.club_id = c.id
       LEFT JOIN event_registrations er ON e.id = er.event_id AND er.is_cancelled = false
       WHERE e.id = $1
       GROUP BY e.id, c.id`,
      [eventId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, event: result.rows[0] })
  } catch (error: any) {
    console.error("Event fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const eventId = Number.parseInt(params.id)

    // Check if user owns event
    const eventResult = await pool.query("SELECT created_by, club_id FROM events WHERE id = $1", [eventId])

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = eventResult.rows[0]

    if (payload.role === "chairperson" && event.created_by !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, description, event_type, poster_url, event_date, venue_address, max_capacity } = await req.json()

    const updateResult = await pool.query(
      `UPDATE events 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           event_type = COALESCE($3, event_type),
           poster_url = COALESCE($4, poster_url),
           event_date = COALESCE($5, event_date),
           venue_address = COALESCE($6, venue_address),
           max_capacity = COALESCE($7, max_capacity),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, title, description, event_type, event_date`,
      [title, description, event_type, poster_url, event_date, venue_address, max_capacity, eventId],
    )

    return NextResponse.json({ success: true, event: updateResult.rows[0] })
  } catch (error: any) {
    console.error("Event update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    const eventId = Number.parseInt(params.id)

    const eventResult = await pool.query("SELECT created_by FROM events WHERE id = $1", [eventId])

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (payload.role === "chairperson" && eventResult.rows[0].created_by !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await pool.query("DELETE FROM events WHERE id = $1", [eventId])

    return NextResponse.json({ success: true, message: "Event deleted" })
  } catch (error: any) {
    console.error("Event delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
