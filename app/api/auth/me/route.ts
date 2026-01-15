import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken, UnauthorizedError } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing authorization token")
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload) {
      throw new UnauthorizedError("Invalid or expired token")
    }

    // Fetch user data
    const result = await pool.query(
      "SELECT id, email, full_name, role, roll_number, branch, year, profile_picture_url FROM users WHERE id = $1",
      [payload.userId],
    )

    if (result.rows.length === 0) {
      throw new UnauthorizedError("User not found")
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    })
  } catch (error: any) {
    console.error("Me endpoint error:", error)
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 })
  }
}
