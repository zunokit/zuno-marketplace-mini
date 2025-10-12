/**
 * Collection Service
 * Handles ERC721/ERC1155 collection creation and operations
 * Uses MarketplaceHub for factory address discovery
 */

import { ethers } from "ethers";
import { marketplaceHubService } from "./MarketplaceHubService";
import { logger } from "@/lib/utils/logger";
import {
  ERC721Collection_ABI,
  ERC1155Collection_ABI,
  ERC721CollectionFactory_ABI,
  ERC1155CollectionFactory_ABI,
} from "@/lib/contracts/abis";
import {
  ZERO_ADDRESS,
  INTERFACE_IDS,
  CONTRACT_CONSTANTS,
} from "@/lib/constants";
import { safeContractCall, supportsInterface } from "@/lib/utils/contract";
import type { NFTType } from "@/types/contract";
import type {
  CreateCollectionParams,
  MintParams,
  TransferParams,
  CollectionInfo,
  MintInfo,
  MintStage,
  CollectionVerification,
  MintedToken,
} from "@/types/collection";

export class CollectionService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize collection service
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
  }

  /**
   * Get collection factory for token type
   */
  private async getFactoryContract(
    tokenType: NFTType
  ): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    // Ensure hub is initialized first
    if (!this.provider || !this.signer) {
      throw new Error(
        "CollectionService not initialized - call initialize() first"
      );
    }

    // Try to get factory address, catching any hub initialization errors
    let factoryAddress: string;
    try {
      factoryAddress = marketplaceHubService.getCollectionFactory(tokenType);
    } catch (error) {
      // If hub not initialized, try to initialize it
      const err = error as Error;
      if (err.message?.includes("Hub not initialized")) {
        await marketplaceHubService.initialize(this.provider, this.signer);
        factoryAddress = marketplaceHubService.getCollectionFactory(tokenType);
      } else {
        throw error;
      }
    }

    if (!factoryAddress || factoryAddress === ZERO_ADDRESS) {
      throw new Error(
        `${tokenType} Factory not available. Please ensure contracts are deployed and hub is initialized.`
      );
    }

    const abi =
      tokenType === "ERC721"
        ? ERC721CollectionFactory_ABI
        : ERC1155CollectionFactory_ABI;

    return new ethers.Contract(factoryAddress, abi, this.signer);
  }

  /**
   * Create a new collection
   */
  async createCollection(params: CreateCollectionParams): Promise<string> {
    try {
      const factory = await this.getFactoryContract(params.tokenType);

      // Get current account as owner
      const account = await this.signer!.getAddress();

      // Prepare struct parameters - all uint256 values must be strings for ethers v6
      const collectionParams = {
        name: params.name,
        symbol: params.symbol,
        owner: params.owner || account,
        description: params.description || "",
        mintPrice: ethers.parseEther(params.mintPrice || "0.001").toString(),
        royaltyFee: (parseInt(params.royaltyFee || "5") * 100).toString(),
        maxSupply: (params.maxSupply || "10000").toString(),
        mintLimitPerWallet: (params.mintLimitPerWallet || "10").toString(),
        mintStartTime: (
          params.mintStartTime ||
          Math.floor(Date.now() / 1000) -
            CONTRACT_CONSTANTS.MINT_START_TIME_OFFSET
        ).toString(),
        allowlistMintPrice: ethers
          .parseEther(params.allowlistMintPrice || params.mintPrice || "0.001")
          .toString(),
        publicMintPrice: ethers
          .parseEther(params.publicMintPrice || params.mintPrice || "0.001")
          .toString(),
        allowlistStageDuration: (
          params.allowlistStageDuration ||
          CONTRACT_CONSTANTS.DEFAULT_ALLOWLIST_DURATION.toString()
        ).toString(),
        tokenURI: params.baseURI || "https://api.example.com/metadata/",
      };
      // Use correct method name based on token type
      const methodName =
        params.tokenType === "ERC721"
          ? "createERC721Collection"
          : "createERC1155Collection";
      const tx = await factory[methodName](collectionParams);

      const receipt = await tx.wait();

      // Find CollectionCreated event
      const eventName =
        params.tokenType === "ERC721"
          ? "ERC721CollectionCreated"
          : "ERC1155CollectionCreated";
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === eventName;
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = factory.interface.parseLog(event);

        const collectionAddress =
          parsed?.args?.collection ||
          parsed?.args?.collectionAddress ||
          parsed?.args?.[0] ||
          parsed?.args?.[1];

        // Add allowlist addresses if provided
        if (params.allowlist && params.allowlist.length > 0) {
          try {
            const collectionContract = new ethers.Contract(
              collectionAddress,
              params.tokenType === "ERC721"
                ? ERC721Collection_ABI
                : ERC1155Collection_ABI,
              this.signer
            );

            const allowlistTx = await collectionContract.addToAllowlist(
              params.allowlist
            );
            await allowlistTx.wait();
          } catch (error) {
            // Don't throw - collection was created successfully
          }
        }

        if (!collectionAddress || collectionAddress === ZERO_ADDRESS) {
          throw new Error(
            "Collection deployment failed - no valid address returned"
          );
        }

        return collectionAddress;
      }

      // If event parsing fails, try to get the new contract address from transaction receipt
      const factoryAddress = await marketplaceHubService.getCollectionFactory(
        params.tokenType
      );

      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          if (log.topics && log.topics.length > 0) {
            try {
              for (let i = 1; i < log.topics.length; i++) {
                const topic = log.topics[i];
                if (topic && topic.length === 66) {
                  const contractAddress = "0x" + topic.slice(26);
                  if (contractAddress !== ZERO_ADDRESS) {
                    return contractAddress;
                  }
                }
              }

              if (log.address && log.address !== factoryAddress) {
                return log.address;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }
      }

      return "SUCCESS_BUT_ADDRESS_UNKNOWN";
    } catch (error) {
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Get collection contract instance
   */
  private getCollectionContract(
    address: string,
    tokenType: NFTType
  ): ethers.Contract {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    const abi =
      tokenType === "ERC721" ? ERC721Collection_ABI : ERC1155Collection_ABI;

    return new ethers.Contract(address, abi, this.signer || this.provider);
  }

  /**
   * Mint ERC721 NFT
   */
  private async mintERC721(
    collection: ethers.Contract,
    to: string,
    quantity: number,
    finalPricePerNFT: bigint,
    finalTotalPrice: bigint,
    collectionAddress: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (quantity > 1) {
      if (!collection.batchMintERC721) {
        throw new Error("Batch mint function not found in contract ABI");
      }

      let gasEstimate: bigint;
      try {
        gasEstimate = await collection.batchMintERC721.estimateGas(
          to,
          quantity,
          { value: finalTotalPrice }
        );
      } catch (error) {
        const err = error as { reason?: string; message?: string };
        if (err.reason) {
          throw new Error(`Batch mint will fail: ${err.reason}`);
        } else if (err.message) {
          throw new Error(`Gas estimation failed: ${err.message}`);
        }
        throw error;
      }

      const gasLimit = (gasEstimate * 120n) / 100n;
      const txOptions = {
        value: finalTotalPrice,
        gasLimit,
      };

      return await collection.batchMintERC721(to, quantity, txOptions);
    } else {
      if (!collection.mint) {
        throw new Error("Mint function not found in contract ABI");
      }

      let gasEstimate: bigint;
      try {
        gasEstimate = await collection.mint.estimateGas(to, {
          value: finalPricePerNFT,
        });
      } catch (error) {
        const err = error as { reason?: string; message?: string };
        if (err.reason) {
          throw new Error(`Mint will fail: ${err.reason}`);
        } else if (err.message) {
          throw new Error(`Gas estimation failed: ${err.message}`);
        }
        throw error as Error;
      }

      const gasLimit = (gasEstimate * 120n) / 100n;
      const txOptions = {
        value: finalPricePerNFT,
        gasLimit,
      };

      const tx = await collection.mint(to, txOptions);

      // Wait for transaction and log minted NFT info
      tx.wait()
        .then((receipt: ethers.ContractTransactionReceipt | null) => {
          if (receipt && receipt.status === 1) {
            logger.success(
              `Successfully minted ${quantity} ERC721 NFT(s)`,
              {
                contract: collectionAddress,
                transaction: receipt.hash,
                quantity,
              },
              { component: "CollectionService", action: "mintERC721" }
            );

            // Parse Transfer events to get token IDs
            const transferEvents = receipt.logs
              .map((log: ethers.Log | ethers.EventLog) => {
                try {
                  return collection.interface.parseLog(log);
                } catch {
                  return null;
                }
              })
              .filter(
                (event: ethers.LogDescription | null) =>
                  event && event.name === "Transfer"
              );

            if (transferEvents.length > 0) {
              const tokenIds = transferEvents
                .filter(
                  (event: ethers.LogDescription | null) => event?.args?.tokenId
                )
                .map((event: ethers.LogDescription | null) =>
                  event!.args.tokenId.toString()
                );

              logger.info(
                `Minted token IDs: ${tokenIds.join(", ")}`,
                {
                  tokenIds,
                  count: tokenIds.length,
                },
                { component: "CollectionService", action: "mintERC721" }
              );
            }

            logger.info(
              `To import to MetaMask: Add NFT with contract ${collectionAddress}`,
              {
                contract: collectionAddress,
              },
              { component: "CollectionService", action: "mintERC721" }
            );
          }
        })
        .catch((err: Error) => {
          logger.error("Failed to get mint receipt", err, {
            component: "CollectionService",
            action: "mintERC721",
          });
        });

      return tx;
    }
  }

  /**
   * Mint ERC1155 NFT
   */
  private async mintERC1155(
    collection: ethers.Contract,
    to: string,
    amount: string,
    finalTotalPrice: bigint,
    collectionAddress: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!collection.batchMintERC1155) {
      if (!collection.mint) {
        throw new Error(
          "Neither batchMintERC1155 nor mint function found in contract ABI"
        );
      }

      let gasEstimate: bigint;
      try {
        gasEstimate = await collection.mint.estimateGas(to, amount, {
          value: finalTotalPrice,
        });
      } catch (error) {
        const err = error as { reason?: string; message?: string };
        if (err.reason) {
          throw new Error(`Mint will fail: ${err.reason}`);
        } else if (err.message) {
          throw new Error(`Gas estimation failed: ${err.message}`);
        }
        throw error as Error;
      }

      const gasLimit = (gasEstimate * 120n) / 100n;
      const txOptions = {
        value: finalTotalPrice,
        gasLimit,
      };

      return await collection.mint(to, amount, txOptions);
    }

    let gasEstimate: bigint;
    try {
      gasEstimate = await collection.batchMintERC1155.estimateGas(to, amount, {
        value: finalTotalPrice,
      });
    } catch (error) {
      const err = error as { reason?: string; message?: string };
      if (err.reason) {
        throw new Error(`Batch mint will fail: ${err.reason}`);
      } else if (err.message) {
        throw new Error(`Gas estimation failed: ${err.message}`);
      }
      throw error as Error;
    }

    const gasLimit = (gasEstimate * 120n) / 100n;
    const txOptions = {
      value: finalTotalPrice,
      gasLimit,
    };

    const tx = await collection.batchMintERC1155(to, amount, txOptions);

    // Wait for transaction and log minted NFT info
    tx.wait()
      .then((receipt: ethers.ContractTransactionReceipt | null) => {
        if (receipt && receipt.status === 1) {
          logger.success(
            `Successfully minted ${amount} ERC1155 NFT(s)`,
            {
              contract: collectionAddress,
              amount,
            },
            { component: "CollectionService", action: "mintERC1155" }
          );
          logger.info(
            `ERC1155 mint transaction completed`,
            {
              transaction: receipt.hash,
            },
            { component: "CollectionService", action: "mintERC1155" }
          );

          // Parse Transfer events to get token IDs
          const mintedTokens: MintedToken[] = [];

          for (const log of receipt.logs) {
            try {
              const parsed = collection.interface.parseLog(log);
              if (parsed) {
                if (parsed.name === "TransferSingle") {
                  const id = parsed.args.id || parsed.args[3];
                  const value = parsed.args.value || parsed.args[4];
                  if (id) {
                    mintedTokens.push({
                      tokenId: id.toString(),
                      amount: value?.toString() || "1",
                    });
                  }
                } else if (parsed.name === "TransferBatch") {
                  const ids = parsed.args.ids || parsed.args[3];
                  const values = parsed.args.values || parsed.args[4];
                  if (ids && values && Array.isArray(ids)) {
                    for (let i = 0; i < ids.length; i++) {
                      mintedTokens.push({
                        tokenId: ids[i].toString(),
                        amount: Array.isArray(values)
                          ? values[i].toString()
                          : "1",
                      });
                    }
                  }
                }
              }
            } catch {}
          }

          if (mintedTokens.length > 0) {
            console.log(`   Token ID(s):`);
            mintedTokens.forEach(({ tokenId, amount }) => {
              console.log(`   - #${tokenId}: ${amount} NFT(s)`);
            });

            if (mintedTokens.length === 1) {
              console.log(
                `\n💡 To import to MetaMask: Add NFT with contract ${collectionAddress} and token ID ${mintedTokens[0].tokenId}`
              );
            } else {
              console.log(
                `\n💡 To import to MetaMask: Add each token ID separately in MetaMask NFTs tab`
              );
            }
          }
        }
      })
      .catch((err: Error) => {
        console.error("Failed to get mint receipt:", err.message);
      });

    return tx;
  }

  /**
   * Mint NFT
   * For production contracts, mint functions are payable and require ETH
   */
  async mint(params: MintParams): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error("Signer not available - connect wallet first");
      }

      // Auto-detect token type if provided type seems incorrect
      const detectedType = await this.detectTokenType(params.collection).catch(
        () => null
      );
      if (detectedType && detectedType !== params.tokenType) {
        params.tokenType = detectedType;
      }

      const collection = this.getCollectionContract(
        params.collection,
        params.tokenType
      );

      // Verify contract exists
      const code = await this.provider?.getCode(params.collection);
      if (!code || code === "0x") {
        throw new Error(`No contract found at address ${params.collection}`);
      }

      const minterAddress = await this.signer.getAddress();

      // Get mint price with fallbacks
      let mintPrice = ethers.parseEther("0");
      const mintInfo = await collection
        .getMintInfo(minterAddress)
        .catch(() => null);
      if (mintInfo) {
        mintPrice =
          mintInfo.currentMintPrice || mintInfo[4] || ethers.parseEther("0");
      } else {
        mintPrice = await collection
          .getMintPrice()
          .catch(() => ethers.parseEther("0.01"));
      }

      const quantity = parseInt(params.amount || "1");

      let finalPricePerNFT = mintPrice;
      let finalTotalPrice = mintPrice * BigInt(quantity);

      if (params.value) {
        let cleanValue = params.value;
        if (typeof cleanValue === "string" && cleanValue.endsWith(".0")) {
          cleanValue = cleanValue.slice(0, -2);
        }

        try {
          finalTotalPrice = BigInt(cleanValue);
          finalPricePerNFT = finalTotalPrice / BigInt(quantity);
        } catch {}
      }

      // Use switch case for token type
      switch (params.tokenType) {
        case "ERC721":
          return await this.mintERC721(
            collection,
            params.to,
            quantity,
            finalPricePerNFT,
            finalTotalPrice,
            params.collection
          );

        case "ERC1155":
          const amount = params.amount || "1";
          return await this.mintERC1155(
            collection,
            params.to,
            amount,
            finalTotalPrice,
            params.collection
          );

        default:
          throw new Error(`Unsupported token type: ${params.tokenType}`);
      }
    } catch (error) {
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Batch mint multiple NFTs in a single transaction (ERC1155 only)
   */
  async batchMint(
    collection: string,
    to: string,
    amounts: string[],
    value?: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error("Signer not available - connect wallet first");
      }

      const collectionContract = this.getCollectionContract(
        collection,
        "ERC1155"
      );

      // Calculate total mint price
      const minterAddress = await this.signer.getAddress();
      let totalMintPrice = ethers.parseEther("0");

      const mintInfo = await collectionContract
        .getMintInfo(minterAddress)
        .catch(() => null);
      if (mintInfo) {
        const pricePerItem =
          mintInfo.currentMintPrice || mintInfo[4] || ethers.parseEther("0");
        const totalAmount = amounts.reduce(
          (sum, amount) => sum + BigInt(amount),
          BigInt(0)
        );
        totalMintPrice = pricePerItem * totalAmount;
      } else if (value) {
        totalMintPrice = ethers.parseEther(value);
      }

      // Override with explicit value if provided
      if (value) {
        totalMintPrice = ethers.parseEther(value);
      }

      if (collectionContract.batchMint) {
        return await collectionContract.batchMint(to, amounts, {
          value: totalMintPrice,
        });
      } else {
        const totalAmount = amounts
          .reduce((sum, amount) => sum + parseInt(amount), 0)
          .toString();
        return await collectionContract.mint(to, totalAmount, {
          value: totalMintPrice,
        });
      }
    } catch (error) {
      throw this.formatTransactionError(error);
    }
  }

  /**
   * Set approval for exchange
   */
  async setApprovalForAll(
    collection: string,
    operator: string,
    approved: boolean,
    tokenType: NFTType
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const collectionContract = this.getCollectionContract(
      collection,
      tokenType
    );

    return await collectionContract.setApprovalForAll(operator, approved);
  }

  /**
   * Check if operator is approved
   */
  async isApprovedForAll(
    collection: string,
    owner: string,
    operator: string,
    tokenType: NFTType
  ): Promise<boolean> {
    try {
      const collectionContract = this.getCollectionContract(
        collection,
        tokenType
      );

      return await collectionContract.isApprovedForAll(owner, operator);
    } catch (error) {
      return false;
    }
  }

  /**
   * Update mint stage for a collection (owner only)
   * This function progresses the mint stage from not_started -> allowlist -> public
   */
  async updateMintStage(
    collectionAddress: string,
    tokenType: NFTType
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not available - connect wallet first");
    }

    const collection = this.getCollectionContract(collectionAddress, tokenType);

    return await collection.updateMintStage();
  }

  /**
   * Get mint information for a collection
   */
  async getMintInfo(
    collectionAddress: string,
    userAddress: string,
    tokenType: NFTType
  ): Promise<MintInfo> {
    try {
      const collection = this.getCollectionContract(
        collectionAddress,
        tokenType
      );

      const mintInfo = await collection.getMintInfo(userAddress);

      const mintPriceWei = mintInfo.currentMintPrice || mintInfo[4] || "0";
      const currentMintPrice = mintPriceWei.toString();
      const isAllowlisted =
        mintInfo.accountInAllowlist || mintInfo[11] || false;
      const mintedPerWallet = (
        mintInfo.mintedPerWallet ||
        mintInfo[9] ||
        "0"
      ).toString();
      const mintLimitPerWallet = (
        mintInfo.mintLimitPerWallet ||
        mintInfo[10] ||
        "0"
      ).toString();
      const totalMinted = (
        mintInfo.totalMinted ||
        mintInfo[7] ||
        "0"
      ).toString();
      const maxSupply = (mintInfo.maxSupply || mintInfo[8] || "0").toString();

      let mintStage: MintStage = "not_started";
      const currentStageEnum = mintInfo.currentStage || mintInfo[3];

      if (currentStageEnum !== undefined) {
        const stageNum = Number(currentStageEnum);
        if (stageNum === 0) {
          mintStage = "not_started";
        } else if (stageNum === 1) {
          mintStage = "allowlist";
        } else if (stageNum === 2) {
          mintStage = "public";
        }
      }

      const hasSupplyLeft = parseInt(totalMinted) < parseInt(maxSupply);
      const underWalletLimit =
        parseInt(mintedPerWallet) < parseInt(mintLimitPerWallet);
      const stageAllowsMinting =
        (mintStage === "allowlist" && isAllowlisted) || mintStage === "public";
      const canMint = hasSupplyLeft && underWalletLimit && stageAllowsMinting;

      return {
        currentMintPrice,
        isAllowlisted,
        mintedPerWallet,
        mintLimitPerWallet,
        totalMinted,
        maxSupply,
        canMint,
        mintStage,
      };
    } catch (error) {
      return {
        currentMintPrice: "0",
        isAllowlisted: false,
        mintedPerWallet: "0",
        mintLimitPerWallet: "0",
        totalMinted: "0",
        maxSupply: "0",
        canMint: false,
        mintStage: "unknown",
      };
    }
  }

  /**
   * Detect the token type of a collection by checking ERC165 interface support
   */
  async detectTokenType(address: string): Promise<NFTType> {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    // Create a minimal contract instance for interface checking
    const contract = new ethers.Contract(
      address,
      ["function supportsInterface(bytes4) view returns (bool)"],
      this.provider
    );

    // Check both interfaces in parallel
    const [isERC1155, isERC721] = await Promise.all([
      supportsInterface(contract, INTERFACE_IDS.ERC1155),
      supportsInterface(contract, INTERFACE_IDS.ERC721),
    ]);

    if (isERC1155) return "ERC1155";
    if (isERC721) return "ERC721";

    throw new Error(
      `Contract at ${address} does not support ERC721 or ERC1155 interface`
    );
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(
    address: string,
    tokenType: NFTType
  ): Promise<CollectionInfo> {
    const collection = this.getCollectionContract(address, tokenType);

    // Define method configurations with their fallback values and transformations
    const methodConfigs = {
      name: { fallback: "Unknown Collection" },
      symbol: { fallback: "UNKNOWN" },
      description: { fallback: "" },
      totalSupply: {
        fallback: "0",
        transform: (v: bigint) => v.toString(),
      },
      maxSupply: {
        fallback: "0",
        transform: (v: bigint) => v.toString(),
      },
      mintPrice: {
        fallback: "0",
        transform: (v: bigint) => ethers.formatEther(v),
      },
      royaltyFee: {
        fallback: "0",
        transform: (v: bigint) => v.toString(),
      },
    };

    // Fetch all basic properties in parallel
    // Try both standard and custom method names for better compatibility
    const [
      name,
      symbol,
      description,
      totalSupply,
      maxSupply,
      mintPrice,
      royaltyFee,
    ] = await Promise.all([
      safeContractCall(collection, "name", methodConfigs.name.fallback),
      safeContractCall(collection, "symbol", methodConfigs.symbol.fallback),
      safeContractCall(
        collection,
        "getDescription",
        methodConfigs.description.fallback
      ),
      // Try getTotalMinted() first (custom), then totalSupply() (standard)
      safeContractCall(
        collection,
        "getTotalMinted",
        methodConfigs.totalSupply.fallback,
        methodConfigs.totalSupply.transform
      ).catch(() =>
        safeContractCall(
          collection,
          "totalSupply",
          methodConfigs.totalSupply.fallback,
          methodConfigs.totalSupply.transform
        )
      ),
      // Try getMaxSupply() first (custom), then maxSupply() (standard)
      safeContractCall(
        collection,
        "getMaxSupply",
        methodConfigs.maxSupply.fallback,
        methodConfigs.maxSupply.transform
      ).catch(() =>
        safeContractCall(
          collection,
          "maxSupply",
          methodConfigs.maxSupply.fallback,
          methodConfigs.maxSupply.transform
        )
      ),
      // Try getMintPrice() first (custom), then mintPrice() (standard)
      safeContractCall(
        collection,
        "getMintPrice",
        methodConfigs.mintPrice.fallback,
        methodConfigs.mintPrice.transform
      ).catch(() =>
        safeContractCall(
          collection,
          "mintPrice",
          methodConfigs.mintPrice.fallback,
          methodConfigs.mintPrice.transform
        )
      ),
      safeContractCall(
        collection,
        "getRoyaltyFee",
        methodConfigs.royaltyFee.fallback,
        methodConfigs.royaltyFee.transform
      ),
    ]);

    // Handle baseURI with multiple fallback strategies
    const baseURI = await this.getBaseURI(collection);

    return {
      address,
      name,
      symbol,
      description,
      totalSupply,
      tokenType,
      maxSupply,
      mintPrice,
      royaltyFee,
      baseURI,
    };
  }

  /**
   * Get base URI with multiple fallback strategies
   */
  private async getBaseURI(collection: ethers.Contract): Promise<string> {
    // Strategy 1: Try baseTokenURI method
    const baseTokenURI = await safeContractCall(
      collection,
      "baseTokenURI",
      null
    );
    if (baseTokenURI) return baseTokenURI;

    // Strategy 2: Try tokenURI with token ID 1
    try {
      if (typeof collection.tokenURI === "function") {
        const uri = await collection.tokenURI(1);
        // Extract base URI by removing token ID suffix
        return uri.replace(/\/?\d+\/?$/, "/");
      }
    } catch {}

    // Strategy 3: Try uri method (ERC1155 standard)
    try {
      if (typeof collection.uri === "function") {
        const uri = await collection.uri(1);
        return uri.replace(/\{id\}/, "");
      }
    } catch {}

    return "";
  }

  /**
   * Get token owner (ERC721 only)
   */
  async getTokenOwner(collection: string, tokenId: string): Promise<string> {
    const collectionContract = this.getCollectionContract(collection, "ERC721");

    return await collectionContract.ownerOf(tokenId);
  }

  /**
   * Get token balance (ERC1155 only)
   */
  async getTokenBalance(
    collection: string,
    owner: string,
    tokenId: string
  ): Promise<string> {
    const collectionContract = this.getCollectionContract(
      collection,
      "ERC1155"
    );

    const balance = await collectionContract.balanceOf(owner, tokenId);
    return balance.toString();
  }

  /**
   * Verify collection using Hub
   */
  async verifyCollection(collection: string): Promise<CollectionVerification> {
    return await marketplaceHubService.verifyCollection(collection);
  }

  /**
   * Format transaction error for user-friendly messages
   */
  private formatTransactionError(error: unknown): Error {
    // Type guard for error object
    const err = error as {
      code?: string | number;
      message?: string;
      reason?: string;
      data?: string;
      error?: { message?: string };
    };
    if (err.code === "ACTION_REJECTED" || err.code === 4001) {
      return new Error("Transaction was rejected by user");
    }

    if (err.code === "INSUFFICIENT_FUNDS" || err.code === -32000) {
      return new Error("Insufficient funds to complete transaction");
    }

    if (err.code === "NETWORK_ERROR") {
      return new Error("Network error - please check your connection");
    }

    if (err.code === "TIMEOUT") {
      return new Error("Transaction timed out - please try again");
    }

    if (err.message?.includes("gas required exceeds allowance")) {
      return new Error("Gas estimation failed - transaction may fail");
    }

    if (err.message?.includes("execution reverted")) {
      const revertReason = err.message
        .split("execution reverted: ")[1]
        ?.split('"')[0];

      if (err.data) {
        const errorData = err.data;
        if (
          errorData === "0xf501eed5" ||
          revertReason?.includes("MintingNotStarted")
        ) {
          return new Error(
            "Minting has not started yet. Please wait for the mint to begin."
          );
        }
        if (
          errorData === "0x5a8a1c5c" ||
          revertReason?.includes("MintingNotActive")
        ) {
          return new Error("Minting is not currently active");
        }
        if (revertReason?.includes("MintLimitExceeded")) {
          return new Error("You have exceeded the mint limit per wallet");
        }
        if (revertReason?.includes("InsufficientPayment")) {
          return new Error("Incorrect ETH amount sent for minting");
        }
        if (revertReason?.includes("NotInAllowlist")) {
          return new Error("Your address is not in the allowlist");
        }
      }

      if (revertReason?.includes("Mint not started")) {
        return new Error("Minting has not started yet");
      }
      if (revertReason?.includes("Exceeded mint limit")) {
        return new Error("You have exceeded the mint limit per wallet");
      }
      if (revertReason?.includes("Max supply reached")) {
        return new Error("Collection has reached maximum supply");
      }
      if (revertReason?.includes("Incorrect payment")) {
        return new Error("Incorrect ETH amount sent for minting");
      }
      if (revertReason?.includes("Not in allowlist")) {
        return new Error("Your address is not in the allowlist");
      }
      if (revertReason?.includes("Allowlist stage ended")) {
        return new Error("The allowlist minting stage has ended");
      }

      return new Error(revertReason || "Transaction failed");
    }

    if (err.error?.message) {
      return new Error(err.error.message);
    }

    return new Error(err.message || "Transaction failed");
  }
}

export const collectionService = new CollectionService();
