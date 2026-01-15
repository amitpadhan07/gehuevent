import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const clubId = searchParams.get("clubId")
    const eventType = searchParams.get("type")
    const sortBy = searchParams.get("sort") || "event_date"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = `
      SELECT e.id, e.title, e.description, e.event_type, e.poster_url, 
             e.venue_address, e.is_online, e.online_link, e.event_date, e.max_capacity,
             c.id as club_id, c.name as club_name, c.logo_url,
             COUNT(er.id) as registered_count
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.is_cancelled = false
      WHERE e.is_published = true AND e.event_date > CURRENT_TIMESTAMP
    `

    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (clubId) {
      query += ` AND e.club_id = $${paramIndex}`
      params.push(Number.parseInt(clubId))
      paramIndex++
    }

    if (eventType) {
      query += ` AND e.event_type = $${paramIndex}`
      params.push(eventType)
      paramIndex++
    }

    query += " GROUP BY e.id, c.id"

    if (sortBy === "upcoming") {
      query += " ORDER BY e.event_date ASC"
    } else if (sortBy === "latest") {
      query += " ORDER BY e.created_at DESC"
    } else if (sortBy === "popular") {
      query += " ORDER BY COUNT(er.id) DESC"
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    return NextResponse.json({ success: true, events: result.rows })
  } catch (error: any) {
    console.error("Events fetch error:", error)
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

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (payload.role !== "chairperson" && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      club_id,
      title,
      description,
      event_type,
      poster_url,
      venue_address,
      is_online,
      online_link,
      event_date,
      end_date,
      max_capacity,
      registration_open_date,
      registration_close_date,
    } = await req.json()

    if (!title || !club_id || !event_date) {
      return NextResponse.json({ error: "Title, club_id, and event_date are required" }, { status: 400 })
    }

    // Verify user is chairperson of this club
    if (payload.role === "chairperson") {
      const chairResult = await pool.query(
        `SELECT id FROM club_members 
         WHERE club_id = $1 AND user_id = $2 AND role = 'chairperson'`,
        [club_id, payload.userId],
      )

      if (chairResult.rows.length === 0) {
        return NextResponse.json({ error: "You are not authorized for this club" }, { status: 403 })
      }
    }

    const result = await pool.query(
      `INSERT INTO events (club_id, title, description, event_type, poster_url, venue_address, 
                          is_online, online_link, event_date, end_date, max_capacity, 
                          registration_open_date, registration_close_date, created_by, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
       RETURNING id, title, description, event_type, event_date, max_capacity`,
      [
        club_id,
        title,
        description,
        event_type,
        poster_url,
        venue_address,
        is_online,
        online_link,
        event_date,
        end_date,
        max_capacity,
        registration_open_date,
        registration_close_date,
        payload.userId,
      ],
    )

    return NextResponse.json({ success: true, event: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Event creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
