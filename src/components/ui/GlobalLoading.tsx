'use client'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlobalLoadingProps {
  className?: string
  message?: string
}

export function GlobalLoading({ className, message = 'Loading...' }: GlobalLoadingProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      "flex items-center justify-center",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}