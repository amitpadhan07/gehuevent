import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User, AuditLog } from "@/lib/models"
import { comparePassword, generateToken } from "@/lib/auth"
import { ValidationError, UnauthorizedError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password } = await req.json()

    // Validation
    if (!email || !password) {
      throw new ValidationError("Email and password are required")
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true })

    if (!user) {
      throw new UnauthorizedError("Invalid email or password")
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password")
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    // Log audit
    await AuditLog.create({
      userId: user._id,
      action: "USER_LOGIN",
      target: {
        entityType: "User",
        entityId: user._id,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
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
