import { useQuery } from '@tanstack/react-query';
import { useZuno } from 'zuno-marketplace-sdk/react';

export interface Listing {
  id: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  seller: string;
  endTime: number;
  status: string;
}

async function fetchListingsForCollection(
  sdk: ReturnType<typeof useZuno>,
  collectionAddress: string
): Promise<Listing[]> {
  try {
    return await sdk.exchange.getListings(collectionAddress);
  } catch {
    // Silently skip collections that fail to load
    return [];
  }
}

export function useMarketplaceListings(collectionAddresses: string[] = []) {
  const sdk = useZuno();

  return useQuery<Listing[]>({
    queryKey: ['listings', 'all', collectionAddresses],
    queryFn: async () => {
      const listingsPromises = collectionAddresses.map(address =>
        fetchListingsForCollection(sdk, address)
      );

      const listingsArray = await Promise.all(listingsPromises);
      return listingsArray.flat();
    },
    enabled: collectionAddresses.length > 0,
  });
}
