import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Home, ArrowLeft } from "lucide-react"

export default function StateNotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <MapPin className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight">State Not Found</h1>
      
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        We couldn&apos;t find the state you&apos;re looking for. It may not be available in our 
        system or the URL might be incorrect.
      </p>
      
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild variant="default">
          <Link href="/states">
            <MapPin className="mr-2 h-4 w-4" />
            Browse All States
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
