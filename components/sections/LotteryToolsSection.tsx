import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CheckSquare,
  Flame,
  History,
  MapPin,
  Layers,
  Shuffle,
  ArrowRight,
} from "lucide-react"

interface Tool {
  icon: React.ElementType
  title: string
  description: string
  href: string | null
  comingSoon?: boolean
}

const TOOLS: Tool[] = [
  {
    icon: CheckSquare,
    title: "Check My Numbers",
    description: "Compare your numbers with the latest results.",
    href: "/states",
  },
  {
    icon: Flame,
    title: "Hot & Cold Numbers",
    description: "Find the most and least frequent numbers for any game.",
    href: "/games/powerball",
  },
  {
    icon: History,
    title: "Past 365 Days",
    description: "Browse a full year of historical lottery results.",
    href: "/games",
  },
  {
    icon: MapPin,
    title: "Browse by State",
    description: "Find lottery results for all 47 US states.",
    href: "/states",
  },
  {
    icon: Layers,
    title: "Browse by Game",
    description: "Explore Powerball, Mega Millions, Pick games and more.",
    href: "/games",
  },
  {
    icon: Shuffle,
    title: "Random Number Generator",
    description: "Generate quick picks for fun.",
    href: null,
    comingSoon: true,
  },
]

export function LotteryToolsSection() {
  return (
    <section aria-labelledby="lottery-tools-heading">
      <div className="mb-4 sm:mb-6">
        <h2
          id="lottery-tools-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl"
        >
          Lottery Tools
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          Explore results, statistics, and lottery resources.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.title} tool={tool} />
        ))}
      </div>
    </section>
  )
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon

  const inner = (
    <Card
      className={cn(
        "group h-full border-border/50 bg-card/50 transition-all duration-200",
        tool.comingSoon
          ? "opacity-70"
          : "hover:border-primary/30 hover:bg-card hover:shadow-md cursor-pointer"
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold leading-tight">{tool.title}</h3>
            {tool.comingSoon && (
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px] px-1.5 py-0"
              >
                Coming soon
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {tool.description}
          </p>
          {!tool.comingSoon && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open
              <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (tool.href && !tool.comingSoon) {
    return (
      <Link
        href={tool.href}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        aria-label={tool.title}
      >
        {inner}
      </Link>
    )
  }

  return <div className="h-full">{inner}</div>
}
