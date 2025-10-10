'use client';

/**
 * Collection Verification Admin Page
 * Verify/reject collections using CollectionVerifierService
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/lib/store/hooks';
import {
  collectionVerifierService,
  CollectionVerification,
  VerificationStatus
} from '@/lib/services/contracts/CollectionVerifierService';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CollectionVerificationPage() {
  const { toast } = useToast();
  const { account } = useAppSelector((state) => state.wallet);

  const [verifiedCollections, setVerifiedCollections] = useState<string[]>([]);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [collection, setCollection] = useState('');
  const [verificationTier, setVerificationTier] = useState<
    'basic' | 'premium' | 'featured'
  >('basic');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Load verified collections
   */
  useEffect(() => {
    if (!useMockData && account) {
      loadVerifiedCollections();
    }
  }, [account, useMockData]);

  const loadVerifiedCollections = async () => {
    try {
      const collections =
        await collectionVerifierService.getAllVerifiedCollections();
      setVerifiedCollections(collections);
    } catch (error) {
      console.error('Failed to load verified collections:', error);
    }
  };

  /**
   * Handle verify collection
   */
  const handleVerifyCollection = async () => {
    if (!collection) {
      toast({
        title: 'Validation Error',
        description: 'Please enter collection address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      if (useMockData) {
        toast({
          title: 'Collection Verified',
          description: `Successfully verified collection with ${verificationTier} tier`
        });
        setVerifyDialogOpen(false);
      } else {
        await collectionVerifierService.processVerificationRequest(
          collection,
          true,
          verificationTier,
          reviewNotes
        );

        toast({
          title: 'Collection Verified',
          description: 'Successfully verified collection'
        });

        setVerifyDialogOpen(false);
        setCollection('');
        setReviewNotes('');
        await loadVerifiedCollections();
      }
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to verify collection',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle revoke verification
   */
  const handleRevokeVerification = async (collectionAddress: string) => {
    setLoading(true);

    try {
      if (useMockData) {
        toast({
          title: 'Verification Revoked',
          description: 'Successfully revoked collection verification'
        });
      } else {
        await collectionVerifierService.revokeVerification(
          collectionAddress,
          'Verification revoked by admin'
        );

        toast({
          title: 'Verification Revoked',
          description: 'Successfully revoked verification'
        });

        await loadVerifiedCollections();
      }
    } catch (error) {
      toast({
        title: 'Revoke Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to revoke verification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">✅ Collection Verification</h2>
        <p className="text-muted-foreground">
          Verify and manage NFT collection authenticity
        </p>
      </div>

      {useMockData && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Mock Data Mode - Real contract integration disabled
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6">
        <Button onClick={() => setVerifyDialogOpen(true)}>
          <Shield className="h-4 w-4 mr-2" />
          Verify Collection
        </Button>
      </div>

      {/* Verified Collections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verified Collections
          </CardTitle>
          <CardDescription>Currently verified NFT collections</CardDescription>
        </CardHeader>
        <CardContent>
          {verifiedCollections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No verified collections found
            </p>
          ) : (
            <div className="space-y-2">
              {verifiedCollections.map((addr) => (
                <div
                  key={addr}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium font-mono text-sm">
                      {addr.slice(0, 10)}...{addr.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Verified</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeVerification(addr)}
                      disabled={loading}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Collection</DialogTitle>
            <DialogDescription>
              Verify an NFT collection for marketplace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="collection">Collection Address</Label>
              <Input
                id="collection"
                placeholder="0x..."
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tier">Verification Tier</Label>
              <Select
                value={verificationTier}
                onValueChange={(val: any) => setVerificationTier(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic ✓</SelectItem>
                  <SelectItem value="premium">Premium ⭐</SelectItem>
                  <SelectItem value="featured">Featured 👑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Review Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes about this verification..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleVerifyCollection} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
