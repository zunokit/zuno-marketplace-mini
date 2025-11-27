'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Palette, 
  Gavel, 
  Package, 
  TrendingUp, 
  User, 
  Settings,
  Plus,
  Heart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/lib/store/hooks'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

const navigationItems = [
  {
    title: 'Collections',
    href: '/collections',
    icon: Palette,
    description: 'Explore collections',
  },
  {
    title: 'Auctions',
    href: '/auctions',
    icon: Gavel,
    description: 'Live auctions',
  },
  {
    title: 'Bundles',
    href: '/bundles',
    icon: Package,
    description: 'NFT bundles',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
    description: 'Market insights',
  },
]

const createItems = [
  {
    title: 'Create Collection',
    href: '/collections/create',
    icon: Palette,
  },
  {
    title: 'Mint NFT',
    href: '/nft/mint',
    icon: Plus,
  },
  {
    title: 'Start Auction',
    href: '/auctions/create',
    icon: Gavel,
  },
]

const userItems = [
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Favorites',
    href: '/profile/favorites',
    icon: Heart,
  },
  {
    title: 'Settings',
    href: '/profile/settings',
    icon: Settings,
  },
]

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const wallet = useAppSelector((state) => state.wallet)
  const notifications = useAppSelector((state) => state.notifications)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Palette className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Zuno</span>
            </div>
            {onToggle && (
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {onToggle && (
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            {!collapsed && (
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Explore
              </h3>
            )}
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                const NavItem = (
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-start",
                      collapsed && "px-2",
                      !collapsed && "px-3"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                      {!collapsed && item.title}
                    </Link>
                  </Button>
                )

                if (collapsed) {
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {NavItem}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                }

                return <div key={item.href}>{NavItem}</div>
              })}
            </nav>
          </div>

          {/* Create Section */}
          <div>
            {!collapsed && (
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Create
              </h3>
            )}
            <nav className="space-y-1">
              {createItems.map((item) => {
                const isActive = pathname === item.href
                const NavItem = (
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-start",
                      collapsed && "px-2",
                      !collapsed && "px-3"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                      {!collapsed && item.title}
                    </Link>
                  </Button>
                )

                if (collapsed) {
                  return (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {NavItem}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                }

                return <div key={item.href}>{NavItem}</div>
              })}
            </nav>
          </div>

          {/* User Section - Only show if wallet connected */}
          {wallet.isConnected && (
            <div>
              {!collapsed && (
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Account
                </h3>
              )}
              <nav className="space-y-1">
                {userItems.map((item) => {
                  const isActive = pathname === item.href
                  
                  const NavItem = (
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        "w-full justify-start relative",
                        collapsed && "px-2",
                        !collapsed && "px-3"
                      )}
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                        {!collapsed && item.title}
                      </Link>
                    </Button>
                  )

                  if (collapsed) {
                    return (
                      <TooltipProvider key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {NavItem}
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }

                  return <div key={item.href}>{NavItem}</div>
                })}
              </nav>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <aside className={cn(
      "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <SidebarContent />
    </aside>
  )
}