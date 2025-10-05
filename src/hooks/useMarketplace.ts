"use client";
import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  addListing,
  updateListing,
  removeListing,
  clearListings,
  setError,
  fetchActiveListings,
} from "@/lib/store/slices/listingSlice";
import { addNotification } from "@/lib/store/slices/notificationSlice";
import { exchangeService } from "@/lib/services/contracts/ExchangeService";
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
      console.error("Failed to initialize marketplace service:", error);
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
        console.error("Failed to create listing:", error);
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
    async (listingId: string, price: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        const tx = await exchangeService.buyNFT(listingId, "1", "1", "ERC721"); // Default to ERC721

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

          // Update listing status
          dispatch(updateListing({ id: listingId, status: "SOLD" }));
        }

        return receipt;
      } catch (error) {
        console.error("Failed to buy listing:", error);
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
    [wallet.isConnected, dispatch, initializeService]
  );

  /**
   * Cancel a listing
   */
  const cancelListing = useCallback(
    async (listingId: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        const tx = await exchangeService.cancelListing(
          listingId,
          "1",
          "ERC721"
        ); // Default to ERC721

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

          // Update listing status
          dispatch(updateListing({ id: listingId, status: "CANCELLED" }));
        }

        return receipt;
      } catch (error) {
        console.error("Failed to cancel listing:", error);
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
    [wallet.isConnected, dispatch, initializeService]
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
          newPrice
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
        console.error("Failed to update listing price:", error);
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
        console.error("Failed to get user listings:", error);
        return [];
      }
    },
    [wallet.account]
  );

  // Note: Event listeners are now handled by RealTimeEventsService
  // in the individual pages (offers, bundles, auctions)

  return {
    ...listings,
    createListing,
    buyListing,
    cancelListing,
    updateListingPrice,
    getUserListings,
  };
};
