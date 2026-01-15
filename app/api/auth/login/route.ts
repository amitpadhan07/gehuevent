import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { comparePassword, generateToken } from "@/lib/auth"
import { ValidationError, UnauthorizedError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validation
    if (!email || !password) {
      throw new ValidationError("Email and password are required")
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1 AND is_active = true",
      [email],
    )

    if (result.rows.length === 0) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const user = result.rows[0]

    // Compare password
    const isValidPassword = await comparePassword(password, user.password_hash)
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password")
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type) 
       VALUES ($1, $2, $3)`,
      [user.id, "USER_LOGIN", "users"],
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    })
  } catch (error: any) {
    console.error("Login error:", error)

    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
