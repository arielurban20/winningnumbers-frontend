import { NextResponse } from "next/server"
import { getStates } from "@/lib/api/states"

export async function GET() {
  try {
    const states = await getStates()
    return NextResponse.json(states)
  } catch (error) {
    console.error("Error fetching states:", error)
    return NextResponse.json([], { status: 500 })
  }
}
