import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Attach payload to request
    const newReq = new NextRequest(req)
    ;(newReq as any).user = payload

    return handler(newReq)
  }
}

export function requireRole(...roles: string[]) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const user = (req as any).user

      if (!user || !roles.includes(user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }

      return handler(req)
    }
  }
}
