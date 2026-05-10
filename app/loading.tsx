import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/95">
        <div className="max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="hidden lg:flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="hidden md:block h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          {/* Hero Section Skeleton */}
          <div className="space-y-4 mb-12">
            <Skeleton className="h-10 w-48 md:h-12 md:w-64" />
            <Skeleton className="h-6 w-full max-w-xl" />
            <Skeleton className="h-6 w-full max-w-lg" />
            <div className="flex gap-3 mt-6">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* National Games Section */}
          <div className="mb-12">
            <Skeleton className="h-8 w-40 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Browse by Game Section */}
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>

          {/* States Section */}
          <div>
            <Skeleton className="h-8 w-56 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
