"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { Palette, Gavel, Menu, Plus, User, Store } from "lucide-react";

const navigationItems = [
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: Store,
    description: "Buy NFTs",
  },
  {
    title: "Collections",
    href: "/collections",
    icon: Palette,
    description: "Explore NFT collections",
  },
  {
    title: "Auctions",
    href: "/auctions",
    icon: Gavel,
    description: "Participate in auctions",
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    description: "Your profile",
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
      <div className="max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Menu Button - Show on tablets too */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                ))}

                {/* Create Section in Mobile */}
                <div className="border-t pt-4 mt-4">
                  <p className="px-3 text-sm font-semibold text-muted-foreground mb-2">
                    Create
                  </p>
                  <Link
                    href="/collections/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Collection</span>
                  </Link>
                  <Link
                    href="/auctions/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Gavel className="h-4 w-4" />
                    <span>Create Auction</span>
                  </Link>
                </div>


              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:block">Zuno</span>
          </Link>
        </div>

        {/* Navigation - Only show on large screens */}
        <nav className="hidden lg:flex items-center">
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-2 xl:px-4 py-2",
                  pathname === item.href && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span className="hidden xl:inline">{item.title}</span>
              </Link>
            ))}

            {/* Create Button */}
            <Button variant="ghost" size="sm" className="h-10 px-2 xl:px-4" asChild>
              <Link href="/collections/create">
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="hidden xl:inline">Create Collection</span>
              </Link>
            </Button>
          </div>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ModeToggle />
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
