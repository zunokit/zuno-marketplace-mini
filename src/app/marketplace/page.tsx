import { MainLayout } from '@/components/common/layout/MainLayout'
import { MarketplaceBrowser } from '@/components/features/marketplace/MarketplaceBrowser'

export default function MarketplacePage() {
  return (
    <MainLayout>
      <MarketplaceBrowser />
    </MainLayout>
  )
}

export const metadata = {
  title: 'Marketplace | Zuno NFT Marketplace',
  description: 'Discover, buy, and sell extraordinary NFTs on the premier decentralized marketplace.',
}