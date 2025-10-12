/**
 * UUID Generator Utility
 * Generates unique identifiers for React keys and other purposes
 */

/**
 * Generate a simple UUID v4-like string
 * Not cryptographically secure, but sufficient for React keys
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short UUID (8 characters)
 * Useful for shorter unique identifiers
 */
export function generateShortUUID(): string {
  return Math.random().toString(36).substr(2, 8);
}

/**
 * Generate a unique key for React components
 * Combines prefix with UUID for better debugging
 */
export function generateReactKey(prefix?: string): string {
  const uuid = generateShortUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}
