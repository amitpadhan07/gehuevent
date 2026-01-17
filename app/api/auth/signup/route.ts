import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User, AuditLog } from "@/lib/models"
import { hashPassword, generateToken } from "@/lib/auth"
import { ValidationError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password, fullName, rollNumber, branch, year, role = "student" } = await req.json()

    // Validation
    if (!email || !password || !fullName) {
      throw new ValidationError("Email, password, and full name are required")
    }

    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters")
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      throw new ValidationError("Email already registered")
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      rollNumber: rollNumber || undefined,
      branch: branch || undefined,
      year: year || undefined,
      role,
      emailVerified: true,
    })

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    // Log audit
    await AuditLog.create({
      userId: user._id,
      action: "USER_SIGNUP",
      target: {
        entityType: "User",
        entityId: user._id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
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
