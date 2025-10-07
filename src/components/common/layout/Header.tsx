"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import {
  Store,
  Palette,
  Gavel,
  Package,
  TrendingUp,
  User,
  Settings,
  Bell,
  Search,
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
  {
    title: "Bundles",
    href: "/bundles",
    icon: Package,
    description: "Buy NFT bundles",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    description: "View market analytics",
  },
];

export function Header() {
  const pathname = usePathname();
  const wallet = useAppSelector((state) => state.wallet);
  const notifications = useAppSelector((state) => state.notifications);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Zuno</span>
          </Link>
        </div>

        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === item.href &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}

            {/* Create Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Create</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/collections/create"
                      >
                        <Palette className="h-6 w-6" />
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Create Collection
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Deploy your own NFT collection with custom metadata
                          and royalties.
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/nft/mint" title="Mint NFT">
                    Create and mint individual NFTs to existing collections.
                  </ListItem>
                  <ListItem href="/auctions/create" title="Create Auction">
                    Start an auction for your NFTs with custom parameters.
                  </ListItem>
                  <ListItem href="/bundles/create" title="Create Bundle">
                    Bundle multiple NFTs together for sale.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          {wallet.isConnected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications.unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                    >
                      {notifications.unreadCount}
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

const ListItem = ({
  className,
  title,
  children,
  href,
  ...props
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
