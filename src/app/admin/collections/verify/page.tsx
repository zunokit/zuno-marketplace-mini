"use client";

/**
 * Collection Verification Admin Page
 * Approve/reject collection verification requests
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Check, X, Clock } from "lucide-react";

interface VerificationRequest {
  id: string;
  collection: string;
  name: string;
  description: string;
  requestedBy: string;
  requestedAt: number;
  status: "pending" | "approved" | "rejected";
  tier?: "basic" | "verified" | "premium";
}

export default function CollectionVerificationPage() {
  const { toast } = useToast();

  const [requests, setRequests] = useState<VerificationRequest[]>([
    {
      id: "1",
      collection: "0x1234...5678",
      name: "CryptoPunks",
      description: "Original NFT collection",
      requestedBy: "0x5678...9012",
      requestedAt: Date.now() - 1000 * 60 * 60 * 2,
      status: "pending",
    },
    {
      id: "2",
      collection: "0x2345...6789",
      name: "Bored Apes",
      description: "BAYC collection",
      requestedBy: "0x6789...0123",
      requestedAt: Date.now() - 1000 * 60 * 60 * 5,
      status: "pending",
    },
    {
      id: "3",
      collection: "0x3456...7890",
      name: "Azuki",
      description: "Anime-inspired NFTs",
      requestedBy: "0x7890...1234",
      requestedAt: Date.now() - 1000 * 60 * 60 * 24,
      status: "approved",
      tier: "verified",
    },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(
    null
  );
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    action: "approve" as "approve" | "reject",
    tier: "verified" as "basic" | "verified" | "premium",
    notes: "",
  });

  /**
   * Handle review submission
   */
  const handleReview = async () => {
    if (!selectedRequest) return;

    try {
      // Mock - in real app, call CollectionVerifier contract
      // await collectionVerifier.approveVerification(collection, tier)
      // or
      // await collectionVerifier.rejectVerification(collection, reason)

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: reviewForm.action === "approve" ? "approved" : "rejected",
                tier:
                  reviewForm.action === "approve" ? reviewForm.tier : undefined,
              }
            : r
        )
      );

      toast({
        title: `Collection ${reviewForm.action === "approve" ? "Approved" : "Rejected"}`,
        description: `${selectedRequest.name} has been ${reviewForm.action}d`,
      });

      setReviewDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      toast({
        title: "Review Failed",
        description:
          error instanceof Error ? error.message : "Failed to review collection",
        variant: "destructive",
      });
    }
  };

  /**
   * Open review dialog
   */
  const openReview = (request: VerificationRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewForm({
      action,
      tier: "verified",
      notes: "",
    });
    setReviewDialog(true);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Collection Verification</h2>
        <p className="text-muted-foreground">
          Review and approve collection verification requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "approved").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Collections awaiting verification</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending verification requests
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{request.name}</h3>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {request.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Collection: {request.collection}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => openReview(request, "approve")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openReview(request, "reject")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Requests</CardTitle>
          <CardDescription>Recently reviewed collections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.collection}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {request.tier && (
                    <Badge variant="outline">{request.tier}</Badge>
                  )}
                  <Badge
                    variant={
                      request.status === "approved" ? "default" : "destructive"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewForm.action === "approve" ? "Approve" : "Reject"}{" "}
              Verification
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && `Review request for ${selectedRequest.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewForm.action === "approve" && (
              <div className="space-y-2">
                <Label htmlFor="tier">Verification Tier</Label>
                <Select
                  value={reviewForm.tier}
                  onValueChange={(v) =>
                    setReviewForm({ ...reviewForm, tier: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this decision..."
                value={reviewForm.notes}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewForm.action === "approve" ? "default" : "destructive"}
              onClick={handleReview}
            >
              {reviewForm.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

