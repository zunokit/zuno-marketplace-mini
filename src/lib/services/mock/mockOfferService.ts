/**
 * Mock Offer Service
 * Provides mock offer data for development
 */

export enum OfferType {
  NFT = 0, // Offer for specific NFT
  COLLECTION = 1, // Offer for any NFT in collection
  TRAIT = 2, // Offer for NFTs with specific traits
}

export enum OfferStatus {
  ACTIVE = 0,
  ACCEPTED = 1,
  CANCELLED = 2,
  EXPIRED = 3,
}

export interface Offer {
  id: string;
  type: OfferType;
  status: OfferStatus;
  creator: string;
  nftContract: string;
  tokenId?: string; // For NFT offers
  nftName?: string;
  nftImage?: string;
  collectionName: string;

  // Pricing
  offerPrice: string;

  // Timing
  createdAt: number;
  expiresAt: number;

  // Metadata
  traits?: Array<{ trait_type: string; value: string }>; // For trait offers
  quantity?: number; // For collection/trait offers
}

/**
 * Generate mock offers
 */
export function generateMockOffers(count: number = 15): Offer[] {
  const offers: Offer[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const type = [OfferType.NFT, OfferType.COLLECTION, OfferType.TRAIT][
      Math.floor(Math.random() * 3)
    ];
    const isActive = i % 4 !== 0;

    const createdAt = now - Math.random() * 7 * 24 * 60 * 60 * 1000; // Within last 7 days
    const duration = 1 + Math.random() * 6; // 1-7 days
    const expiresAt = createdAt + duration * 24 * 60 * 60 * 1000;

    const offer: Offer = {
      id: (i + 1).toString(),
      type,
      status: isActive
        ? now > expiresAt
          ? OfferStatus.EXPIRED
          : OfferStatus.ACTIVE
        : Math.random() > 0.5
        ? OfferStatus.ACCEPTED
        : OfferStatus.CANCELLED,
      creator: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`,
      nftContract: `0x${Math.random()
        .toString(16)
        .slice(2, 42)
        .padEnd(40, "0")}`,
      collectionName: ["CryptoPunks", "Bored Apes", "Azuki", "Doodles"][
        Math.floor(Math.random() * 4)
      ],
      offerPrice: (Math.random() * 5 + 0.1).toFixed(2),
      createdAt,
      expiresAt,
    };

    if (type === OfferType.NFT) {
      offer.tokenId = Math.floor(Math.random() * 10000).toString();
      offer.nftName = `NFT #${offer.tokenId}`;
      offer.nftImage = `https://picsum.photos/seed/offer${i}/300/300`;
    } else if (type === OfferType.COLLECTION) {
      offer.quantity = Math.floor(Math.random() * 5) + 1;
    } else {
      // Trait offer
      offer.quantity = Math.floor(Math.random() * 3) + 1;
      offer.traits = [
        {
          trait_type: "Rarity",
          value: ["Common", "Rare", "Legendary"][Math.floor(Math.random() * 3)],
        },
      ];
    }

    offers.push(offer);
  }

  return offers;
}

/**
 * Mock Offer Service Class
 */
export class MockOfferService {
  private offers: Offer[] = [];

  constructor() {
    this.offers = generateMockOffers(30);
  }

  /**
   * Get all active offers
   */
  async getActiveOffers(): Promise<Offer[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const now = Date.now();
    return this.offers.filter(
      (o) => o.status === OfferStatus.ACTIVE && o.expiresAt > now
    );
  }

  /**
   * Get offers for specific NFT
   */
  async getNFTOffers(nftContract: string, tokenId: string): Promise<Offer[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const now = Date.now();
    return this.offers.filter(
      (o) =>
        o.status === OfferStatus.ACTIVE &&
        o.expiresAt > now &&
        o.type === OfferType.NFT &&
        o.nftContract.toLowerCase() === nftContract.toLowerCase() &&
        o.tokenId === tokenId
    );
  }

  /**
   * Get user's offers
   */
  async getUserOffers(userAddress: string): Promise<Offer[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return this.offers.filter(
      (o) => o.creator.toLowerCase() === userAddress.toLowerCase()
    );
  }

  /**
   * Create NFT offer
   */
  async createNFTOffer(data: {
    nftContract: string;
    tokenId: string;
    offerPrice: string;
    duration: number; // days
  }): Promise<Offer> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const now = Date.now();
    const offer: Offer = {
      id: (this.offers.length + 1).toString(),
      type: OfferType.NFT,
      status: OfferStatus.ACTIVE,
      creator: "0xCurrentUserAddress",
      nftContract: data.nftContract,
      tokenId: data.tokenId,
      nftName: `NFT #${data.tokenId}`,
      nftImage: `https://picsum.photos/seed/${data.tokenId}/300/300`,
      collectionName: "My Collection",
      offerPrice: data.offerPrice,
      createdAt: now,
      expiresAt: now + data.duration * 24 * 60 * 60 * 1000,
    };

    this.offers.push(offer);
    return offer;
  }

  /**
   * Create collection offer
   */
  async createCollectionOffer(data: {
    nftContract: string;
    offerPrice: string;
    quantity: number;
    duration: number; // days
  }): Promise<Offer> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const now = Date.now();
    const offer: Offer = {
      id: (this.offers.length + 1).toString(),
      type: OfferType.COLLECTION,
      status: OfferStatus.ACTIVE,
      creator: "0xCurrentUserAddress",
      nftContract: data.nftContract,
      collectionName: "Collection",
      offerPrice: data.offerPrice,
      quantity: data.quantity,
      createdAt: now,
      expiresAt: now + data.duration * 24 * 60 * 60 * 1000,
    };

    this.offers.push(offer);
    return offer;
  }

  /**
   * Accept offer
   */
  async acceptOffer(offerId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const offer = this.offers.find((o) => o.id === offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.status !== OfferStatus.ACTIVE)
      throw new Error("Offer is not active");

    offer.status = OfferStatus.ACCEPTED;
  }

  /**
   * Cancel offer
   */
  async cancelOffer(offerId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const offer = this.offers.find((o) => o.id === offerId);
    if (!offer) throw new Error("Offer not found");

    offer.status = OfferStatus.CANCELLED;
  }
}

// Singleton instance
let mockOfferServiceInstance: MockOfferService | null = null;

export function getMockOfferService(): MockOfferService {
  if (!mockOfferServiceInstance) {
    mockOfferServiceInstance = new MockOfferService();
  }
  return mockOfferServiceInstance;
}
