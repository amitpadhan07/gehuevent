import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { generateQRCode, encryptQRToken } from "@/lib/qr-code"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Check event exists
    const eventResult = await pool.query("SELECT id, max_capacity FROM events WHERE id = $1", [eventId])

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if already registered
    const existingReg = await pool.query(
      `SELECT id FROM event_registrations 
       WHERE event_id = $1 AND user_id = $2 AND is_cancelled = false`,
      [eventId, payload.userId],
    )

    if (existingReg.rows.length > 0) {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 400 })
    }

    // Check capacity
    const capacityResult = await pool.query(
      `SELECT COUNT(*) as count FROM event_registrations 
       WHERE event_id = $1 AND is_cancelled = false`,
      [eventId],
    )

    const event = eventResult.rows[0]
    if (event.max_capacity && capacityResult.rows[0].count >= event.max_capacity) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    // Create registration
    const qrToken = encryptQRToken(payload.userId)
    const qrCode = await generateQRCode(0, eventId) // Will update with registration ID

    const regResult = await pool.query(
      `INSERT INTO event_registrations (event_id, user_id, qr_code_token, qr_code_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, event_id, user_id, registration_date`,
      [eventId, payload.userId, qrToken, qrCode],
    )

    // Update with actual registration ID
    await pool.query(
      `UPDATE event_registrations 
       SET qr_code_data = $1 
       WHERE id = $2`,
      [await generateQRCode(regResult.rows[0].id, eventId), regResult.rows[0].id],
    )

    return NextResponse.json(
      {
        success: true,
        registration: regResult.rows[0],
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
