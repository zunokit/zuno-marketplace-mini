"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { logger } from "@/lib/utils/logger";
import { addNotification } from "@/lib/store/slices/notificationSlice";
import { bundleService } from "@/lib/services/contracts";

export const useBundle = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);

  /**
   * Create a bundle
   */
  const createBundle = useCallback(
    async (params: {
      nfts: Array<{
        contractAddress: string;
        tokenId: string;
        tokenType: "ERC721" | "ERC1155";
        amount?: string;
      }>;
      price: string;
      duration: string; // in days
    }) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("create-bundle");
        logger.info("Creating bundle", params, {
          component: "useBundle",
          action: "createBundle",
        });

        const tx = await bundleService.createBundle({
          items: params.nfts.map((nft) => ({
            collection: nft.contractAddress,
            tokenId: nft.tokenId,
            amount: nft.amount || "1",
            tokenType: nft.tokenType,
          })),
          totalPrice: params.price,
          discountPercentage: 0,
          duration: parseInt(params.duration) * 86400, // Convert days to seconds
          description: "",
          imageUrl: "",
        });

        dispatch(
          addNotification({
            type: "info",
            title: "Bundle Creation",
            message: "Transaction submitted...",
          })
        );

        // Service already waits for transaction and returns bundleId
        const bundleId = await tx;

        logger.endTimer("create-bundle", "Bundle created successfully");
        dispatch(
          addNotification({
            type: "success",
            title: "Bundle Created",
            message: `Your bundle has been created! ID: ${bundleId}`,
          })
        );

        return bundleId;
      } catch (error) {
        logger.error("Failed to create bundle", error, {
          component: "useBundle",
          action: "createBundle",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Bundle Creation Failed",
            message:
              error instanceof Error ? error.message : "Failed to create bundle",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Purchase a bundle
   */
  const buyBundle = useCallback(
    async (bundleId: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("buy-bundle");
        logger.info("Purchasing bundle", { bundleId }, {
          component: "useBundle",
          action: "buyBundle",
        });

        // Get bundle info to get the price
        const bundleInfo = await bundleService.getBundle(bundleId);
        const price = bundleInfo.totalPrice || "0";

        const tx = await bundleService.purchaseBundle(bundleId, price);

        dispatch(
          addNotification({
            type: "info",
            title: "Purchasing Bundle",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("buy-bundle", "Bundle purchased successfully");
          dispatch(
            addNotification({
              type: "success",
              title: "Bundle Purchased",
              message: "You have purchased the bundle!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to purchase bundle", error, {
          component: "useBundle",
          action: "buyBundle",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Purchase Failed",
            message:
              error instanceof Error ? error.message : "Failed to purchase bundle",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Cancel a bundle
   */
  const cancelBundle = useCallback(
    async (bundleId: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("cancel-bundle");
        logger.info("Cancelling bundle", { bundleId }, {
          component: "useBundle",
          action: "cancelBundle",
        });

        const tx = await bundleService.cancelBundle(bundleId);

        dispatch(
          addNotification({
            type: "info",
            title: "Cancelling Bundle",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("cancel-bundle", "Bundle cancelled successfully");
          dispatch(
            addNotification({
              type: "success",
              title: "Bundle Cancelled",
              message: "Your bundle has been cancelled!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to cancel bundle", error, {
          component: "useBundle",
          action: "cancelBundle",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Cancellation Failed",
            message:
              error instanceof Error ? error.message : "Failed to cancel bundle",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Get active bundles
   */
  const getActiveBundles = useCallback(async () => {
    try {
      logger.info("Fetching active bundles", null, {
        component: "useBundle",
        action: "getActiveBundles",
      });

      const bundles = await bundleService.getActiveBundles();
      return bundles;
    } catch (error) {
      logger.error("Failed to get active bundles", error, {
        component: "useBundle",
        action: "getActiveBundles",
      });
      return [];
    }
  }, []);

  /**
   * Get user's bundles
   */
  const getUserBundles = useCallback(
    async (userAddress?: string) => {
      try {
        const address = userAddress || wallet.account;
        if (!address) return [];

        logger.info("Fetching user bundles", { address }, {
          component: "useBundle",
          action: "getUserBundles",
        });

        const bundles = await bundleService.getUserBundles(address);
        return bundles;
      } catch (error) {
        logger.error("Failed to get user bundles", error, {
          component: "useBundle",
          action: "getUserBundles",
        });
        return [];
      }
    },
    [wallet.account]
  );

  return {
    createBundle,
    buyBundle,
    cancelBundle,
    getActiveBundles,
    getUserBundles,
  };
};
