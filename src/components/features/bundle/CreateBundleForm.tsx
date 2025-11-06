"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useWallet } from "@/providers/WalletProvider";
import { useBundle } from "@/hooks/use-bundle";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";

const bundleSchema = z.object({
  nfts: z.array(z.object({
    contractAddress: z.string().min(42).max(42),
    tokenId: z.string().min(1),
    tokenType: z.enum(["ERC721", "ERC1155"]),
    amount: z.string().optional(),
  })).min(2, "Bundle must contain at least 2 NFTs"),
  price: z.string().min(1).refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Invalid price"),
  duration: z.string().min(1),
});

type BundleFormValues = z.infer<typeof bundleSchema>;

interface CreateBundleFormProps {
  onSuccess?: () => void;
}

export function CreateBundleForm({ onSuccess }: CreateBundleFormProps = {}) {
  const { isConnected } = useWallet();
  const { createBundle } = useBundle();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      nfts: [
        { contractAddress: "", tokenId: "", tokenType: "ERC721", amount: "1" },
        { contractAddress: "", tokenId: "", tokenType: "ERC721", amount: "1" },
      ],
      price: "",
      duration: "7",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nfts",
  });

  const onSubmit = async (values: BundleFormValues) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setTxHash(null);

    try {
      const receipt = await createBundle({
        nfts: values.nfts,
        price: values.price,
        duration: values.duration,
      });

      if (receipt) {
        setTxHash(receipt); // receipt is now bundleId string
        form.reset();
        onSuccess?.();
      }
    } catch (error: any) {
      logger.error("Failed to create bundle", error, {
        component: "CreateBundleForm",
        action: "submit",
      });
      toast.error(error?.message || "Failed to create bundle");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Create NFT Bundle</CardTitle>
        <CardDescription>Group multiple NFTs and sell them together</CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Wallet Not Connected</p>
            <p className="text-sm text-muted-foreground">Please connect your wallet</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* NFTs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>NFTs in Bundle</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ contractAddress: "", tokenId: "", tokenType: "ERC721", amount: "1" })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add NFT
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge>NFT #{index + 1}</Badge>
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`nfts.${index}.tokenType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ERC721">ERC721</SelectItem>
                                <SelectItem value="ERC1155">ERC1155</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`nfts.${index}.contractAddress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Address</FormLabel>
                            <FormControl>
                              <Input placeholder="0x..." {...field} disabled={isProcessing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`nfts.${index}.tokenId`}
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

                      {form.watch(`nfts.${index}.tokenType`) === "ERC1155" && (
                        <FormField
                          control={form.control}
                          name={`nfts.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="1" {...field} disabled={isProcessing} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bundle Price (ETH)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="1.0" {...field} disabled={isProcessing} />
                    </FormControl>
                    <FormDescription>Total price for all NFTs in the bundle</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Days)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                      <p className="text-sm font-medium">Bundle Created!</p>
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
                    Creating Bundle...
                  </>
                ) : (
                  "Create Bundle"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
        <p><strong>Note:</strong> All NFTs must be approved before bundling.</p>
      </CardFooter>
    </Card>
  );
}
