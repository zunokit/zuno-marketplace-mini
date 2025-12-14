/**
 * Create Collection Page
 * Uses the clean CreateCollectionForm component
 */

// Prevent static generation - requires wallet context
export const dynamic = "force-dynamic";

import { MainLayout } from '@/components/common/layout/MainLayout'
import CreateCollectionForm from './CreateCollectionForm'

export default function CreateCollectionPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">Create Collection</h1>
            <p className="text-muted-foreground mt-2">
              Deploy your own NFT collection on the blockchain
            </p>
          </div>
          
          <CreateCollectionForm />
        </div>
      </div>
    </MainLayout>
  )
}
