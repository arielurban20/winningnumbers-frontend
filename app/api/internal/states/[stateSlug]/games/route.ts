import { NextResponse } from "next/server"
import { getStateGames } from "@/lib/api/states"

interface RouteParams {
  params: Promise<{ stateSlug: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { stateSlug } = await params
    const games = await getStateGames(stateSlug)
    return NextResponse.json(games)
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json([], { status: 500 })
  }
}
