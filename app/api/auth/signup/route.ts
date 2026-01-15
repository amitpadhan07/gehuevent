import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { hashPassword, generateToken } from "@/lib/auth"
import { ValidationError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, roll_number, branch, year, role = "student" } = await req.json()

    // Validation
    if (!email || !password || !full_name) {
      throw new ValidationError("Email, password, and full name are required")
    }

    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters")
    }

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      throw new ValidationError("Email already registered")
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, roll_number, branch, year, role, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, full_name, role`,
      [email, password_hash, full_name, roll_number || null, branch || null, year || null, role, true],
    )

    const user = result.rows[0]

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, "USER_SIGNUP", "users", user.id],
    )

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        token,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Signup error:", error)

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
