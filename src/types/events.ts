/**
 * Event-related type definitions
 */

export interface ParsedEvent {
  name: string;
  address: string;
  blockNumber: number;
  transactionHash: string;
  args: Record<string, unknown>;
  timestamp: number;
}

export interface EventSubscription {
  id: string;
  contract: unknown; // ethers.Contract
  event: string;
  filter?: Record<string, unknown>;
  callback: (event: ParsedEvent) => void;
  unsubscribe: () => void;
}

export interface ActivityEvent {
  id: string;
  type: "mint" | "transfer" | "sale" | "list" | "approval";
  from: string;
  to: string;
  tokenId?: string;
  amount?: string;
  price?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  description: string;
}

export interface ActivityTrackingProps {
  collectionAddress: string;
  tokenType: "ERC721" | "ERC1155";
}

export type EventFilter =
  | "all"
  | "mint"
  | "transfer"
  | "sale"
  | "list"
  | "approval";
