import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Club } from "@/lib/models"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search") || ""

    const filter: any = { isActive: true }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    const clubs = await Club.find(filter).sort({ name: 1 }).limit(100).lean()

    const formattedClubs = clubs.map((c: any) => ({
      id: c._id,
      name: c.name,
      description: c.description,
      logoUrl: c.assets?.logoUrl,
      bannerUrl: c.assets?.bannerUrl,
    }))

    return NextResponse.json({ success: true, clubs: formattedClubs })
  } catch (error: any) {
    console.error("Clubs fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name, description, logoUrl, bannerUrl, websiteUrl, email, phone } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    const club = await Club.create({
      name,
      description,
      assets: {
        logoUrl,
        bannerUrl,
      },
      contact: {
        websiteUrl,
        email,
        phone,
      },
    })

    return NextResponse.json(
      {
        success: true,
        club: {
          id: club._id,
          name: club.name,
          description: club.description,
          logoUrl: club.assets.logoUrl,
          bannerUrl: club.assets.bannerUrl,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Club creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
