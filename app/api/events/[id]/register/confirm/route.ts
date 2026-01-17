import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Registration, Event, User } from "@/lib/models"
import { verifyToken } from "@/lib/auth"
import { sendEmail, generateRegistrationEmailHTML } from "@/lib/brevo"
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

    const eventId = params.id
    const { registrationId } = await req.json()

    // Get registration with event details
    const registration = await Registration.findById(new Types.ObjectId(registrationId))
      .populate({
        path: "eventId",
        select: "title schedule location isOnline onlineLink clubId",
        populate: {
          path: "clubId",
          select: "name",
        },
      })
      .populate("userId", "email fullName")

    if (
      !registration ||
      registration.eventId._id.toString() !== eventId ||
      registration.userId._id.toString() !== payload.userId
    ) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Generate and send email
    const emailHTML = generateRegistrationEmailHTML({
      eventTitle: registration.eventId.title,
      eventDate: registration.eventId.schedule.startDate,
      clubName: registration.eventId.clubId.name,
      venue: registration.eventId.location.venueAddress,
      studentName: registration.userId.fullName,
      qrCodeDataUrl: registration.qrCode.data,
      onlineLink: registration.eventId.isOnline ? registration.eventId.onlineLink : undefined,
    })

    const emailSent = await sendEmail({
      to: [{ email: registration.userId.email, name: registration.userId.fullName }],
      subject: `Registration Confirmed – ${registration.eventId.title}`,
      htmlContent: emailHTML,
    })

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Confirmation email sent",
    })
  } catch (error: any) {
    console.error("[v0] Email confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
