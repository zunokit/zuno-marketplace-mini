"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import {
  Store,
  Palette,
  Gavel,
  User,
  Settings,
  Bell,
  Menu,
  Plus,
} from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";

const navigationItems = [
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: Store,
    description: "Browse and buy NFTs",
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
];

export function Header() {
  const pathname = usePathname();
  const wallet = useAppSelector((state) => state.wallet);
  const notifications = useAppSelector((state) => state.notifications);
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
                    <Palette className="h-4 w-4" />
                    <span>Create Collection</span>
                  </Link>
                  <Link
                    href="/nft/mint"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Mint NFT</span>
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

                {/* User Section in Mobile */}
                {wallet.isConnected && (
                  <div className="border-t pt-4 mt-4">
                    <p className="px-3 text-sm font-semibold text-muted-foreground mb-2">
                      Account
                    </p>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/profile/collections"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Palette className="h-4 w-4" />
                      <span>My Collections</span>
                    </Link>
                    <Link
                      href="/profile/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </div>
                )}
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

            {/* Create Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 px-2 xl:px-4">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="hidden xl:inline">Create</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href="/collections/create"
                    className="flex items-center"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Create Collection
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/nft/mint" className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Mint NFT
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auctions/create" className="flex items-center">
                    <Gavel className="mr-2 h-4 w-4" />
                    Create Auction
                  </Link>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          {wallet.isConnected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="h-4 w-4" />
                  {notifications.unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 text-[10px] sm:text-xs flex items-center justify-center"
                    >
                      {notifications.unreadCount > 9
                        ? "9+"
                        : notifications.unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.items.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-4"
                  >
                    <div className="flex items-center w-full">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.items.length === 0 && (
                  <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Toggle */}
          <ModeToggle />

          {/* User Menu or Wallet Connect */}
          {wallet.isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {wallet.account?.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      My Account
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {wallet.account?.slice(0, 6)}...
                      {wallet.account?.slice(-4)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile/collections"
                    className="flex items-center"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    My Collections
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <WalletConnectButton />
          )}
        </div>
      </div>
    </header>
  );
}
