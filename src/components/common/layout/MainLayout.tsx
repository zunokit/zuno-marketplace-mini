'use client'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import { GlobalLoading } from '@/components/ui/GlobalLoading'
import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { useAppSelector } from '@/lib/store/hooks'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  showSidebar?: boolean
  sidebarCollapsed?: boolean
}

export function MainLayout({ 
  children, 
  className,
  showSidebar = false,
  sidebarCollapsed = false 
}: MainLayoutProps) {
  const { loading: walletLoading } = useAppSelector((state) => state.wallet)
  const { loading: listingLoading } = useAppSelector((state) => state.listing)
  const { loading: collectionsLoading } = useAppSelector((state) => state.collections)
  
  const isLoading = walletLoading || listingLoading || collectionsLoading

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Loading Overlay */}
      {isLoading && <GlobalLoading />}
      
      {/* Header */}
      <Header />
      
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar collapsed={sidebarCollapsed} />
        )}
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-hidden",
          showSidebar && !sidebarCollapsed && "ml-64",
          showSidebar && sidebarCollapsed && "ml-16",
          className
        )}>
          <div className="container mx-auto px-4 py-6 h-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Notification Center */}
      <NotificationCenter />
    </div>
  )
}