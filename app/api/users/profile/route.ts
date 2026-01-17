import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await User.findById(new Types.ObjectId(payload.userId)).select(
      "email fullName rollNumber branch year role profilePictureUrl phone"
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        rollNumber: user.rollNumber,
        branch: user.branch,
        year: user.year,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        phone: user.phone,
      },
    })
  } catch (error: any) {
    console.error("Profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { fullName, rollNumber, branch, year, phone, profilePictureUrl } = await req.json()

    const updateData: any = {}
    if (fullName) updateData.fullName = fullName
    if (rollNumber) updateData.rollNumber = rollNumber
    if (branch) updateData.branch = branch
    if (year !== undefined) updateData.year = year
    if (phone) updateData.phone = phone
    if (profilePictureUrl) updateData.profilePictureUrl = profilePictureUrl

    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(payload.userId),
      { $set: updateData },
      { new: true }
    ).select("email fullName rollNumber branch year role phone")

    return NextResponse.json({
      success: true,
      user: {
        id: user?._id,
        email: user?.email,
        fullName: user?.fullName,
        rollNumber: user?.rollNumber,
        branch: user?.branch,
        year: user?.year,
        role: user?.role,
        phone: user?.phone,
      },
    })
  } catch (error: any) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
  } catch (error: any) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
