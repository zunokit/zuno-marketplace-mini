import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { zunoApiClient, ContractABI } from "@/lib/api/zuno-api-client";
import { logger } from "@/lib/utils/logger";

/**
 * Query keys for ABI caching
 */
export const abiQueryKeys = {
  all: ["contract-abis"] as const,
  byName: (name: string, network?: string) =>
    ["contract-abis", "by-name", name, network] as const,
  byAddress: (address: string, network?: string) =>
    ["contract-abis", "by-address", address, network] as const,
  versions: (addressOrName: string, network?: string) =>
    ["contract-abis", "versions", addressOrName, network] as const,
  versionABI: (addressOrName: string, versionId: string, network?: string) =>
    ["contract-abis", "version", addressOrName, versionId, network] as const,
};

/**
 * Hook to fetch contract ABI by name
 * Uses TanStack Query for caching and automatic refetching
 *
 * @param name - Contract name (e.g., "UserHub", "ERC721NFTExchange")
 * @param network - Optional network filter
 * @param enabled - Whether to enable the query (default: true)
 * @returns UseQueryResult with ContractABI data
 *
 * @example
 * ```tsx
 * const { data: abi, isLoading, error } = useContractABIByName("UserHub");
 * if (abi) {
 *   const contract = new ethers.Contract(address, abi.abi, signer);
 * }
 * ```
 */
export function useContractABIByName(
  name: string,
  network?: string,
  enabled: boolean = true
): UseQueryResult<ContractABI, Error> {
  return useQuery({
    queryKey: abiQueryKeys.byName(name, network),
    queryFn: async () => {
      logger.info(
        "Fetching contract ABI by name",
        { name, network },
        { component: "useContractABIByName", action: "fetch" }
      );

      const abi = await zunoApiClient.getContractByName(name, network);

      logger.success(
        "Successfully fetched contract ABI",
        { name, abiId: abi.id },
        { component: "useContractABIByName", action: "fetch" }
      );

      return abi;
    },
    enabled: enabled && !!name,
    staleTime: 1000 * 60 * 60, // 1 hour - ABIs rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours - Keep in cache for a day
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch contract ABI by address
 *
 * @param address - Contract address
 * @param network - Optional network filter
 * @param enabled - Whether to enable the query (default: true)
 * @returns UseQueryResult with ContractABI data
 *
 * @example
 * ```tsx
 * const { data: abi } = useContractABIByAddress("0x1234...", "ethereum");
 * ```
 */
export function useContractABIByAddress(
  address: string,
  network?: string,
  enabled: boolean = true
): UseQueryResult<ContractABI, Error> {
  return useQuery({
    queryKey: abiQueryKeys.byAddress(address, network),
    queryFn: async () => {
      logger.info(
        "Fetching contract ABI by address",
        { address, network },
        { component: "useContractABIByAddress", action: "fetch" }
      );

      const abi = await zunoApiClient.getContractABI(address, network);

      logger.success(
        "Successfully fetched contract ABI",
        { address, abiId: abi.id },
        { component: "useContractABIByAddress", action: "fetch" }
      );

      return abi;
    },
    enabled: enabled && !!address,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to prefetch contract ABI by name
 * Useful for preloading ABIs before they're needed
 *
 * @param name - Contract name
 * @param network - Optional network filter
 *
 * @example
 * ```tsx
 * const prefetchABI = usePrefetchContractABI();
 *
 * // Prefetch on hover or mount
 * <button onMouseEnter={() => prefetchABI("UserHub")}>
 *   Load User Hub
 * </button>
 * ```
 */
export function usePrefetchContractABI() {
  return async (name: string, network?: string) => {
    logger.info(
      "Prefetching contract ABI",
      { name, network },
      { component: "usePrefetchContractABI", action: "prefetch" }
    );

    await zunoApiClient.getContractByName(name, network);
  };
}

/**
 * Extract just the ABI array from ContractABI for ethers.js
 *
 * @param contractABI - Full ContractABI object from API
 * @returns ABI array for use with ethers.Contract
 *
 * @example
 * ```tsx
 * const { data: contractABI } = useContractABIByName("UserHub");
 * const abi = getABIArray(contractABI);
 * const contract = new ethers.Contract(address, abi, signer);
 * ```
 */
export function getABIArray(contractABI: ContractABI | undefined): any[] {
  return contractABI?.abi || [];
}
