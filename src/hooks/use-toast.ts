import { toast as sonnerToast } from 'sonner'

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', action }: ToastProps) => {
    const toastFunction = variant === 'destructive' ? sonnerToast.error : sonnerToast.success

    toastFunction(title, {
      description,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    })
  }

  return { toast }
}