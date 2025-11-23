"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useExchange } from "zuno-marketplace-sdk/react";
import { useAccount } from "wagmi";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

const listingFormSchema = z.object({
  tokenContract: z.string().min(42, "Invalid contract address").max(42),
  tokenId: z.string().min(1, "Token ID is required"),
  price: z.string().min(1, "Price is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Price must be a positive number"),
  tokenType: z.enum(["ERC721", "ERC1155"]),
  amount: z.string().optional(),
});

type ListingFormValues = z.infer<typeof listingFormSchema>;

interface CreateListingFormProps {
  onSuccess?: () => void;
}

export function CreateListingForm({ onSuccess }: CreateListingFormProps = {}) {
  const { listNFT } = useExchange();
  const { isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      tokenContract: "",
      tokenId: "",
      price: "",
      tokenType: "ERC721",
      amount: "1",
    },
  });

  const tokenType = form.watch("tokenType");

  const onSubmit = async (values: ListingFormValues) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setTxHash(null);

    try {
      logger.startTimer("create-listing");
      logger.info(
        "Creating marketplace listing",
        {
          tokenContract: values.tokenContract,
          tokenId: values.tokenId,
          price: values.price,
          tokenType: values.tokenType,
        },
        { component: "CreateListingForm", action: "submit" }
      );

      const { tx } = await listNFT.mutateAsync({
        collectionAddress: values.tokenContract,
        tokenId: values.tokenId,
        price: values.price,
        duration: 30 * 24 * 60 * 60, // 30 days
      });

      logger.endTimer("create-listing", "Listing created successfully");

      if (tx?.hash) {
        setTxHash(tx.hash);
        toast.success("Listing created successfully!");
        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      logger.error("Failed to create listing", error, {
        component: "CreateListingForm",
        action: "submit",
      });

      toast.error(error instanceof Error ? error.message : "Failed to create listing");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Listing</CardTitle>
        <CardDescription>
          List your NFT for sale on the marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Wallet Not Connected</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please connect your wallet to create a listing
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Token Type Selection */}
              <FormField
                control={form.control}
                name="tokenType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Standard</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token standard" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ERC721">ERC721</SelectItem>
                        <SelectItem value="ERC1155">ERC1155</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The NFT standard of your token
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Token Contract Address */}
              <FormField
                control={form.control}
                name="tokenContract"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NFT Contract Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0x..."
                        {...field}
                        disabled={isProcessing}
                      />
                    </FormControl>
                    <FormDescription>
                      The smart contract address of your NFT
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Token ID */}
              <FormField
                control={form.control}
                name="tokenId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1"
                        {...field}
                        disabled={isProcessing}
                      />
                    </FormControl>
                    <FormDescription>
                      The unique identifier of your NFT
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount (ERC1155 only) */}
              {tokenType === "ERC1155" && (
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          disabled={isProcessing}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of tokens to list (ERC1155 only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (ETH)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.1"
                        {...field}
                        disabled={isProcessing}
                      />
                    </FormControl>
                    <FormDescription>
                      The sale price in ETH
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Hash Display */}
              {txHash && (
                <div className="rounded-lg border bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium">
                        Listing Created Successfully!
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `https://etherscan.io/tx/${txHash}`,
                              "_blank"
                            );
                          }}
                        >
                          View on Etherscan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  "Create Listing"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> You must approve the marketplace contract to
          transfer your NFT before listing.
        </p>
        <p>The marketplace will handle the approval transaction automatically.</p>
      </CardFooter>
    </Card>
  );
}
