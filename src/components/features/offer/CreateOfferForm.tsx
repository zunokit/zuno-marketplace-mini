"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Tag, Layers, Sparkles } from "lucide-react";
import { useWallet } from "@/providers/WalletProvider";
import { useOffer } from "@/hooks/use-offer";
import { toast } from "sonner";

const nftOfferSchema = z.object({
  contractAddress: z.string().min(42).max(42),
  tokenId: z.string().min(1),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0),
  expiry: z.string(),
});

const collectionOfferSchema = z.object({
  contractAddress: z.string().min(42).max(42),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0),
  quantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0),
  expiry: z.string(),
});

const traitOfferSchema = z.object({
  contractAddress: z.string().min(42).max(42),
  traitType: z.string().min(1),
  traitValue: z.string().min(1),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0),
  quantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0),
  expiry: z.string(),
});

export function CreateOfferForm() {
  const { isConnected } = useWallet();
  const { makeNFTOffer, makeCollectionOffer, makeTraitOffer } = useOffer();
  const [offerType, setOfferType] = useState<"NFT" | "COLLECTION" | "TRAIT">("NFT");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const nftForm = useForm({ resolver: zodResolver(nftOfferSchema), defaultValues: { contractAddress: "", tokenId: "", price: "", expiry: "7" } });
  const collectionForm = useForm({ resolver: zodResolver(collectionOfferSchema), defaultValues: { contractAddress: "", price: "", quantity: "1", expiry: "7" } });
  const traitForm = useForm({ resolver: zodResolver(traitOfferSchema), defaultValues: { contractAddress: "", traitType: "", traitValue: "", price: "", quantity: "1", expiry: "7" } });

  const onSubmitNFT = async (values: z.infer<typeof nftOfferSchema>) => {
    if (!isConnected) return toast.error("Connect wallet first");
    setIsProcessing(true);
    setTxHash(null);
    try {
      const receipt = await makeNFTOffer(values);
      if (receipt) {
        setTxHash(receipt); // receipt is now offerId string
        nftForm.reset();
      }
    } catch (error) {
      toast.error("Failed to create offer");
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmitCollection = async (values: z.infer<typeof collectionOfferSchema>) => {
    if (!isConnected) return toast.error("Connect wallet first");
    setIsProcessing(true);
    setTxHash(null);
    try {
      const receipt = await makeCollectionOffer(values);
      if (receipt) {
        setTxHash(receipt); // receipt is now offerId string
        collectionForm.reset();
      }
    } catch (error) {
      toast.error("Failed to create offer");
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmitTrait = async (values: z.infer<typeof traitOfferSchema>) => {
    if (!isConnected) return toast.error("Connect wallet first");
    setIsProcessing(true);
    setTxHash(null);
    try {
      const receipt = await makeTraitOffer(values);
      if (receipt) {
        setTxHash(receipt); // receipt is now offerId string
        traitForm.reset();
      }
    } catch (error) {
      toast.error("Failed to create offer");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Make Offer</CardTitle>
        <CardDescription>Make offers on NFTs, collections, or specific traits</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={offerType} onValueChange={(v) => setOfferType(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="NFT"><Tag className="h-4 w-4 mr-2" />NFT</TabsTrigger>
            <TabsTrigger value="COLLECTION"><Layers className="h-4 w-4 mr-2" />Collection</TabsTrigger>
            <TabsTrigger value="TRAIT"><Sparkles className="h-4 w-4 mr-2" />Trait</TabsTrigger>
          </TabsList>

          <TabsContent value="NFT">
            <Form {...nftForm}>
              <form onSubmit={nftForm.handleSubmit(onSubmitNFT)} className="space-y-4">
                <FormField control={nftForm.control} name="contractAddress" render={({ field }) => (
                  <FormItem><FormLabel>Contract Address</FormLabel><FormControl><Input placeholder="0x..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={nftForm.control} name="tokenId" render={({ field }) => (
                  <FormItem><FormLabel>Token ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={nftForm.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Offer Price (ETH)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={nftForm.control} name="expiry" render={({ field }) => (
                  <FormItem><FormLabel>Expiry (Days)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                    <SelectItem value="1">1 Day</SelectItem><SelectItem value="3">3 Days</SelectItem><SelectItem value="7">7 Days</SelectItem><SelectItem value="30">30 Days</SelectItem>
                  </SelectContent></Select><FormMessage /></FormItem>
                )} />
                {txHash && <div className="rounded-lg border bg-muted p-4"><CheckCircle className="h-5 w-5 text-green-500" /><Badge className="mt-2">{txHash.slice(0, 10)}...{txHash.slice(-8)}</Badge></div>}
                <Button type="submit" className="w-full" disabled={isProcessing}>{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : "Make Offer"}</Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="COLLECTION">
            <Form {...collectionForm}>
              <form onSubmit={collectionForm.handleSubmit(onSubmitCollection)} className="space-y-4">
                <FormField control={collectionForm.control} name="contractAddress" render={({ field }) => (
                  <FormItem><FormLabel>Collection Address</FormLabel><FormControl><Input placeholder="0x..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={collectionForm.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Price Per NFT (ETH)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={collectionForm.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Number of NFTs you want to buy</FormDescription><FormMessage /></FormItem>
                )} />
                <FormField control={collectionForm.control} name="expiry" render={({ field }) => (
                  <FormItem><FormLabel>Expiry (Days)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                    <SelectItem value="1">1 Day</SelectItem><SelectItem value="3">3 Days</SelectItem><SelectItem value="7">7 Days</SelectItem><SelectItem value="30">30 Days</SelectItem>
                  </SelectContent></Select><FormMessage /></FormItem>
                )} />
                {txHash && <div className="rounded-lg border bg-muted p-4"><CheckCircle className="h-5 w-5 text-green-500" /><Badge className="mt-2">{txHash.slice(0, 10)}...{txHash.slice(-8)}</Badge></div>}
                <Button type="submit" className="w-full" disabled={isProcessing}>{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : "Make Collection Offer"}</Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="TRAIT">
            <Form {...traitForm}>
              <form onSubmit={traitForm.handleSubmit(onSubmitTrait)} className="space-y-4">
                <FormField control={traitForm.control} name="contractAddress" render={({ field }) => (
                  <FormItem><FormLabel>Collection Address</FormLabel><FormControl><Input placeholder="0x..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={traitForm.control} name="traitType" render={({ field }) => (
                  <FormItem><FormLabel>Trait Type</FormLabel><FormControl><Input placeholder="e.g., Background" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={traitForm.control} name="traitValue" render={({ field }) => (
                  <FormItem><FormLabel>Trait Value</FormLabel><FormControl><Input placeholder="e.g., Blue" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={traitForm.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Price Per NFT (ETH)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={traitForm.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={traitForm.control} name="expiry" render={({ field }) => (
                  <FormItem><FormLabel>Expiry (Days)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                    <SelectItem value="1">1 Day</SelectItem><SelectItem value="3">3 Days</SelectItem><SelectItem value="7">7 Days</SelectItem><SelectItem value="30">30 Days</SelectItem>
                  </SelectContent></Select><FormMessage /></FormItem>
                )} />
                {txHash && <div className="rounded-lg border bg-muted p-4"><CheckCircle className="h-5 w-5 text-green-500" /><Badge className="mt-2">{txHash.slice(0, 10)}...{txHash.slice(-8)}</Badge></div>}
                <Button type="submit" className="w-full" disabled={isProcessing}>{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : "Make Trait Offer"}</Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
