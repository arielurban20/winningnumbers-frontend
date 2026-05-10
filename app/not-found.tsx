import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Container } from "@/components/layout"
import { FileQuestion, Home, Search } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found | Winning Numbers",
  description: "The page you are looking for could not be found. Browse our lottery results by state or search for your favorite game.",
}

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-8">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been 
            moved or no longer exists.
          </p>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="default">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/states">
                <Search className="mr-2 h-4 w-4" />
                Browse States
              </Link>
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">Popular destinations:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/games/powerball">Powerball</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/games/mega-millions">Mega Millions</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/states">All States</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
