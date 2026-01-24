import { toast } from 'sonner';
import { ZunoSDKError, ErrorCodes } from 'zuno-marketplace-sdk';

/**
 * Handle SDK errors with user-friendly behavior.
 * Silently ignores user rejections, shows toast for other errors.
 */
export function handleSdkError(error: unknown, fallbackMessage = 'Transaction failed'): void {
  // User cancelled - silent, no error needed
  if (error instanceof ZunoSDKError && error.code === ErrorCodes.USER_REJECTED) {
    return;
  }

  // Extract message
  const message = error instanceof Error ? error.message : fallbackMessage;
  toast.error(message);
}

/**
 * Check if error is user rejection
 */
export function isUserRejected(error: unknown): boolean {
  return error instanceof ZunoSDKError && error.code === ErrorCodes.USER_REJECTED;
}
