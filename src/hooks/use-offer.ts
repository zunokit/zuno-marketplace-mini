"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { logger } from "@/lib/utils/logger";
import { addNotification } from "@/lib/store/slices/notificationSlice";
import { offerService } from "@/lib/services/contracts/OfferService";

export const useOffer = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);

  /**
   * Make NFT offer
   */
  const makeNFTOffer = useCallback(
    async (params: {
      contractAddress: string;
      tokenId: string;
      price: string;
      expiry: string;
    }) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("make-nft-offer");
        logger.info("Making NFT offer", params, {
          component: "useOffer",
          action: "makeNFTOffer",
        });

        const offerId = await offerService.createNFTOffer({
          collection: params.contractAddress,
          tokenId: params.tokenId,
          price: params.price,
          expirationTime: Math.floor(Date.now() / 1000) + parseInt(params.expiry) * 86400, // Unix timestamp
        });

        dispatch(
          addNotification({
            type: "info",
            title: "Offer",
            message: "Transaction submitted...",
          })
        );

        // Service already waits and returns offerId
        logger.endTimer("make-nft-offer", "NFT offer created");
        dispatch(
          addNotification({
            type: "success",
            title: "Offer Created",
            message: `Your NFT offer has been created! ID: ${offerId}`,
          })
        );

        return offerId;
      } catch (error) {
        logger.error("Failed to make NFT offer", error, {
          component: "useOffer",
          action: "makeNFTOffer",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Offer Failed",
            message: error instanceof Error ? error.message : "Failed",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Make collection offer
   */
  const makeCollectionOffer = useCallback(
    async (params: {
      contractAddress: string;
      price: string;
      quantity: string;
      expiry: string;
    }) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("make-collection-offer");
        logger.info("Making collection offer", params, {
          component: "useOffer",
          action: "makeCollectionOffer",
        });

        const offerId = await offerService.createCollectionOffer({
          collection: params.contractAddress,
          price: params.price,
          quantity: parseInt(params.quantity),
          expirationTime: Math.floor(Date.now() / 1000) + parseInt(params.expiry) * 86400, // Unix timestamp
        });

        dispatch(
          addNotification({
            type: "info",
            title: "Offer",
            message: "Transaction submitted...",
          })
        );

        // Service already waits and returns offerId
        logger.endTimer("make-collection-offer", "Collection offer created");
        dispatch(
          addNotification({
            type: "success",
            title: "Offer Created",
            message: `Your collection offer has been created! ID: ${offerId}`,
          })
        );

        return offerId;
      } catch (error) {
        logger.error("Failed to make collection offer", error, {
          component: "useOffer",
          action: "makeCollectionOffer",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Offer Failed",
            message: error instanceof Error ? error.message : "Failed",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Make trait offer
   */
  const makeTraitOffer = useCallback(
    async (params: {
      contractAddress: string;
      traitType: string;
      traitValue: string;
      price: string;
      quantity: string;
      expiry: string;
    }) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("make-trait-offer");
        logger.info("Making trait offer", params, {
          component: "useOffer",
          action: "makeTraitOffer",
        });

        const offerId = await offerService.createTraitOffer({
          collection: params.contractAddress,
          traits: [`${params.traitType}:${params.traitValue}`], // Combine into traits array
          price: params.price,
          quantity: parseInt(params.quantity),
          expirationTime: Math.floor(Date.now() / 1000) + parseInt(params.expiry) * 86400, // Unix timestamp
        });

        dispatch(
          addNotification({
            type: "info",
            title: "Offer",
            message: "Transaction submitted...",
          })
        );

        // Service already waits and returns offerId
        logger.endTimer("make-trait-offer", "Trait offer created");
        dispatch(
          addNotification({
            type: "success",
            title: "Offer Created",
            message: `Your trait offer has been created! ID: ${offerId}`,
          })
        );

        return offerId;
      } catch (error) {
        logger.error("Failed to make trait offer", error, {
          component: "useOffer",
          action: "makeTraitOffer",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Offer Failed",
            message: error instanceof Error ? error.message : "Failed",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Accept an offer
   */
  const acceptOffer = useCallback(
    async (offerId: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("accept-offer");
        logger.info("Accepting offer", { offerId }, {
          component: "useOffer",
          action: "acceptOffer",
        });

        const tx = await offerService.acceptOffer(offerId);

        dispatch(
          addNotification({
            type: "info",
            title: "Accept Offer",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("accept-offer", "Offer accepted");
          dispatch(
            addNotification({
              type: "success",
              title: "Offer Accepted",
              message: "You have accepted the offer!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to accept offer", error, {
          component: "useOffer",
          action: "acceptOffer",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Accept Failed",
            message: error instanceof Error ? error.message : "Failed",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Cancel an offer
   */
  const cancelOffer = useCallback(
    async (offerId: string) => {
      try {
        if (!wallet.isConnected) {
          throw new Error("Wallet not connected");
        }

        logger.startTimer("cancel-offer");
        logger.info("Cancelling offer", { offerId }, {
          component: "useOffer",
          action: "cancelOffer",
        });

        const tx = await offerService.cancelOffer(offerId);

        dispatch(
          addNotification({
            type: "info",
            title: "Cancel Offer",
            message: "Transaction submitted...",
          })
        );

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
          logger.endTimer("cancel-offer", "Offer cancelled");
          dispatch(
            addNotification({
              type: "success",
              title: "Offer Cancelled",
              message: "Your offer has been cancelled!",
            })
          );
        }

        return receipt;
      } catch (error) {
        logger.error("Failed to cancel offer", error, {
          component: "useOffer",
          action: "cancelOffer",
        });
        dispatch(
          addNotification({
            type: "error",
            title: "Cancel Failed",
            message: error instanceof Error ? error.message : "Failed",
          })
        );
        throw error;
      }
    },
    [wallet.isConnected, dispatch]
  );

  /**
   * Get active offers
   */
  const getActiveOffers = useCallback(async () => {
    try {
      logger.info("Fetching active offers", null, {
        component: "useOffer",
        action: "getActiveOffers",
      });

      const offers = await offerService.getActiveOffers();
      return offers;
    } catch (error) {
      logger.error("Failed to get offers", error, {
        component: "useOffer",
        action: "getActiveOffers",
      });
      return [];
    }
  }, []);

  /**
   * Get user's offers
   */
  const getUserOffers = useCallback(
    async (userAddress?: string) => {
      try {
        const address = userAddress || wallet.account;
        if (!address) return { made: [], received: [] };

        logger.info("Fetching user offers", { address }, {
          component: "useOffer",
          action: "getUserOffers",
        });

        const offers = await offerService.getUserOffers(address);

        // Split into made and received (service returns all offers)
        return {
          made: offers.filter((o: any) => o.offerer === address),
          received: offers.filter((o: any) => o.seller === address),
        };
      } catch (error) {
        logger.error("Failed to get user offers", error, {
          component: "useOffer",
          action: "getUserOffers",
        });
        return { made: [], received: [] };
      }
    },
    [wallet.account]
  );

  return {
    makeNFTOffer,
    makeCollectionOffer,
    makeTraitOffer,
    acceptOffer,
    cancelOffer,
    getActiveOffers,
    getUserOffers,
  };
};
