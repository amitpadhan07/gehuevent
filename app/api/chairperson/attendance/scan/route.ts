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

    const { qr_data, event_id, latitude, longitude } = await req.json()

    if (!qr_data || !event_id) {
      return NextResponse.json({ error: "QR data and event_id are required" }, { status: 400 })
    }

    // Parse QR data
    let qrPayload: any
    try {
      qrPayload = JSON.parse(qr_data)
    } catch {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    const registrationId = qrPayload.registration_id
    if (!registrationId) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 })
    }

    // Get registration
    const regResult = await pool.query(
      "SELECT id, event_id, user_id, attendance_marked FROM event_registrations WHERE id = $1",
      [registrationId],
    )

    if (regResult.rows.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const registration = regResult.rows[0]

    if (registration.event_id !== event_id) {
      return NextResponse.json({ error: "QR code does not match event" }, { status: 400 })
    }

    if (registration.attendance_marked) {
      return NextResponse.json(
        { error: "Attendance already marked for this registration", code: "DUPLICATE_SCAN" },
        { status: 400 },
      )
    }

    // Mark attendance
    await pool.query(
      `UPDATE event_registrations 
       SET attendance_marked = true, attendance_status = 'present', attended_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [registrationId],
    )

    // Log attendance
    await pool.query(
      `INSERT INTO attendance_logs (registration_id, event_id, user_id, status, marked_by, latitude, longitude)
       VALUES ($1, $2, $3, 'present', $4, $5, $6)`,
      [registrationId, event_id, registration.user_id, payload.userId, latitude || null, longitude || null],
    )

    return NextResponse.json({
      success: true,
      message: "Attendance marked",
      registration: { id: registrationId, status: "present" },
    })
  } catch (error: any) {
    console.error("Attendance scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
