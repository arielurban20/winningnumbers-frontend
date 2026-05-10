import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SearchX, ArrowLeft, Home } from "lucide-react"

export default function SessionNotFound() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Session Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The lottery session you're looking for doesn't exist or may have been moved.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/states">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse States
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
