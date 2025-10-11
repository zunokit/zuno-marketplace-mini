'use client'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { markAsRead } from '@/lib/store/slices/notificationSlice'

export function NotificationCenter() {
  const notifications = useAppSelector((state) => state.notifications)
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Show toast for new unread notifications
    notifications.items
      .filter(notification => !notification.read)
      .slice(-1) // Only show the latest notification
      .forEach(notification => {
        const toastFunction = {
          success: toast.success,
          error: toast.error,
          warning: toast.warning,
          info: toast.info,
        }[notification.type] || toast

        toastFunction(notification.title, {
          description: notification.message,
          action: notification.actionUrl ? {
            label: 'View',
            onClick: () => window.open(notification.actionUrl, '_blank'),
          } : undefined,
          onDismiss: () => {
            dispatch(markAsRead(notification.id))
          },
        })

        // Auto-mark as read after showing
        setTimeout(() => {
          dispatch(markAsRead(notification.id))
        }, 100)
      })
  }, [notifications.items, dispatch])

  return null // This component only handles side effects
}