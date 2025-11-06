"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { logger } from "@/lib/utils/logger";
import { addNotification } from "@/lib/store/slices/notificationSlice";
import { auctionService } from "@/lib/services/contracts";

export const useAuction = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);

  /**
   * Create English Auction
   */
  const createEnglishAuction = useCallback(
    async (params: {
      tokenContract: string;
      tokenId: string;
      amount?: string;
      startPrice: string;
      reservePrice?: string;
      minBidIncrement: string;
      duration: string; // in days
    }) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("create-english-auction");
        logger.info(
          "Creating English auction",
          params,
          { component: "useAuction", action: "createEnglishAuction" }
        );

        const tx = await auctionService.createEnglishAuction({
          nftContract: params.tokenContract,
          tokenId: params.tokenId,
          amount: params.amount || "1",
          startPrice: params.startPrice,
          reservePrice: params.reservePrice || "0",
          duration: parseInt(params.duration), // in hours as per type
        });

        dispatch(
          addNotification({
            type: "info",
            title: "Auction Creation",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("create-english-auction", "English auction created");
          dispatch(
            addNotification({
              type: "success",
              title: "Auction Created",
              message: "Your English auction has been created!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to create English auction", error, {
          component: "useAuction",
          action: "createEnglishAuction",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Auction Creation Failed",
            message:
              error instanceof Error ? error.message : "Failed to create auction",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Create Dutch Auction
   */
  const createDutchAuction = useCallback(
    async (params: {
      tokenContract: string;
      tokenId: string;
      amount?: string;
      startPrice: string;
      endPrice: string;
      priceDropPerHour?: string;
      duration: string; // in hours
    }) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("create-dutch-auction");
        logger.info(
          "Creating Dutch auction",
          params,
          { component: "useAuction", action: "createDutchAuction" }
        );

        const tx = await auctionService.createDutchAuction({
          nftContract: params.tokenContract,
          tokenId: params.tokenId,
          amount: params.amount || "1",
          startPrice: params.startPrice,
          reservePrice: params.endPrice || "0", // endPrice maps to reservePrice
          duration: parseInt(params.duration), // in hours as per type
          priceDropPerHour: params.priceDropPerHour || "0.01",
        });

        dispatch(
          addNotification({
            type: "info",
            title: "Auction Creation",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("create-dutch-auction", "Dutch auction created");
          dispatch(
            addNotification({
              type: "success",
              title: "Auction Created",
              message: "Your Dutch auction has been created!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to create Dutch auction", error, {
          component: "useAuction",
          action: "createDutchAuction",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Auction Creation Failed",
            message:
              error instanceof Error ? error.message : "Failed to create auction",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Place bid on English auction
   */
  const placeBid = useCallback(
    async (auctionId: string, bidAmount: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("place-bid");
        logger.info(
          "Placing bid",
          { auctionId, bidAmount },
          { component: "useAuction", action: "placeBid" }
        );

        const tx = await auctionService.placeBid(auctionId, bidAmount);

        dispatch(
          addNotification({
            type: "info",
            title: "Placing Bid",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("place-bid", "Bid placed successfully");
          dispatch(
            addNotification({
              type: "success",
              title: "Bid Placed",
              message: "Your bid has been placed!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to place bid", error, {
          component: "useAuction",
          action: "placeBid",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Bid Failed",
            message: error instanceof Error ? error.message : "Failed to place bid",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Buy Dutch auction at current price
   */
  const buyDutchAuction = useCallback(
    async (auctionId: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("buy-dutch-auction");
        logger.info(
          "Buying Dutch auction",
          { auctionId },
          { component: "useAuction", action: "buyDutchAuction" }
        );

        // Get current price from auction
        const auctionInfo = await auctionService.getDutchAuctionInfo(auctionId);
        const currentPrice = auctionInfo.currentPrice || "0";

        const tx = await auctionService.buyFromDutchAuction(
          auctionId,
          currentPrice
        );

        dispatch(
          addNotification({
            type: "info",
            title: "Purchase",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("buy-dutch-auction", "Dutch auction purchased");
          dispatch(
            addNotification({
              type: "success",
              title: "Purchase Successful",
              message: "You have purchased the NFT!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to buy Dutch auction", error, {
          component: "useAuction",
          action: "buyDutchAuction",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Purchase Failed",
            message:
              error instanceof Error ? error.message : "Failed to purchase NFT",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Cancel auction
   */
  const cancelAuction = useCallback(
    async (auctionId: string, auctionType: "ENGLISH" | "DUTCH") => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("cancel-auction");
        logger.info(
          "Cancelling auction",
          { auctionId, auctionType },
          { component: "useAuction", action: "cancelAuction" }
        );

        const tx =
          auctionType === "ENGLISH"
            ? await auctionService.cancelEnglishAuction(auctionId)
            : await auctionService.cancelDutchAuction(auctionId);

        dispatch(
          addNotification({
            type: "info",
            title: "Cancelling Auction",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("cancel-auction", "Auction cancelled");
          dispatch(
            addNotification({
              type: "success",
              title: "Auction Cancelled",
              message: "Your auction has been cancelled!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to cancel auction", error, {
          component: "useAuction",
          action: "cancelAuction",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Cancellation Failed",
            message:
              error instanceof Error ? error.message : "Failed to cancel auction",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Get active auctions - simplified version
   * Returns empty arrays - actual data should be fetched via components
   */
  const getActiveAuctions = useCallback(async () => {
    try {
      logger.info("Fetching active auctions", null, {
        component: "useAuction",
        action: "getActiveAuctions",
      });

      // Return empty - components will fetch via direct service calls
      return {
        english: [],
        dutch: [],
      };
    } catch (error) {
      logger.error("Failed to get active auctions", error, {
        component: "useAuction",
        action: "getActiveAuctions",
      });
      return { english: [], dutch: [] };
    }
  }, []);

  return {
    createEnglishAuction,
    createDutchAuction,
    placeBid,
    buyDutchAuction,
    cancelAuction,
    getActiveAuctions,
  };
};
