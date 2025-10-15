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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useWallet } from "@/providers/WalletProvider";
import { useAuction } from "@/hooks/use-auction";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

const englishAuctionSchema = z.object({
  tokenContract: z.string().min(42, "Invalid contract address").max(42),
  tokenId: z.string().min(1, "Token ID is required"),
  startPrice: z.string().min(1, "Start price is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Start price must be a positive number"),
  reservePrice: z.string().optional(),
  minBidIncrement: z.string().min(1, "Min bid increment is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Min bid increment must be a positive number"),
  duration: z.string().min(1, "Duration is required"),
});

const dutchAuctionSchema = z.object({
  tokenContract: z.string().min(42, "Invalid contract address").max(42),
  tokenId: z.string().min(1, "Token ID is required"),
  startPrice: z.string().min(1, "Start price is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Start price must be a positive number"),
  endPrice: z.string().min(1, "End price is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "End price must be a positive number"),
  duration: z.string().min(1, "Duration is required"),
});

type EnglishAuctionValues = z.infer<typeof englishAuctionSchema>;
type DutchAuctionValues = z.infer<typeof dutchAuctionSchema>;

interface CreateAuctionFormProps {
  onSuccess?: () => void;
}

export function CreateAuctionForm({ onSuccess }: CreateAuctionFormProps = {}) {
  const { isConnected, account } = useWallet();
  const { createEnglishAuction, createDutchAuction } = useAuction();
  const [auctionType, setAuctionType] = useState<"ENGLISH" | "DUTCH">("ENGLISH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const englishForm = useForm<EnglishAuctionValues>({
    resolver: zodResolver(englishAuctionSchema),
    defaultValues: {
      tokenContract: "",
      tokenId: "",
      startPrice: "",
      reservePrice: "",
      minBidIncrement: "0.1",
      duration: "7",
    },
  });

  const dutchForm = useForm<DutchAuctionValues>({
    resolver: zodResolver(dutchAuctionSchema),
    defaultValues: {
      tokenContract: "",
      tokenId: "",
      startPrice: "",
      endPrice: "",
      duration: "24",
    },
  });

  const onSubmitEnglish = async (values: EnglishAuctionValues) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setTxHash(null);

    try {
      const receipt = await createEnglishAuction({
        tokenContract: values.tokenContract,
        tokenId: values.tokenId,
        startPrice: values.startPrice,
        reservePrice: values.reservePrice,
        minBidIncrement: values.minBidIncrement,
        duration: values.duration,
      });

      if (receipt?.hash) {
        setTxHash(receipt.hash);
        englishForm.reset();
        onSuccess?.();
      }
    } catch (error: any) {
      logger.error("Failed to create English auction", error, {
        component: "CreateAuctionForm",
        action: "submitEnglish",
      });
      toast.error(error?.message || "Failed to create auction");
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmitDutch = async (values: DutchAuctionValues) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate start price > end price
    if (parseFloat(values.startPrice) <= parseFloat(values.endPrice)) {
      toast.error("Start price must be greater than end price");
      return;
    }

    setIsProcessing(true);
    setTxHash(null);

    try {
      const receipt = await createDutchAuction({
        tokenContract: values.tokenContract,
        tokenId: values.tokenId,
        startPrice: values.startPrice,
        endPrice: values.endPrice,
        duration: values.duration,
      });

      if (receipt?.hash) {
        setTxHash(receipt.hash);
        dutchForm.reset();
        onSuccess?.();
      }
    } catch (error: any) {
      logger.error("Failed to create Dutch auction", error, {
        component: "CreateAuctionForm",
        action: "submitDutch",
      });
      toast.error(error?.message || "Failed to create auction");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Auction</CardTitle>
        <CardDescription>
          Start an English or Dutch auction for your NFT
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Wallet Not Connected</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please connect your wallet to create an auction
            </p>
          </div>
        ) : (
          <Tabs value={auctionType} onValueChange={(v) => setAuctionType(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ENGLISH" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                English Auction
              </TabsTrigger>
              <TabsTrigger value="DUTCH" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Dutch Auction
              </TabsTrigger>
            </TabsList>

            {/* English Auction Form */}
            <TabsContent value="ENGLISH">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">English Auction</h4>
                <p className="text-sm text-muted-foreground">
                  Price increases with each bid. Highest bidder wins when auction ends.
                </p>
              </div>

              <Form {...englishForm}>
                <form onSubmit={englishForm.handleSubmit(onSubmitEnglish)} className="space-y-6">
                  {/* Token Contract */}
                  <FormField
                    control={englishForm.control}
                    name="tokenContract"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NFT Contract Address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." {...field} disabled={isProcessing} />
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
                    control={englishForm.control}
                    name="tokenId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token ID</FormLabel>
                        <FormControl>
                          <Input placeholder="1" {...field} disabled={isProcessing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Price */}
                  <FormField
                    control={englishForm.control}
                    name="startPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Price (ETH)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="1.0"
                            {...field}
                            disabled={isProcessing}
                          />
                        </FormControl>
                        <FormDescription>Minimum bid to start the auction</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reserve Price */}
                  <FormField
                    control={englishForm.control}
                    name="reservePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reserve Price (ETH) - Optional</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="5.0"
                            {...field}
                            disabled={isProcessing}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum price to accept. Auction won't complete if not met.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Min Bid Increment */}
                  <FormField
                    control={englishForm.control}
                    name="minBidIncrement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Bid Increment (ETH)</FormLabel>
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
                          Minimum amount each bid must increase
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Duration */}
                  <FormField
                    control={englishForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Days)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {txHash && (
                    <div className="rounded-lg border bg-muted p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">Auction Created!</p>
                          <Badge variant="outline" className="font-mono text-xs">
                            {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Auction...
                      </>
                    ) : (
                      "Create English Auction"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Dutch Auction Form */}
            <TabsContent value="DUTCH">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Dutch Auction</h4>
                <p className="text-sm text-muted-foreground">
                  Price decreases over time. First buyer to accept the price wins.
                </p>
              </div>

              <Form {...dutchForm}>
                <form onSubmit={dutchForm.handleSubmit(onSubmitDutch)} className="space-y-6">
                  {/* Token Contract */}
                  <FormField
                    control={dutchForm.control}
                    name="tokenContract"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NFT Contract Address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." {...field} disabled={isProcessing} />
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
                    control={dutchForm.control}
                    name="tokenId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token ID</FormLabel>
                        <FormControl>
                          <Input placeholder="1" {...field} disabled={isProcessing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Price */}
                  <FormField
                    control={dutchForm.control}
                    name="startPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Price (ETH)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="10.0"
                            {...field}
                            disabled={isProcessing}
                          />
                        </FormControl>
                        <FormDescription>Highest price at auction start</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Price */}
                  <FormField
                    control={dutchForm.control}
                    name="endPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Price (ETH)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="1.0"
                            {...field}
                            disabled={isProcessing}
                          />
                        </FormControl>
                        <FormDescription>
                          Lowest price at auction end (must be lower than start price)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Duration */}
                  <FormField
                    control={dutchForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Hours)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Hour</SelectItem>
                            <SelectItem value="6">6 Hours</SelectItem>
                            <SelectItem value="12">12 Hours</SelectItem>
                            <SelectItem value="24">24 Hours</SelectItem>
                            <SelectItem value="48">48 Hours</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Price decreases linearly over this period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {txHash && (
                    <div className="rounded-lg border bg-muted p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">Auction Created!</p>
                          <Badge variant="outline" className="font-mono text-xs">
                            {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Auction...
                      </>
                    ) : (
                      "Create Dutch Auction"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> You must approve the auction contract to transfer
          your NFT before creating an auction.
        </p>
        <p>The marketplace will handle the approval transaction automatically.</p>
      </CardFooter>
    </Card>
  );
}
