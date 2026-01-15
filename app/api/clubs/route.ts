import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search") || ""

    let query = "SELECT id, name, description, logo_url, banner_url FROM clubs WHERE is_active = true"
    const params: any[] = []

    if (search) {
      query += " AND (name ILIKE $1 OR description ILIKE $1)"
      params.push(`%${search}%`)
    }

    query += " ORDER BY name ASC LIMIT 100"

    const result = await pool.query(query, params)
    return NextResponse.json({ success: true, clubs: result.rows })
  } catch (error: any) {
    console.error("Clubs fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description, logo_url, banner_url, website_url, email, phone } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO clubs (name, description, logo_url, banner_url, website_url, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, description, logo_url, banner_url`,
      [name, description, logo_url, banner_url, website_url, email, phone],
    )

    return NextResponse.json({ success: true, club: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Club creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
