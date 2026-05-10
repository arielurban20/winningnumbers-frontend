import { NextResponse } from "next/server"
import { getHistoricalResults } from "@/lib/api/historical"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameSlug = searchParams.get("game_slug")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    
    if (!gameSlug || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: game_slug, start_date, end_date" },
        { status: 400 }
      )
    }
    
    const results = await getHistoricalResults(gameSlug, startDate, endDate)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching historical results:", error)
    return NextResponse.json([], { status: 500 })
  }
}
