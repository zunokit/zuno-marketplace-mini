"use client";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { GlobalLoading } from "@/components/ui/GlobalLoading";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { useAppSelector } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
}

export function MainLayout({
  children,
  className,
  showSidebar = false,
  sidebarCollapsed = false,
}: MainLayoutProps) {
  const { isConnecting: walletConnecting } = useAppSelector(
    (state) => state.wallet
  );

  const isLoading = walletConnecting;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Loading Overlay */}
      {isLoading && <GlobalLoading />}

      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile */}
        {showSidebar && (
          <div className="hidden md:block">
            <Sidebar collapsed={sidebarCollapsed} />
          </div>
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 overflow-hidden",
            showSidebar && !sidebarCollapsed && "md:ml-64",
            showSidebar && sidebarCollapsed && "md:ml-16",
            className
          )}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}
