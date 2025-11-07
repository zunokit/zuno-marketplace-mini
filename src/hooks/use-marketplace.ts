"use client";
import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { logger } from "@/lib/utils/logger";
import {
  addListing,
  updateListing,
  removeListing,
  clearListings,
  setError,
  fetchActiveListings,
} from "@/lib/store/slices/listingSlice";
import { addNotification } from "@/lib/store/slices/notificationSlice";
import { exchangeService } from "@/lib/services/contracts";
import { web3Utils } from "@/lib/utils/web3";

export const useMarketplace = () => {
  const dispatch = useAppDispatch();
  const listings = useAppSelector((state) => state.listing);
  const wallet = useAppSelector((state) => state.wallet);

  /**
   * Initialize marketplace service
   */
  const initializeService = useCallback(async () => {
    try {
      const provider = web3Utils.getProvider();
      const signer = web3Utils.getSigner();

      if (provider) {
      }
    } catch (error) {
      logger.error("Failed to initialize marketplace service", error, {
        component: "useMarketplace",
        action: "initialize",
      });
      dispatch(
        setError(
          error instanceof Error
            ? error.message
            : "Failed to initialize marketplace"
        )
      );
    }
  }, [dispatch]);

  /**
   * Create a new listing
   */
  const createListing = useCallback(
    async (
      tokenContract: string,
      tokenId: string,
      price: string,
      currency?: string
    ) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        const tx = await exchangeService.createListing({
          contractAddress: tokenContract,
          tokenId,
          price,
          duration: "30", // 30 days default
          tokenType: "ERC721", // Default to ERC721
        });

        dispatch(
          addNotification({
            type: "info",
            title: "Listing Creation",
            message: "Transaction submitted. Waiting for confirmation...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          dispatch(
            addNotification({
              type: "success",
              title: "Listing Created",
              message: "Your NFT has been listed successfully!",
            })
          );

          // Refresh listings
          dispatch(fetchActiveListings());
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to create listing", error, {
          component: "useMarketplace",
          action: "createListing",
        });
        dispatch(
          setError(
            error instanceof Error ? error.message : "Failed to create listing"
          )
        );
        dispatch(
          addNotification({
            type: "error",
            title: "Listing Failed",
            message:
              error instanceof Error
                ? error.message
                : "Failed to create listing",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch, initializeService]
  );

  /**
   * Buy a listing
   */
  const buyListing = useCallback(
    async (
      contractAddress: string,
      tokenId: string,
      amount: string = "1",
      tokenType: "ERC721" | "ERC1155" = "ERC721"
    ) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        const tx = await exchangeService.buyNFT(
          contractAddress,
          tokenId,
          amount,
          tokenType
        );

        dispatch(
          addNotification({
            type: "info",
            title: "Purchase",
            message: "Transaction submitted. Waiting for confirmation...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          dispatch(
            addNotification({
              type: "success",
              title: "Purchase Successful",
              message: "You have successfully purchased the NFT!",
            })
          );

          // Refresh listings
          dispatch(fetchActiveListings());
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to buy listing", error, {
          component: "useMarketplace",
          action: "buyListing",
        });
        dispatch(
          setError(
            error instanceof Error ? error.message : "Failed to buy listing"
          )
        );
        dispatch(
          addNotification({
            type: "error",
            title: "Purchase Failed",
            message:
              error instanceof Error ? error.message : "Failed to buy listing",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Cancel a listing
   */
  const cancelListing = useCallback(
    async (
      contractAddress: string,
      tokenId: string,
      tokenType: "ERC721" | "ERC1155" = "ERC721"
    ) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        const tx = await exchangeService.cancelListing(
          contractAddress,
          tokenId,
          tokenType
        );

        dispatch(
          addNotification({
            type: "info",
            title: "Cancellation",
            message: "Transaction submitted. Waiting for confirmation...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          dispatch(
            addNotification({
              type: "success",
              title: "Listing Cancelled",
              message: "Your listing has been cancelled successfully!",
            })
          );

          // Refresh listings
          dispatch(fetchActiveListings());
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to cancel listing", error, {
          component: "useMarketplace",
          action: "cancelListing",
        });
        dispatch(
          setError(
            error instanceof Error ? error.message : "Failed to cancel listing"
          )
        );
        dispatch(
          addNotification({
            type: "error",
            title: "Cancellation Failed",
            message:
              error instanceof Error
                ? error.message
                : "Failed to cancel listing",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Update listing price
   */
  const updateListingPrice = useCallback(
    async (listingId: string, newPrice: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        await initializeService();
        const tx = await exchangeService.updateListingPrice(
          listingId,
          newPrice,
          "ERC721"
        );

        dispatch(
          addNotification({
            type: "info",
            title: "Price Update",
            message: "Transaction submitted. Waiting for confirmation...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          dispatch(
            addNotification({
              type: "success",
              title: "Price Updated",
              message: "Listing price has been updated successfully!",
            })
          );

          // Update listing price in store
          dispatch(updateListing({ id: listingId, price: newPrice }));
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to update listing price", error, {
          component: "useMarketplace",
          action: "updateListingPrice",
        });
        dispatch(
          setError(
            error instanceof Error ? error.message : "Failed to update price"
          )
        );
        dispatch(
          addNotification({
            type: "error",
            title: "Price Update Failed",
            message:
              error instanceof Error ? error.message : "Failed to update price",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch, initializeService]
  );

  /**
   * Get user's listings
   */
  const getUserListings = useCallback(
    async (userAddress?: string) => {
      try {
        const address = userAddress || wallet.account;
        if (!address) return [];

        const listings = await exchangeService.getUserListings(address);

        return listings;
      } catch (error) {
        logger.error("Failed to get user listings", error, {
          component: "useMarketplace",
          action: "getUserListings",
        });
        return [];
      }
    },
    [wallet.account]
  );

  /**
   * Fetch active listings
   */
  const fetchListings = useCallback(() => {
    dispatch(fetchActiveListings());
  }, [dispatch]);

  // Note: Event listeners are now handled by RealTimeEventsService
  // in the individual pages (offers, bundles, auctions)

  return {
    ...listings,
    createListing,
    buyListing,
    cancelListing,
    updateListingPrice,
    getUserListings,
    fetchActiveListings: fetchListings,
  };
};
