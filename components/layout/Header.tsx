"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, ChevronRight, Trophy, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home", icon: null },
  { href: "/states", label: "States", icon: MapPin },
  { href: "/games/powerball", label: "Powerball", icon: Trophy },
  { href: "/games/mega-millions", label: "Mega Millions", icon: Trophy },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      {/* Premium gradient accent line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="w-full max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Logo - Only icon, no text */}
        <Link 
          href="/" 
          className="flex items-center group"
          aria-label="Winning Numbers - Go to homepage"
          title="Winning Numbers"
        >
          <div className="relative h-10 w-10 flex-shrink-0 transition-transform group-hover:scale-105 overflow-hidden">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="sr-only">Winning Numbers</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
              )}
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.label}
              {isActive(link.href) && (
                <span className="absolute -bottom-px left-4 right-4 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Quick Action Button - Desktop */}
          <Button asChild variant="default" size="sm" className="hidden md:flex shadow-sm">
            <Link href="/states">
              Browse States
            </Link>
          </Button>
          
          <ThemeToggle />
          
          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 hover:bg-accent/80" 
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 border-l-border/30">
              <SheetHeader className="border-b border-border/30 p-6 bg-muted/30">
                <SheetTitle className="flex items-center gap-3">
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt=""
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <span className="font-bold">
                    Winning<span className="text-primary">Numbers</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4 gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-4 text-base font-medium transition-all",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent/80"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {link.icon && <link.icon className="h-5 w-5" />}
                      {link.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </nav>
              <div className="mt-auto border-t border-border/30 p-4 bg-muted/20">
                <Button asChild className="w-full" size="lg">
                  <Link href="/states" onClick={() => setIsOpen(false)}>
                    Browse All States
                  </Link>
                </Button>
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Latest lottery results updated daily
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
