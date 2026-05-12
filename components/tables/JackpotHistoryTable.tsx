import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { JackpotHistoryEntry } from "@/lib/data/jackpotHistory"

interface JackpotHistoryTableProps {
  entries: JackpotHistoryEntry[]
}

export function JackpotHistoryTable({ entries }: JackpotHistoryTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <Card className="border-border/60 bg-card/70">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 px-4 py-3">Rank</TableHead>
                  <TableHead className="px-4 py-3">Prize</TableHead>
                  <TableHead className="px-4 py-3">Date</TableHead>
                  <TableHead className="px-4 py-3">Lottery/State</TableHead>
                  <TableHead className="px-4 py-3">Winners</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={`${entry.rank}-${entry.date}-${entry.prize}`}>
                    <TableCell className="px-4 py-3 font-semibold">#{entry.rank}</TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-lottery-gold">{entry.prize}</TableCell>
                    <TableCell className="px-4 py-3">{entry.date}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{entry.lotteryOrState}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">{entry.winners || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 md:hidden">
        {entries.map((entry) => (
          <Card key={`${entry.rank}-${entry.date}-${entry.prize}`} className="border-border/60 bg-card/70">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rank #{entry.rank}</span>
                <span className="text-sm font-bold text-lottery-gold">{entry.prize}</span>
              </div>

              <div className="grid grid-cols-1 gap-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Date: </span>
                  <span>{entry.date}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Lottery/State: </span>
                  <span>{entry.lotteryOrState}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Winners: </span>
                  <span>{entry.winners || "-"}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

