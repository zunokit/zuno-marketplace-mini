/**
 * Chain display helpers.
 *
 * Centralizes the "human-readable" representation of a chainId so
 * toast notifications, status pills, and copy strings all stay in
 * sync. Falls back to a short hex/decimal label when the chain is
 * not in our supported map.
 */

import { getNetworkConfig } from "@/lib/config/networks";

/**
 * Returns a short human-readable label for `chainId`. Prefers the
 * canonical name from the supported networks map; otherwise falls
 * back to a stable "Chain #N" label. Never throws.
 */
export function getChainDisplayName(chainId: number): string {
  if (!Number.isFinite(chainId) || chainId <= 0) {
    return "Unknown network";
  }
  const cfg = getNetworkConfig(chainId);
  if (cfg) return cfg.name;
  return `Chain #${chainId}`;
}

/**
 * Variants for chain-switch toasts. Kept as a small enum so we can
 * test the message-construction logic without instantiating sonner.
 */
export type ChainSwitchVariant = "supported" | "mismatch" | "unknown";

export interface ChainSwitchMessage {
  variant: ChainSwitchVariant;
  title: string;
  description?: string;
}

/**
 * Build the toast message for a chain-change event. Pure function,
 * deterministic given (chainId, supported), so the unit test can
 * cover every branch without DOM dependencies.
 */
export function buildChainSwitchMessage(
  chainId: number,
  isSupported: boolean,
  expectedChainId?: number,
): ChainSwitchMessage {
  const name = getChainDisplayName(chainId);

  if (isSupported) {
    return {
      variant: "supported",
      title: `Switched to ${name}`,
      description: `Now using chain ID ${chainId}.`,
    };
  }

  if (expectedChainId !== undefined) {
    const expectedName = getChainDisplayName(expectedChainId);
    return {
      variant: "mismatch",
      title: `${name} is not supported`,
      description: `Please switch to ${expectedName} (chain ID ${expectedChainId}).`,
    };
  }

  return {
    variant: "unknown",
    title: `${name} is not supported`,
    description: `Please switch to a supported network.`,
  };
}
