import { toast } from 'sonner';
import { ZunoSDKError, ErrorCodes } from 'zuno-marketplace-sdk';

/**
 * Handle SDK errors with user-friendly behavior.
 * Silently ignores user rejections, shows toast for other errors.
 */
export function handleSdkError(error: unknown, fallbackMessage = 'Transaction failed'): void {
  // User cancelled - silent, no error needed
  if (isUserRejected(error)) {
    return;
  }

  // Extract message
  const message = error instanceof Error ? error.message : fallbackMessage;
  toast.error(message);
}

/**
 * Check if error is user rejection (from SDK or wagmi)
 */
export function isUserRejected(error: unknown): boolean {
  // Check SDK user rejection
  if (error instanceof ZunoSDKError && error.code === ErrorCodes.USER_REJECTED) {
    return true;
  }

  // Check wagmi/user rejection by error message or code
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('user rejected') ||
      message.includes('user denied') ||
      message.includes('action rejected') ||
      message.includes('cancelled by user')
    ) {
      return true;
    }

    // Check wagmi error code (numeric or string)
    const err = error as { code?: number | string };
    if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
      return true;
    }
  }

  return false;
}

/**
 * Check if error should be logged (filters out user rejections)
 */
export function shouldLogError(error: unknown): boolean {
  return !isUserRejected(error);
}
