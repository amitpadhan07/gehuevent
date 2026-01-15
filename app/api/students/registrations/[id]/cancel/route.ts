import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

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

    const registrationId = Number.parseInt(params.id)

    // Verify ownership
    const regResult = await pool.query("SELECT user_id, event_id FROM event_registrations WHERE id = $1", [
      registrationId,
    ])

    if (regResult.rows.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (regResult.rows[0].user_id !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await pool.query(
      `UPDATE event_registrations 
       SET is_cancelled = true, cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [registrationId],
    )

    return NextResponse.json({ success: true, message: "Registration cancelled" })
  } catch (error: any) {
    console.error("Cancel registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
