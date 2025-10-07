/**
 * Collection Detail Page
 * Shows collection information and NFTs
 */

import { MainLayout } from '@/components/common/layout/MainLayout';
import { CollectionDetail } from './CollectionDetail';
import { CollectionNFTs } from '@/components/features/nft/CollectionNFTs';

export default function CollectionPage() {
  // TODO: Fetch NFTs for this collection
  const nfts = []; // This will be populated from blockchain or API
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <CollectionDetail />
        
        {/* NFTs Grid */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Collection Items</h2>
          <CollectionNFTs nfts={nfts} />
        </div>
      </div>
    </MainLayout>
  );
}
