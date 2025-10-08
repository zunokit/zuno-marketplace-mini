/**
 * Create an ERC1155 NFT Collection
 * Usage: node scripts/collections/create-erc1155.js
 */

const { ethers } = require("ethers");
const {
  getProviderAndSigner,
  getContractAddresses,
  formatCollectionParams,
  waitForTransaction,
  FACTORY_ERC1155_ABI,
  ERC1155_ABI
} = require("../utils/config");

async function createERC1155Collection(customParams = {}) {
  try {
    // Connect to network
    const { provider, signer, account, config } = await getProviderAndSigner();
    
    // Get contract addresses
    console.log("\n🔍 Getting contract addresses from hub...");
    const addresses = await getContractAddresses(signer, config.hubAddress);
    console.log("📍 ERC1155 Factory:", addresses.erc1155Factory);
    
    // Connect to factory
    const factory = new ethers.Contract(addresses.erc1155Factory, FACTORY_ERC1155_ABI, signer);
    
    // Prepare collection parameters
    const collectionParams = formatCollectionParams({
      name: "Zuno ERC1155 Collection",
      symbol: "ZUNO1155",
      description: "A test ERC1155 multi-token collection",
      mintPrice: "0.005",
      royaltyFee: 750, // 7.5%
      maxSupply: 100000, // Higher for multi-token
      mintLimitPerWallet: 1000,
      tokenURI: "https://api.example.com/erc1155/metadata/{id}.json",
      ...customParams
    }, account);
    
    console.log("\n📝 Creating ERC1155 Collection:");
    console.log("   Name:", collectionParams.name);
    console.log("   Symbol:", collectionParams.symbol);
    console.log("   Owner:", collectionParams.owner);
    console.log("   Description:", collectionParams.description);
    console.log("   Mint Price:", ethers.formatEther(collectionParams.mintPrice), "ETH");
    console.log("   Royalty:", collectionParams.royaltyFee / 100, "%");
    console.log("   Max Supply:", collectionParams.maxSupply);
    
    // Create the collection
    const tx = await factory.createERC1155Collection(collectionParams);
    const receipt = await waitForTransaction(tx, "Create ERC1155 Collection");
    
    // Get collection address from event
    let collectionAddress = null;
    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed?.name === "ERC1155CollectionCreated") {
          collectionAddress = parsed.args[0]; // First argument is collection address
          break;
        }
      } catch {
        // Not our event
      }
    }
    
    if (!collectionAddress) {
      throw new Error("Could not find collection address in transaction logs");
    }
    
    console.log("\n🎉 ERC1155 Collection created successfully!");
    console.log("📍 Collection Address:", collectionAddress);
    
    // Verify the collection
    console.log("\n🔍 Verifying collection...");
    const collection = new ethers.Contract(collectionAddress, ERC1155_ABI, provider);
    
    try {
      const name = await collection.name();
      const symbol = await collection.symbol();
      const owner = await collection.owner();
      const uri = await collection.uri(1);
      
      console.log("   Name:", name || "⚠️ Empty");
      console.log("   Symbol:", symbol || "⚠️ Empty");
      console.log("   Owner:", owner);
      console.log("   Base URI:", uri);
      
      if (!name || !symbol) {
        console.warn("\n⚠️ Warning: Collection name or symbol is empty!");
        console.warn("This might be a bug in the smart contract initialization.");
      }
    } catch (error) {
      console.error("❌ Error verifying collection:", error.message);
    }
    
    return collectionAddress;
    
  } catch (error) {
    console.error("\n❌ Error creating ERC1155 collection:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createERC1155Collection()
    .then((address) => {
      console.log("\n✨ Script completed successfully!");
      console.log("Collection deployed at:", address);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { createERC1155Collection };
