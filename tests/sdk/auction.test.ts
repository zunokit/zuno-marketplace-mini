/**
 * Auction Module Tests using SDK Testing Utilities
 */
import {
  createMockSDK,
  createMockAuction,
  createMockTxReceipt,
} from "zuno-marketplace-sdk/testing";

describe("Auction Module", () => {
  let mockSdk: ReturnType<typeof createMockSDK>;

  beforeEach(() => {
    mockSdk = createMockSDK();
  });

  describe("createEnglishAuction", () => {
    it("should create an English auction", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      mockSdk.auction.createEnglishAuction.mockResolvedValue({
        auctionId: "auction-1",
        tx: mockTx,
      });

      const result = await mockSdk.auction.createEnglishAuction({
        collectionAddress: "0x" + "1".repeat(40),
        tokenId: "1",
        startingBid: "1.0",
        duration: 86400,
      });

      expect(result.auctionId).toBe("auction-1");
      expect(result.tx.status).toBe(1);
    });
  });

  describe("createDutchAuction", () => {
    it("should create a Dutch auction", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      mockSdk.auction.createDutchAuction.mockResolvedValue({
        auctionId: "dutch-1",
        tx: mockTx,
      });

      const result = await mockSdk.auction.createDutchAuction({
        collectionAddress: "0x" + "1".repeat(40),
        tokenId: "1",
        startingPrice: "10.0",
        endingPrice: "1.0",
        duration: 86400,
      });

      expect(result.auctionId).toBe("dutch-1");
    });
  });

  describe("placeBid", () => {
    it("should place a bid successfully", async () => {
      const mockTx = createMockTxReceipt({ status: 1 });
      mockSdk.auction.placeBid.mockResolvedValue({ tx: mockTx });

      const result = await mockSdk.auction.placeBid({
        auctionId: "auction-1",
        amount: "2.0",
      });

      expect(result.tx.status).toBe(1);
    });

    it("should reject bid lower than current", async () => {
      mockSdk.auction.placeBid.mockRejectedValue(
        Object.assign(new Error("Bid too low"), { code: "BID_TOO_LOW" })
      );

      await expect(
        mockSdk.auction.placeBid({
          auctionId: "auction-1",
          amount: "0.5",
        })
      ).rejects.toThrow("Bid too low");
    });
  });

  describe("getAuction", () => {
    it("should return auction details", async () => {
      const mockAuction = createMockAuction({
        auctionId: "auction-1",
        currentBid: "3.0",
        auctionType: "english",
      });
      mockSdk.auction.getAuction.mockResolvedValue(mockAuction);

      const auction = await mockSdk.auction.getAuction("auction-1");

      expect(auction.auctionId).toBe("auction-1");
      expect(auction.currentBid).toBe("3.0");
      expect(auction.auctionType).toBe("english");
    });
  });

  describe("getCurrentPrice", () => {
    it("should return current price for Dutch auction", async () => {
      mockSdk.auction.getCurrentPrice.mockResolvedValue("5.5");

      const price = await mockSdk.auction.getCurrentPrice("dutch-1");

      expect(price).toBe("5.5");
    });
  });
});
