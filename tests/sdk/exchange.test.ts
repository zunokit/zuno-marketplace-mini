/**
 * Exchange Module Tests using SDK Testing Utilities
 * Demonstrates usage of zuno-marketplace-sdk/testing
 */
import {
  createMockSDK,
  createMockListing,
  createMockTxReceipt,
  expectZunoError,
  waitFor,
} from "zuno-marketplace-sdk/testing";

describe("Exchange Module", () => {
  let mockSdk: ReturnType<typeof createMockSDK>;

  beforeEach(() => {
    mockSdk = createMockSDK();
  });

  describe("listNFT", () => {
    it("should create a new listing successfully", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      mockSdk.exchange.listNFT.mockResolvedValue({
        listingId: "123",
        tx: mockTx,
      });

      const result = await mockSdk.exchange.listNFT({
        collectionAddress: "0x" + "1".repeat(40),
        tokenId: "1",
        price: "1.5",
        duration: 86400,
      });

      expect(result.listingId).toBe("123");
      expect(result.tx.status).toBe(1);
      expect(mockSdk.exchange.listNFT.calls).toHaveLength(1);
    });

    it("should handle listing errors", async () => {
      mockSdk.exchange.listNFT.mockRejectedValue(
        Object.assign(new Error("Insufficient balance"), {
          code: "INSUFFICIENT_BALANCE",
        })
      );

      await expectZunoError(
        () =>
          mockSdk.exchange.listNFT({
            collectionAddress: "0x" + "1".repeat(40),
            tokenId: "1",
            price: "1.5",
            duration: 86400,
          }),
        "INSUFFICIENT_BALANCE"
      );
    });
  });

  describe("buyNFT", () => {
    it("should purchase NFT successfully", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      mockSdk.exchange.buyNFT.mockResolvedValue({ tx: mockTx });

      const result = await mockSdk.exchange.buyNFT({
        listingId: "123",
        price: "1.5",
      });

      expect(result.tx.status).toBe(1);
      expect(mockSdk.exchange.buyNFT.calls).toHaveLength(1);
    });
  });

  describe("getListing", () => {
    it("should return listing details", async () => {
      const mockListing = createMockListing({
        listingId: "456",
        price: "2.0",
        isActive: true,
      });
      mockSdk.exchange.getListing.mockResolvedValue(mockListing);

      const listing = await mockSdk.exchange.getListing("456");

      expect(listing.listingId).toBe("456");
      expect(listing.price).toBe("2.0");
      expect(listing.isActive).toBe(true);
    });
  });

  describe("cancelListing", () => {
    it("should cancel listing successfully", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      mockSdk.exchange.cancelListing.mockResolvedValue({ tx: mockTx });

      const result = await mockSdk.exchange.cancelListing({ listingId: "123" });

      expect(result.tx.status).toBe(1);
    });
  });
});

describe("Async Utilities", () => {
  it("should wait for condition", async () => {
    let ready = false;
    setTimeout(() => {
      ready = true;
    }, 100);

    await waitFor(() => ready, { timeout: 1000, interval: 50 });
    expect(ready).toBe(true);
  });
});
