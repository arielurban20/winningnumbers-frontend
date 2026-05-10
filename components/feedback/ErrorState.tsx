"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load the data. Please try again.",
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}
