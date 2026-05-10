import { Empty } from "@/components/ui/empty"
import { Search, Calendar, BarChart3 } from "lucide-react"

interface EmptyStateProps {
  title?: string
  description?: string
  type?: "no-results" | "no-data" | "no-stats" | "empty"
}

const defaultMessages = {
  "no-results": {
    title: "No Results Found",
    description: "There are no lottery results matching your criteria. Try adjusting your filters.",
    Icon: Search,
  },
  "no-data": {
    title: "No Data Available",
    description: "We don't have any data for this selection yet. Please check back later.",
    Icon: Calendar,
  },
  "no-stats": {
    title: "No Statistics Available",
    description: "Statistics could not be loaded from the backend. The data source may be unavailable or this game may not have enough draws yet.",
    Icon: BarChart3,
  },
  "empty": {
    title: "Nothing Here",
    description: "There's nothing to display at the moment.",
    Icon: Search,
  },
}

export function EmptyState({
  title,
  description,
  type = "no-results",
}: EmptyStateProps) {
  const defaults = defaultMessages[type]
  const { Icon } = defaults

  return (
    <Empty className="py-12">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title || defaults.title}</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description || defaults.description}
        </p>
      </div>
    </Empty>
  )
}
