/**
 * Collection Module Tests using SDK Testing Utilities
 */
import {
  createMockSDK,
  createMockCollection,
  createMockTxReceipt,
  generateMockAddress,
  generateMockTokenId,
} from "zuno-marketplace-sdk/testing";
import type { CollectionParams, MintERC721Params, BatchMintERC721Params } from "zuno-marketplace-sdk";

describe("Collection Module", () => {
  let mockSdk: ReturnType<typeof createMockSDK>;

  beforeEach(() => {
    mockSdk = createMockSDK();
  });

  describe("createERC721Collection", () => {
    it("should create an ERC721 collection", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      const collectionAddress = generateMockAddress();

      mockSdk.collection.createERC721Collection.mockResolvedValue({
        address: collectionAddress,
        tx: mockTx,
      });

      const params: CollectionParams = {
        name: "Test Collection",
        symbol: "TEST",
        maxSupply: 10000,
        description: "A test collection",
        mintPrice: "0.01",
        royaltyFee: 250, // 2.5%
      };

      const result = await mockSdk.collection.createERC721Collection(params);

      expect(result.address).toBe(collectionAddress);
      expect(result.tx.status).toBe(1);
    });
  });

  describe("createERC1155Collection", () => {
    it("should create an ERC1155 collection", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      const collectionAddress = generateMockAddress();

      mockSdk.collection.createERC1155Collection.mockResolvedValue({
        address: collectionAddress,
        tx: mockTx,
      });

      const params: CollectionParams = {
        name: "Multi Token",
        symbol: "MULTI",
        maxSupply: 10000,
      };

      const result = await mockSdk.collection.createERC1155Collection(params);

      expect(result.address).toBe(collectionAddress);
    });
  });

  describe("mintNFT", () => {
    it("should mint a new NFT", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      const tokenId = generateMockTokenId();

      mockSdk.collection.mintNFT.mockResolvedValue({
        tokenId,
        tx: mockTx,
      });

      const params: MintERC721Params = {
        collectionAddress: generateMockAddress(),
        recipient: generateMockAddress(),
        value: "0.01",
      };

      const result = await mockSdk.collection.mintNFT(params);

      expect(result.tokenId).toBe(tokenId);
      expect(result.tx.status).toBe(1);
    });
  });

  describe("batchMint", () => {
    it("should batch mint multiple NFTs", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });

      mockSdk.collection.batchMint.mockResolvedValue({
        tokenIds: ["1", "2", "3"],
        tx: mockTx,
      });

      const params: BatchMintERC721Params = {
        collectionAddress: generateMockAddress(),
        recipient: generateMockAddress(),
        amount: 3,
        value: "0.03",
      };

      const result = await mockSdk.collection.batchMint(params);

      expect(result.tokenIds).toHaveLength(3);
      expect(result.tokenIds).toEqual(["1", "2", "3"]);
    });
  });

  describe("getCollection", () => {
    it("should return collection details", async () => {
      const mockCollection = createMockCollection({
        name: "My Collection",
        symbol: "MC",
        totalSupply: 500,
      });

      mockSdk.collection.getCollection.mockResolvedValue(mockCollection);

      const collection = await mockSdk.collection.getCollection(
        generateMockAddress()
      );

      expect(collection.name).toBe("My Collection");
      expect(collection.symbol).toBe("MC");
      expect(collection.totalSupply).toBe(500);
    });
  });
});

describe("Mock Utilities", () => {
  it("should generate valid mock addresses", () => {
    const address = generateMockAddress();

    expect(address).toMatch(/^0x[a-f0-9]{40}$/);
  });

  it("should generate unique addresses", () => {
    const addresses = new Set(
      Array.from({ length: 10 }, () => generateMockAddress())
    );

    expect(addresses.size).toBe(10);
  });

  it("should generate mock token IDs", () => {
    const tokenId = generateMockTokenId();

    expect(Number(tokenId)).toBeGreaterThanOrEqual(0);
    expect(Number(tokenId)).toBeLessThan(1000000);
  });
});
