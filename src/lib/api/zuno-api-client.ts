import { logger } from "@/lib/utils/logger";

/**
 * Configuration for Zuno API Client
 */
export interface ZunoApiConfig {
  baseUrl: string;
  apiKey?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

/**
 * Contract ABI from API
 */
export interface ContractABI {
  id: string;
  contractAddress: string;
  contractName: string;
  network: string;
  chainId: number;
  abi: any[]; // Ethers.js ABI format
  abiHash: string;
  ipfsUrl?: string;
  verified: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contract version information
 */
export interface ContractVersion {
  versionId: string;
  abiId: string;
  createdAt: string;
  changes?: string;
}

/**
 * Client for Zuno Marketplace ABIs API
 * Fetches contract ABIs dynamically from the API
 */
export class ZunoApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: ZunoApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    return headers;
  }

  /**
   * Make API request with error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      logger.info("Fetching from Zuno API", { url }, { component: "ZunoApiClient", action: "request" });

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "API request failed");
      }

      return data.data as T;
    } catch (error) {
      logger.error("Zuno API request failed", error as Error, {
        component: "ZunoApiClient",
        action: "request",
      });
      throw error;
    }
  }

  /**
   * Get all contracts
   */
  async getContracts(params?: {
    network?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ContractABI[]> {
    const queryParams = new URLSearchParams();

    if (params?.network) queryParams.set("network", params.network);
    if (params?.verified !== undefined)
      queryParams.set("verified", String(params.verified));
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.limit) queryParams.set("limit", String(params.limit));

    const query = queryParams.toString();
    const endpoint = `/api/contracts${query ? `?${query}` : ""}`;

    return this.request<ContractABI[]>(endpoint);
  }

  /**
   * Get contract by name
   */
  async getContractByName(
    name: string,
    network?: string
  ): Promise<ContractABI> {
    const queryParams = new URLSearchParams();
    if (network) queryParams.set("network", network);

    const query = queryParams.toString();
    const endpoint = `/api/contracts/by-name/${name}${query ? `?${query}` : ""}`;

    return this.request<ContractABI>(endpoint);
  }

  /**
   * Get contract ABI by address
   */
  async getContractABI(
    address: string,
    network?: string
  ): Promise<ContractABI> {
    const queryParams = new URLSearchParams();
    if (network) queryParams.set("network", network);

    const query = queryParams.toString();
    const endpoint = `/api/contracts/${address}/abi${query ? `?${query}` : ""}`;

    return this.request<ContractABI>(endpoint);
  }

  /**
   * Get contract versions
   */
  async getContractVersions(
    addressOrName: string,
    network?: string
  ): Promise<ContractVersion[]> {
    const queryParams = new URLSearchParams();
    if (network) queryParams.set("network", network);

    const query = queryParams.toString();
    const endpoint = `/api/contracts/${addressOrName}/versions${query ? `?${query}` : ""}`;

    return this.request<ContractVersion[]>(endpoint);
  }

  /**
   * Get specific version ABI
   */
  async getContractVersionABI(
    addressOrName: string,
    versionId: string,
    network?: string
  ): Promise<ContractABI> {
    const queryParams = new URLSearchParams();
    if (network) queryParams.set("network", network);

    const query = queryParams.toString();
    const endpoint = `/api/contracts/${addressOrName}/versions/${versionId}${query ? `?${query}` : ""}`;

    return this.request<ContractABI>(endpoint);
  }
}

/**
 * Create Zuno API client instance
 */
export function createZunoApiClient(): ZunoApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_ZUNO_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_ZUNO_API_KEY;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_ZUNO_API_URL is not defined in environment variables");
  }

  return new ZunoApiClient({
    baseUrl,
    apiKey,
  });
}

/**
 * Default Zuno API client instance
 */
export const zunoApiClient = createZunoApiClient();
