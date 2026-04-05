import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

    const deleted = await prisma.order.deleteMany({
      where: {
        status: "pending",
        createdAt: { lt: oneMinuteAgo },
      },
    })

    console.log("🧹 Deleted pending orders:", deleted.count)
    return NextResponse.json({ success: true, deleted: deleted.count })
  } catch (err) {
    console.error("Cleanup error:", err)
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}