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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT id, email, full_name, roll_number, branch, year, role, profile_picture_url, phone 
       FROM users WHERE id = $1`,
      [payload.userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error: any) {
    console.error("Profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { full_name, roll_number, branch, year, phone, profile_picture_url } = await req.json()

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           roll_number = COALESCE($2, roll_number),
           branch = COALESCE($3, branch),
           year = COALESCE($4, year),
           phone = COALESCE($5, phone),
           profile_picture_url = COALESCE($6, profile_picture_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, email, full_name, roll_number, branch, year, role, phone`,
      [full_name, roll_number, branch, year, phone, profile_picture_url, payload.userId],
    )

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error: any) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
