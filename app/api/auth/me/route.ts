import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models"
import { verifyToken, UnauthorizedError } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(req: NextRequest) {
  try {
    await connectDB()

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
    const user = await User.findById(new Types.ObjectId(payload.userId)).select(
      "email fullName role rollNumber branch year profilePictureUrl phone"
    )

    if (!user) {
      throw new UnauthorizedError("User not found")
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        rollNumber: user.rollNumber,
        branch: user.branch,
        year: user.year,
        profilePictureUrl: user.profilePictureUrl,
        phone: user.phone,
      },
    })
  } catch (error: any) {
    console.error("Me endpoint error:", error)
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 })
  }
}
