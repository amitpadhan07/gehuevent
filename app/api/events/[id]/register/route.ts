import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Event, Registration, User } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { generateQRCode, encryptQRToken } from "@/lib/qr-code"
import { Types } from "mongoose"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const eventId = id

    // Check event exists
    const event = await Event.findById(new Types.ObjectId(eventId))

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if already registered
    const existingReg = await Registration.findOne({
      eventId: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(payload.userId),
      status: { $ne: "cancelled" },
    })

    if (existingReg) {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 400 })
    }

    // Check capacity
    const registrationCount = await Registration.countDocuments({
      eventId: new Types.ObjectId(eventId),
      status: { $ne: "cancelled" },
    })

    if (event.capacity.max && registrationCount >= event.capacity.max) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    // Get user details for snapshot
    const user = await User.findById(new Types.ObjectId(payload.userId))

    // Create registration
    const qrToken = encryptQRToken(payload.userId)
    const qrCode = await generateQRCode(0, eventId)

    const registration = await Registration.create({
      eventId: new Types.ObjectId(eventId),
      userId: new Types.ObjectId(payload.userId),
      userSnapshot: {
        fullName: user?.fullName,
        rollNumber: user?.rollNumber,
        email: user?.email,
      },
      qrCode: {
        token: qrToken,
        data: qrCode,
      },
      status: "registered",
    })

    // Update with actual registration ID
    const updatedQRCode = await generateQRCode(registration._id.toString(), eventId)
    registration.qrCode.data = updatedQRCode
    await registration.save()

    // Increment event registration count
    event.capacity.registeredCount = await Registration.countDocuments({
      eventId: new Types.ObjectId(eventId),
      status: { $ne: "cancelled" },
    })
    await event.save()

    return NextResponse.json(
      {
        success: true,
        registration: {
          id: registration._id,
          eventId: registration.eventId,
          userId: registration.userId,
          registeredAt: registration.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
