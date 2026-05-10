import { NextResponse } from "next/server"
import { getHistoricalGames } from "@/lib/api/historical"

export async function GET() {
  try {
    const games = await getHistoricalGames()
    return NextResponse.json(games)
  } catch (error) {
    console.error("Error fetching historical games:", error)
    return NextResponse.json([], { status: 500 })
  }
}
