'use client'
import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/common/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Globe,
  Twitter,
  MessageSquare
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useWallet } from '@/hooks/useWallet'
import { useRouter } from 'next/navigation'
import { collectionService } from '@/lib/services/contracts'
import { web3Utils } from '@/lib/utils/web3'

interface CreateCollectionForm {
  name: string
  symbol: string
  description: string
  category: string
  maxSupply: string
  royaltyPercentage: string
  mintPrice: string
  mintLimitPerWallet: string
  website?: string
  twitter?: string
  discord?: string
  explicitContent: boolean
}

const categories = [
  'Art',
  'Music',
  'Photography',
  'Gaming',
  'Sports',
  'Collectibles',
  'Virtual Worlds',
  'Domain Names',
  'Memes',
  'Utility',
]

export default function CreateCollectionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const [contractType, setContractType] = useState<'ERC721' | 'ERC1155'>('ERC721')
  const [mounted, setMounted] = useState(false)

  // Use effect to set mounted state
  const { account, isConnected } = useWallet()
  
  // Ensure client-side only rendering for wallet-dependent parts
  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateCollectionForm>({
    mode: 'onChange',
    defaultValues: {
      // Pre-filled test data for quick testing
      name: 'Test NFT Collection',
      symbol: 'TNC',
      description: 'A test collection to verify contract deployment works correctly',
      category: 'Art',
      maxSupply: '1000',
      royaltyPercentage: '5',
      mintPrice: '0.01',
      mintLimitPerWallet: '10',
      website: 'https://example.com',
      twitter: 'https://twitter.com/test',
      discord: 'https://discord.gg/test',
      explicitContent: false,
    },
  })

  const watchedValues = watch()

  // Show loading state while mounting
  if (!mounted) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    )
  }

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Create Collection</h1>
          <p className="text-muted-foreground mb-8">
            Please connect your wallet to create a new NFT collection.
          </p>
        </div>
      </MainLayout>
    )
  }

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'logo') {
          setLogoImage(result)
        } else {
          setBannerImage(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: CreateCollectionForm) => {
    setIsSubmitting(true)
    try {
      // Import Web3 provider service
      const { web3Provider } = await import('@/lib/services/web3/Web3Provider')
      const { DEFAULT_CHAIN_ID } = await import('@/lib/config/networks')
      
      // Connect wallet
      const connection = await web3Provider.connect()
      
      // Check if on correct network
      if (connection.chainId !== DEFAULT_CHAIN_ID) {
        const shouldSwitch = window.confirm(
          `You are on wrong network (chainId: ${connection.chainId}).\n` +
          `Would you like to switch to the correct network (chainId: ${DEFAULT_CHAIN_ID})?`
        )
        
        if (shouldSwitch) {
          await web3Provider.switchNetwork(DEFAULT_CHAIN_ID)
          // Re-connect after network switch
          const newConnection = await web3Provider.connect()
          connection.provider = newConnection.provider
          connection.signer = newConnection.signer
          connection.account = newConnection.account
          connection.chainId = newConnection.chainId
        } else {
          throw new Error('Please switch to the correct network to continue')
        }
      }
      
      console.log('✅ Wallet connected:', {
        chainId: connection.chainId,
        account: connection.account,
        wallet: connection.walletType
      })
      
      // Import and initialize services with wallet signer
      const { marketplaceHubService } = await import('@/lib/services/contracts')
      await marketplaceHubService.initialize(connection.provider, connection.signer)
      await collectionService.initialize(connection.provider, connection.signer)

      // Call real smart contract
      const collectionAddress = await collectionService.createCollection({
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        mintPrice: data.mintPrice,
        royaltyFee: data.royaltyPercentage,
        maxSupply: data.maxSupply,
        mintLimitPerWallet: data.mintLimitPerWallet,
        baseURI: 'https://api.example.com/metadata/',
        tokenType: contractType as "ERC721" | "ERC1155"
      })
      
      // Collection created successfully
      
      // Redirect to the new collection
      router.push(`/collections/${collectionAddress}`)
    } catch (error) {
      console.error('❌ Error creating collection:', error)
      alert(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (step / 3) * 100

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Create New Collection</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Deploy your own NFT collection with custom branding, royalties, and metadata.
            Your collection will be deployed as a smart contract on the Ethereum blockchain.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Provide the essential details for your NFT collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contract Type */}
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select value={contractType} onValueChange={(value: 'ERC721' | 'ERC1155') => setContractType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC721">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">ERC721</span>
                          <span className="text-xs text-muted-foreground">Unique, one-of-a-kind NFTs</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ERC1155">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">ERC1155</span>
                          <span className="text-xs text-muted-foreground">Semi-fungible tokens with multiple copies</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Collection Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Cosmic Warriors"
                    {...register('name', { 
                      required: 'Collection name is required',
                      minLength: { value: 3, message: 'Name must be at least 3 characters' }
                    })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Symbol */}
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g. CW"
                    maxLength={10}
                    {...register('symbol', { 
                      required: 'Symbol is required',
                      pattern: { value: /^[A-Z0-9]+$/, message: 'Symbol must be uppercase letters and numbers only' }
                    })}
                  />
                  {errors.symbol && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.symbol.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your collection, its story, and what makes it unique..."
                    rows={4}
                    {...register('description', { 
                      required: 'Description is required',
                      minLength: { value: 50, message: 'Description must be at least 50 characters' }
                    })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {errors.description && (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description.message}
                      </span>
                    )}
                    <span>{watchedValues.description?.length || 0} characters</span>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setStep(2)}
                    disabled={!watchedValues.name || !watchedValues.symbol || !watchedValues.description || !watchedValues.category}
                  >
                    Next: Media & Branding
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Media & Branding */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Media & Branding
                </CardTitle>
                <CardDescription>
                  Upload images and social links for your collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Image */}
                <div className="space-y-2">
                  <Label>Logo Image *</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {logoImage ? (
                      <div className="flex items-center gap-4">
                        <img 
                          src={logoImage} 
                          alt="Logo preview" 
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium">Logo uploaded</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLogoImage(null)}
                            className="mt-2"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Recommended: 400x400px, max 10MB
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'logo')}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" asChild>
                            <span>Choose File</span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Image */}
                <div className="space-y-2">
                  <Label>Banner Image (Optional)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {bannerImage ? (
                      <div className="space-y-4">
                        <img 
                          src={bannerImage} 
                          alt="Banner preview" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setBannerImage(null)}
                        >
                          Remove Banner
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Recommended: 1400x400px, max 10MB
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'banner')}
                          className="hidden"
                          id="banner-upload"
                        />
                        <Label htmlFor="banner-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" asChild>
                            <span>Choose File</span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <Label>Social Links (Optional)</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      {...register('website')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/yourusername"
                      {...register('twitter')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discord" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Discord
                    </Label>
                    <Input
                      id="discord"
                      placeholder="https://discord.gg/yourserver"
                      {...register('discord')}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setStep(3)}
                    disabled={!logoImage}
                  >
                    Next: Collection Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Collection Settings */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Collection Settings
                </CardTitle>
                <CardDescription>
                  Configure advanced settings for your collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supply */}
                <div className="space-y-2">
                  <Label htmlFor="maxSupply">Maximum Supply</Label>
                  <Input
                    id="maxSupply"
                    type="number"
                    placeholder="e.g. 10000"
                    {...register('maxSupply', { 
                      required: 'Max supply is required',
                      min: { value: 1, message: 'Max supply must be at least 1' }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    The maximum number of NFTs that can be minted in this collection
                  </p>
                  {errors.maxSupply && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.maxSupply.message}
                    </p>
                  )}
                </div>

                {/* Mint Price */}
                <div className="space-y-2">
                  <Label htmlFor="mintPrice">Mint Price (ETH)</Label>
                  <Input
                    id="mintPrice"
                    type="number"
                    step="0.001"
                    placeholder="e.g. 0.001"
                    {...register('mintPrice', {
                      required: 'Mint price is required',
                      min: { value: 0, message: 'Mint price must be non-negative' }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Price in ETH for minting each NFT
                  </p>
                  {errors.mintPrice && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.mintPrice.message}
                    </p>
                  )}
                </div>

                {/* Mint Limit Per Wallet */}
                <div className="space-y-2">
                  <Label htmlFor="mintLimitPerWallet">Mint Limit Per Wallet</Label>
                  <Input
                    id="mintLimitPerWallet"
                    type="number"
                    placeholder="e.g. 10"
                    {...register('mintLimitPerWallet', {
                      required: 'Mint limit is required',
                      min: { value: 1, message: 'Mint limit must be at least 1' }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum NFTs each wallet can mint
                  </p>
                  {errors.mintLimitPerWallet && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.mintLimitPerWallet.message}
                    </p>
                  )}
                </div>

                {/* Royalty Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="royaltyPercentage">Royalty Percentage</Label>
                  <Input
                    id="royaltyPercentage"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="5"
                    {...register('royaltyPercentage', { 
                      required: 'Royalty percentage is required',
                      min: { value: 0, message: 'Royalty must be at least 0%' },
                      max: { value: 10, message: 'Royalty cannot exceed 10%' }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive this percentage of secondary sales (0-10%)
                  </p>
                  {errors.royaltyPercentage && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.royaltyPercentage.message}
                    </p>
                  )}
                </div>

                {/* Explicit Content */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Explicit Content</Label>
                    <p className="text-sm text-muted-foreground">
                      Mark if your collection contains mature content
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.explicitContent}
                    onCheckedChange={(checked) => setValue('explicitContent', checked)}
                  />
                </div>

                {/* Summary */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="font-medium mb-3">Collection Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{watchedValues.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Symbol:</span>
                      <span>{watchedValues.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant="outline">{contractType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Supply:</span>
                      <span>{watchedValues.maxSupply || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mint Price:</span>
                      <span>{watchedValues.mintPrice ? `${watchedValues.mintPrice} ETH` : 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mint Limit:</span>
                      <span>{watchedValues.mintLimitPerWallet || 'Not set'} per wallet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Royalty:</span>
                      <span>{watchedValues.royaltyPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isValid}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Collection'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </MainLayout>
  )
}