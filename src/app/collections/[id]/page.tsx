"use client";

import { useParams } from "next/navigation";
import { useCollectionInfo } from "zuno-marketplace-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CollectionDetailPage() {
  const params = useParams();
  const collectionAddress = params.id as string;
  const { data: collection, isLoading, error } = useCollectionInfo(collectionAddress);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading collection</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{collection?.name || "Collection Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Collection Address: {collectionAddress}</p>
          <p>Symbol: {collection?.symbol}</p>
          <Button className="mt-4">Manage Collection</Button>
        </CardContent>
      </Card>
    </div>
  );
}