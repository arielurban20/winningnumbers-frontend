"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar, Clock } from "lucide-react"
import { buildSessionUrl, buildFamilyUrl } from "@/lib/utils/buildLotteryLinks"
import { cn } from "@/lib/utils"
import type { GameFamily } from "@/types/api"

interface StateDrawingScheduleTableProps {
  stateName: string
  stateSlug: string
  gameFamilies: GameFamily[]
}

// Days of week for column headers
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

interface ScheduleRow {
  gameName: string
  sessionName: string
  familySlug: string
  sessionDisplaySlug: string | undefined
  // Each day can have multiple draw times or null if no draw
  schedule: {
    sun: string | null
    mon: string | null
    tue: string | null
    wed: string | null
    thu: string | null
    fri: string | null
    sat: string | null
  }
  timezone: string | null
}

/**
 * Parse timezone from next_draw_text if available
 */
function parseTimezone(nextDrawText: string | null): string | null {
  if (!nextDrawText) return null
  const match = nextDrawText.match(/\b([A-Z]{2,3}T?)\s*$/i)
  return match ? match[1].toUpperCase() : null
}

/**
 * Parse draw time from various formats
 * Returns just the time portion (e.g., "10:59 PM")
 */
function parseDrawTime(nextDrawText: string | null): string | null {
  if (!nextDrawText) return null
  
  // Try to match time patterns like "10:59 PM", "9:00 AM", etc.
  const timeMatch = nextDrawText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (timeMatch) {
    return timeMatch[1].trim()
  }
  
  return null
}

/**
 * Infer drawing days from game/session names or return common patterns
 * This is a heuristic - real data would come from the API
 */
function inferDrawingDays(gameName: string, sessionName: string): string[] {
  const lowerGame = gameName.toLowerCase()
  const lowerSession = sessionName.toLowerCase()
  
  // Pick 3/4 games typically draw daily with midday and evening sessions
  if (lowerGame.includes("pick") || lowerGame.includes("cash") && lowerGame.includes("pop")) {
    return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  }
  
  // Powerball draws Mon, Wed, Sat
  if (lowerGame.includes("powerball")) {
    return ["mon", "wed", "sat"]
  }
  
  // Mega Millions draws Tue, Fri
  if (lowerGame.includes("mega")) {
    return ["tue", "fri"]
  }
  
  // Lucky for Life draws Mon, Thu
  if (lowerGame.includes("lucky") && lowerGame.includes("life")) {
    return ["mon", "thu"]
  }
  
  // Cash4Life draws daily
  if (lowerGame.includes("cash4life") || lowerGame.includes("cash 4 life")) {
    return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  }
  
  // Default to MWF for state lottos
  if (lowerGame.includes("lotto")) {
    return ["mon", "wed", "sat"]
  }
  
  // Fantasy 5 and similar typically draw daily
  if (lowerGame.includes("fantasy") || lowerGame.includes("match")) {
    return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  }
  
  // Default fallback - assume daily
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
}

/**
 * Build schedule rows from game families
 */
function buildScheduleRows(gameFamilies: GameFamily[], stateSlug: string): ScheduleRow[] {
  const rows: ScheduleRow[] = []
  
  for (const family of gameFamilies) {
    for (const session of family.sessions) {
      const draw = session.latestDraw
      const nextDrawText = draw?.next_draw_text || draw?.next_draw_at_local || null
      const timezone = parseTimezone(nextDrawText) || draw?.next_draw_timezone || null
      const drawTime = parseDrawTime(nextDrawText)
      
      // Infer which days this game draws
      const drawingDays = inferDrawingDays(family.familyName, session.sessionName)
      
      // Build schedule object
      const schedule = {
        sun: drawingDays.includes("sun") ? drawTime : null,
        mon: drawingDays.includes("mon") ? drawTime : null,
        tue: drawingDays.includes("tue") ? drawTime : null,
        wed: drawingDays.includes("wed") ? drawTime : null,
        thu: drawingDays.includes("thu") ? drawTime : null,
        fri: drawingDays.includes("fri") ? drawTime : null,
        sat: drawingDays.includes("sat") ? drawTime : null,
      }
      
      rows.push({
        gameName: family.familyName,
        sessionName: session.sessionName === "Main" ? "" : session.sessionName,
        familySlug: family.familySlug,
        sessionDisplaySlug: session.sessionDisplaySlug,
        schedule,
        timezone,
      })
    }
  }
  
  return rows
}

export function StateDrawingScheduleTable({
  stateName,
  stateSlug,
  gameFamilies,
}: StateDrawingScheduleTableProps) {
  const scheduleRows = buildScheduleRows(gameFamilies, stateSlug)

  if (scheduleRows.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-xl">{stateName} Drawing Schedule</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Weekly drawing times for all games
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile: Stacked cards view */}
        <div className="md:hidden divide-y divide-border/50">
          {scheduleRows.map((row, idx) => {
            const href = row.sessionDisplaySlug
              ? buildSessionUrl(stateSlug, row.familySlug, row.sessionDisplaySlug)
              : buildFamilyUrl(stateSlug, row.familySlug)

            // Get active days for mobile display
            const activeDays = DAYS.filter(day => 
              row.schedule[day.toLowerCase() as keyof typeof row.schedule]
            )

            return (
              <div key={`${row.familySlug}-${row.sessionName}-${idx}`} className="p-3 space-y-2">
                {/* Game name and session */}
                <div className="flex items-center gap-2">
                  <Link
                    href={href}
                    className="font-medium text-sm text-primary hover:underline"
                  >
                    {row.gameName}
                  </Link>
                  {row.sessionName && (
                    <span className="text-xs text-muted-foreground">
                      ({row.sessionName})
                    </span>
                  )}
                </div>
                
                {/* Days and time */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 flex-wrap">
                    {activeDays.map(day => (
                      <span 
                        key={day}
                        className="px-1.5 py-0.5 rounded bg-lottery-green/10 text-lottery-green font-medium"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {row.schedule.mon || row.schedule.tue || row.schedule.sun || "TBD"}
                      {row.timezone && ` ${row.timezone}`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop: Table view with day columns */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[180px] sticky left-0 bg-card z-10">Game</TableHead>
                {DAYS.map(day => (
                  <TableHead key={day} className="text-center min-w-[80px]">
                    {day}
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[60px]">TZ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduleRows.map((row, idx) => {
                const href = row.sessionDisplaySlug
                  ? buildSessionUrl(stateSlug, row.familySlug, row.sessionDisplaySlug)
                  : buildFamilyUrl(stateSlug, row.familySlug)

                return (
                  <TableRow key={`${row.familySlug}-${row.sessionName}-${idx}`}>
                    <TableCell className="sticky left-0 bg-card z-10">
                      <Link
                        href={href}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.gameName}
                        {row.sessionName && (
                          <span className="ml-1 text-muted-foreground font-normal">
                            ({row.sessionName})
                          </span>
                        )}
                      </Link>
                    </TableCell>
                    {DAYS.map(day => {
                      const time = row.schedule[day.toLowerCase() as keyof typeof row.schedule]
                      return (
                        <TableCell key={day} className="text-center">
                          {time ? (
                            <span className="text-sm font-mono text-foreground">
                              {time}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center">
                      {row.timezone ? (
                        <span className="text-xs font-mono text-muted-foreground">
                          {row.timezone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Note */}
        <div className="border-t bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Schedule is approximate. Check official {stateName} Lottery for accurate times.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
