import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { sendEmail, generateRegistrationEmailHTML } from "@/lib/brevo"

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
    const { registration_id } = await req.json()

    // Get registration with user and event details
    const result = await pool.query(
      `SELECT er.id, er.qr_code_data,
              e.title, e.event_date, e.venue_address, e.is_online, e.online_link,
              c.name as club_name,
              u.email, u.full_name
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       JOIN clubs c ON e.club_id = c.id
       JOIN users u ON er.user_id = u.id
       WHERE er.id = $1 AND er.event_id = $2 AND er.user_id = $3`,
      [registration_id, eventId, payload.userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const registration = result.rows[0]

    // Generate and send email
    const emailHTML = generateRegistrationEmailHTML({
      eventTitle: registration.title,
      eventDate: registration.event_date,
      clubName: registration.club_name,
      venue: registration.venue_address,
      studentName: registration.full_name,
      qrCodeDataUrl: registration.qr_code_data,
      onlineLink: registration.is_online ? registration.online_link : undefined,
    })

    const emailSent = await sendEmail({
      to: [{ email: registration.email, name: registration.full_name }],
      subject: `Registration Confirmed – ${registration.title}`,
      htmlContent: emailHTML,
    })

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Confirmation email sent",
    })
  } catch (error: any) {
    console.error("[v0] Email confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
