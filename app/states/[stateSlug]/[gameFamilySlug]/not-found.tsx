import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ticket, ArrowLeft, MapPin } from "lucide-react"

export default function GameNotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <Ticket className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight">Game Not Found</h1>
      
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        We couldn&apos;t find the lottery game you&apos;re looking for. It may not be available 
        in this state or the URL might be incorrect.
      </p>
      
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild variant="outline">
          <Link href="/states">
            <MapPin className="mr-2 h-4 w-4" />
            Browse States
          </Link>
        </Button>
      </div>
    </div>
  )
}
