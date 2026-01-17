import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Registration, Event } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const registrationId = params.id

    // Verify ownership
    const registration = await Registration.findById(new Types.ObjectId(registrationId))

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update registration status
    registration.status = "cancelled"
    registration.cancelledAt = new Date()
    await registration.save()

    // Decrement event registration count
    const event = await Event.findById(registration.eventId)
    if (event) {
      event.capacity.registeredCount = Math.max(0, event.capacity.registeredCount - 1)
      await event.save()
    }

    return NextResponse.json({ success: true, message: "Registration cancelled" })
  } catch (error: any) {
    console.error("Cancel registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
