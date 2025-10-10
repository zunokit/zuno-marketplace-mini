/**
 * Create Collection Form Component
 * Clean, production-ready form for creating NFT collections
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ethers } from 'ethers';
import { useCollection } from '@/hooks/useCollection';
import { useWallet } from '@/providers/WalletProvider';
import { TokenType, CreateCollectionParams } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Image as ImageIcon,
  Settings,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// Form validation schema
const formSchema = z.object({
  tokenType: z.enum(['ERC721', 'ERC1155']),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  symbol: z
    .string()
    .min(2, 'Symbol must be at least 2 characters')
    .max(10)
    .toUpperCase(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  category: z.string().min(1, 'Please select a category'),
  mintPrice: z.string().refine((val) => {
    try {
      const price = parseFloat(val);
      return price >= 0;
    } catch {
      return false;
    }
  }, 'Invalid price'),
  royaltyFee: z.string().refine((val) => {
    const fee = parseFloat(val);
    return fee >= 0 && fee <= 10;
  }, 'Royalty must be between 0 and 10%'),
  maxSupply: z.string().refine((val) => {
    const supply = parseInt(val);
    return supply > 0 && supply <= 1000000;
  }, 'Max supply must be between 1 and 1,000,000'),
  mintLimitPerWallet: z.string().refine((val) => {
    const limit = parseInt(val);
    return limit > 0 && limit <= 100;
  }, 'Mint limit must be between 1 and 100'),
  allowlist: z.string().optional(),
  baseTokenURI: z.string().url('Invalid URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
  discord: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

const CATEGORIES = [
  'Art',
  'Gaming',
  'Music',
  'Photography',
  'Sports',
  'Collectibles',
  'Utility',
  'Memes',
  'Virtual Worlds'
];

export default function CreateCollectionForm() {
  const router = useRouter();
  const { isConnected, account } = useWallet();
  const { createCollection, isLoading } = useCollection();
  const [logoImage, setLogoImage] = useState<string>('');
  const [bannerImage, setBannerImage] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: 'Test Collection' + Date.now(),
      symbol: 'TC',
      description:
        'Test Description Test Description Test Description Test Description Test Description Test Description',
      category: 'Art',
      tokenType: 'ERC721',
      royaltyFee: '5',
      maxSupply: '10000',
      mintLimitPerWallet: '50',
      mintPrice: '0.01',
      allowlist: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      baseTokenURI: 'https://api.example.com/metadata/'
    }
  });

  const tokenType = watch('tokenType');

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'logo') {
        setLogoImage(result);
      } else {
        setBannerImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Parse allowlist addresses
      let allowlistAddresses: string[] = [];
      if (data.allowlist) {
        // Split by newlines and filter out empty lines
        allowlistAddresses = data.allowlist
          .split('\n')
          .map(addr => addr.trim())
          .filter(addr => addr.length > 0 && ethers.isAddress(addr));
        
        // Validate addresses
        const invalidAddresses = data.allowlist
          .split('\n')
          .map(addr => addr.trim())
          .filter(addr => addr.length > 0 && !ethers.isAddress(addr));
        
        if (invalidAddresses.length > 0) {
          toast.error(`Invalid addresses: ${invalidAddresses.join(', ')}`);
          return;
        }
      }

      // Convert form data to contract parameters - keep as strings for CollectionService
      const params: CreateCollectionParams = {
        tokenType: data.tokenType as TokenType,
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        category: data.category,
        mintPrice: data.mintPrice, // Keep as string
        royaltyFee: data.royaltyFee, // Keep as string
        maxSupply: data.maxSupply, // Keep as string
        mintLimitPerWallet: data.mintLimitPerWallet, // Keep as string
        baseTokenURI: data.baseTokenURI || `https://api.example.com/metadata/`,
        allowlist: allowlistAddresses, // Add parsed allowlist
        image: logoImage,
        banner: bannerImage,
        website: data.website,
        twitter: data.twitter,
        discord: data.discord
      };

      // Create collection
      const collectionAddress = await createCollection(params);

      // Redirect to collection page
      router.push(`/collections/${collectionAddress}`);
    } catch (error: any) {
      console.error('Failed to create collection:', error);
      // Error is already handled in the hook
    }
  };

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to create a collection
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Token Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Type</CardTitle>
          <CardDescription>
            Choose the type of NFT collection you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={tokenType}
            onValueChange={(value) => setValue('tokenType', value as any)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ERC721">
                <div className="space-y-1">
                  <div className="font-medium">ERC721</div>
                  <div className="text-xs text-muted-foreground">
                    Unique NFTs
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="ERC1155">
                <div className="space-y-1">
                  <div className="font-medium">ERC1155</div>
                  <div className="text-xs text-muted-foreground">
                    Multiple editions
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ERC721" className="mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  ERC721 tokens are unique, one-of-a-kind NFTs. Each token has a
                  unique ID and can only be owned by one address.
                </AlertDescription>
              </Alert>
            </TabsContent>
            <TabsContent value="ERC1155" className="mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  ERC1155 tokens can have multiple copies. Perfect for editions,
                  game items, or semi-fungible tokens.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide the essential details for your collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Collection"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                placeholder="MAC"
                {...register('symbol')}
                onChange={(e) =>
                  setValue('symbol', e.target.value.toUpperCase())
                }
              />
              {errors.symbol && (
                <p className="text-sm text-destructive">
                  {errors.symbol.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your collection..."
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={(value) => setValue('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
          <CardDescription>Upload images for your collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {logoImage ? (
                  <div className="space-y-2">
                    <img
                      src={logoImage}
                      alt="Logo"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoImage('')}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      400x400 recommended
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                    />
                    <Label htmlFor="logo-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Choose File</span>
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {bannerImage ? (
                  <div className="space-y-2">
                    <img
                      src={bannerImage}
                      alt="Banner"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBannerImage('')}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      1400x400 recommended
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="banner-upload"
                      onChange={(e) => handleImageUpload(e, 'banner')}
                    />
                    <Label htmlFor="banner-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Choose File</span>
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Settings</CardTitle>
          <CardDescription>
            Configure the parameters for your collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mintPrice">Mint Price (ETH) *</Label>
              <Input
                id="mintPrice"
                type="number"
                step="0.001"
                placeholder="0.01"
                {...register('mintPrice')}
              />
              {errors.mintPrice && (
                <p className="text-sm text-destructive">
                  {errors.mintPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="royaltyFee">Royalty (%) *</Label>
              <Input
                id="royaltyFee"
                type="number"
                step="0.1"
                placeholder="5"
                {...register('royaltyFee')}
              />
              {errors.royaltyFee && (
                <p className="text-sm text-destructive">
                  {errors.royaltyFee.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSupply">Max Supply *</Label>
              <Input
                id="maxSupply"
                type="number"
                placeholder="10000"
                {...register('maxSupply')}
              />
              {errors.maxSupply && (
                <p className="text-sm text-destructive">
                  {errors.maxSupply.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mintLimitPerWallet">
                Mint Limit Per Wallet *
              </Label>
              <Input
                id="mintLimitPerWallet"
                type="number"
                placeholder="5"
                {...register('mintLimitPerWallet')}
              />
              {errors.mintLimitPerWallet && (
                <p className="text-sm text-destructive">
                  {errors.mintLimitPerWallet.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Allowlist Configuration</h4>
            
            <div className="space-y-2">
              <Label htmlFor="allowlist">
                Allowlist Addresses
                <span className="text-xs text-muted-foreground ml-2">
                  (One address per line, optional)
                </span>
              </Label>
              <Textarea
                id="allowlist"
                placeholder="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&#10;0x70997970C51812dc3A010C7d01b50e0d17dc79C8&#10;0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
                rows={5}
                {...register('allowlist')}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter Ethereum addresses that will have early access to mint. 
                Leave empty for no allowlist.
              </p>
              {errors.allowlist && (
                <p className="text-sm text-destructive">
                  {errors.allowlist.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Optional Links</h4>

            <div className="space-y-2">
              <Label htmlFor="baseTokenURI">Metadata Base URI</Label>
              <Input
                id="baseTokenURI"
                type="url"
                placeholder="https://api.example.com/metadata/"
                {...register('baseTokenURI')}
              />
              {errors.baseTokenURI && (
                <p className="text-sm text-destructive">
                  {errors.baseTokenURI.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  {...register('website')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  placeholder="@username"
                  {...register('twitter')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord">Discord</Label>
                <Input
                  id="discord"
                  placeholder="discord.gg/invite"
                  {...register('discord')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Collection...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Create Collection
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
