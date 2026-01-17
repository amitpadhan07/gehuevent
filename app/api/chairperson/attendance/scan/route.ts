import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Registration, Event } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload || payload.role !== "chairperson") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { qrData, eventId, latitude, longitude } = await req.json()

    if (!qrData || !eventId) {
      return NextResponse.json({ error: "QR data and eventId are required" }, { status: 400 })
    }

    // Parse QR data
    let qrPayload: any
    try {
      qrPayload = JSON.parse(qrData)
    } catch {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    const registrationId = qrPayload.registrationId
    if (!registrationId) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 })
    }

    // Get registration
    const registration = await Registration.findById(new Types.ObjectId(registrationId))

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.eventId.toString() !== eventId) {
      return NextResponse.json({ error: "QR code does not match event" }, { status: 400 })
    }

    if (registration.attendance.isMarked) {
      return NextResponse.json(
        { error: "Attendance already marked for this registration", code: "DUPLICATE_SCAN" },
        { status: 400 }
      )
    }

    // Mark attendance
    registration.attendance.isMarked = true
    registration.attendance.currentStatus = "present"
    registration.attendance.logs.push({
      markedBy: new Types.ObjectId(payload.userId),
      markedAt: new Date(),
      status: "present",
      location: latitude && longitude ? { lat: latitude, long: longitude } : undefined,
    })
    await registration.save()

    return NextResponse.json({
      success: true,
      message: "Attendance marked",
      registration: { id: registrationId, status: "present" },
    })
  } catch (error: any) {
    console.error("Attendance scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
