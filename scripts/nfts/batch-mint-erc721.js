/**
 * Batch mint multiple NFTs on an ERC721 Collection
 * Usage: node scripts/nfts/batch-mint-erc721.js [collectionAddress] [quantity]
 */

const { ethers } = require("ethers");
const {
  getProviderAndSigner,
  waitForTransaction,
  ERC721_ABI
} = require("../utils/config");

// Extended ABI for batch minting
const BATCH_MINT_ABI = [
  ...ERC721_ABI,
  "function mintBatch(address to, uint256 quantity) external payable",
  "function batchMint(address[] recipients, uint256[] quantities) external payable",
  "function mintMultiple(address to, uint256 quantity) external payable returns (uint256[] memory)",
  "function getMintPrice() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)"
];

async function batchMintERC721(collectionAddress, quantity = 10, recipients = null) {
  try {
    // Validate inputs
    if (!collectionAddress || !ethers.isAddress(collectionAddress)) {
      throw new Error("Invalid collection address");
    }

    // Connect to network
    const { provider, signer, account } = await getProviderAndSigner();
    
    // Connect to collection
    const collection = new ethers.Contract(collectionAddress, BATCH_MINT_ABI, signer);
    
    console.log("\n📝 Collection Information:");
    console.log("   Address:", collectionAddress);
    
    // Get collection info
    let name, symbol, totalSupply, maxSupply, mintPrice;
    try {
      name = await collection.name();
      symbol = await collection.symbol();
      console.log("   Name:", name || "N/A");
      console.log("   Symbol:", symbol || "N/A");
    } catch (e) {
      console.log("   Name/Symbol: Unable to fetch");
    }
    
    try {
      totalSupply = await collection.totalSupply();
      console.log("   Current Supply:", totalSupply.toString());
    } catch (e) {
      console.log("   Current Supply: Unable to fetch");
    }
    
    try {
      maxSupply = await collection.maxSupply();
      console.log("   Max Supply:", maxSupply.toString());
      
      // Check if we have enough supply
      if (totalSupply && maxSupply) {
        const remaining = maxSupply - totalSupply;
        if (remaining < quantity) {
          console.warn(`   ⚠️ Warning: Only ${remaining} NFTs remaining!`);
          if (remaining <= 0) {
            throw new Error("Collection is fully minted");
          }
          quantity = Number(remaining);
          console.log(`   Adjusting quantity to ${quantity}`);
        }
      }
    } catch (e) {
      if (e.message !== "Collection is fully minted") {
        console.log("   Max Supply: Unable to fetch");
      } else {
        throw e;
      }
    }
    
    // Try to get mint price
    try {
      mintPrice = await collection.getMintPrice();
    } catch (e1) {
      try {
        mintPrice = await collection.mintPrice();
      } catch (e2) {
        mintPrice = ethers.parseEther("0.01"); // Default
        console.log("   Mint Price: Using default 0.01 ETH");
      }
    }
    
    if (mintPrice) {
      console.log("   Mint Price (per NFT):", ethers.formatEther(mintPrice), "ETH");
    }
    
    const totalCost = mintPrice * BigInt(quantity);
    console.log(`   Total Cost for ${quantity} NFTs:`, ethers.formatEther(totalCost), "ETH");
    
    // Prepare recipients
    let recipientList;
    if (recipients && Array.isArray(recipients)) {
      recipientList = recipients;
    } else if (recipients) {
      recipientList = [recipients];
    } else {
      recipientList = [account];
    }
    
    console.log("\n🎯 Batch Minting Parameters:");
    console.log("   Total Quantity:", quantity);
    console.log("   Recipients:", recipientList.length === 1 ? recipientList[0] : `${recipientList.length} addresses`);
    
    // Try different batch mint methods
    let tx;
    let success = false;
    
    // Method 1: Try mintBatch (single recipient, multiple tokens)
    if (!success && recipientList.length === 1) {
      try {
        console.log("\n🔄 Attempting mintBatch(to, quantity)...");
        tx = await collection.mintBatch(recipientList[0], quantity, { value: totalCost });
        success = true;
      } catch (e) {
        console.log("   mintBatch not available");
      }
    }
    
    // Method 2: Try mintMultiple
    if (!success && recipientList.length === 1) {
      try {
        console.log("\n🔄 Attempting mintMultiple(to, quantity)...");
        tx = await collection.mintMultiple(recipientList[0], quantity, { value: totalCost });
        success = true;
      } catch (e) {
        console.log("   mintMultiple not available");
      }
    }
    
    // Method 3: Try batchMint (multiple recipients)
    if (!success && recipientList.length > 1) {
      try {
        console.log("\n🔄 Attempting batchMint(recipients[], quantities[])...");
        const quantities = new Array(recipientList.length).fill(Math.floor(quantity / recipientList.length));
        tx = await collection.batchMint(recipientList, quantities, { value: totalCost });
        success = true;
      } catch (e) {
        console.log("   batchMint not available");
      }
    }
    
    // Method 4: Fall back to sequential minting
    if (!success) {
      console.log("\n⚠️ No batch mint function available, falling back to sequential minting...");
      console.log("This will require multiple transactions and may take longer.\n");
      
      const recipient = recipientList[0];
      let minted = 0;
      const batchSize = 5; // Mint 5 at a time to avoid too many transactions
      
      while (minted < quantity) {
        const remaining = quantity - minted;
        const currentBatch = Math.min(batchSize, remaining);
        
        console.log(`\n📦 Batch ${Math.floor(minted / batchSize) + 1}:`);
        for (let i = 0; i < currentBatch; i++) {
          try {
            // Try different single mint methods
            let singleTx;
            try {
              singleTx = await collection.mint(recipient, { value: mintPrice });
            } catch (e) {
              try {
                singleTx = await collection.publicMint(1, { value: mintPrice });
              } catch (e2) {
                singleTx = await collection.safeMint(recipient);
              }
            }
            
            console.log(`   Minting NFT ${minted + i + 1}/${quantity}...`);
            const receipt = await singleTx.wait();
            console.log(`   ✓ NFT ${minted + i + 1} minted in block ${receipt.blockNumber}`);
          } catch (error) {
            console.error(`   ✗ Failed to mint NFT ${minted + i + 1}:`, error.message);
            throw error;
          }
        }
        minted += currentBatch;
      }
      
      console.log(`\n✅ Successfully minted ${quantity} NFTs sequentially!`);
      return;
    }
    
    if (success && tx) {
      const receipt = await waitForTransaction(tx, `Batch Mint ${quantity} NFTs`);
      
      console.log(`\n✅ Batch minted ${quantity} NFTs successfully!`);
      
      // Try to get token IDs from events
      try {
        const transferEvents = receipt.logs.filter(log => {
          try {
            const parsed = collection.interface.parseLog(log);
            return parsed?.name === "Transfer";
          } catch {
            return false;
          }
        });
        
        if (transferEvents.length > 0) {
          console.log(`\n📦 Minted ${transferEvents.length} Token IDs:`);
          const tokenIds = [];
          transferEvents.forEach(event => {
            const parsed = collection.interface.parseLog(event);
            tokenIds.push(parsed.args[2].toString());
          });
          console.log("   Token IDs:", tokenIds.join(", "));
        }
      } catch (e) {
        // Event parsing failed
      }
      
      // Check new balance
      try {
        const balance = await collection.balanceOf(recipientList[0]);
        console.log(`\n📊 New Balance: ${balance} NFTs`);
      } catch (e) {
        // Balance check failed
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error batch minting NFTs:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const collectionAddress = args[0];
  const quantity = parseInt(args[1]) || 10;
  const recipients = args.slice(2); // Can pass multiple recipients
  
  if (!collectionAddress) {
    console.error("Usage: node batch-mint-erc721.js <collectionAddress> [quantity] [recipient1] [recipient2] ...");
    console.error("Example: node batch-mint-erc721.js 0x123... 20");
    console.error("Example: node batch-mint-erc721.js 0x123... 10 0xAAA... 0xBBB...");
    process.exit(1);
  }
  
  batchMintERC721(collectionAddress, quantity, recipients.length > 0 ? recipients : null)
    .then(() => {
      console.log("\n✨ Batch minting completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Batch minting failed:", error);
      process.exit(1);
    });
}

module.exports = { batchMintERC721 };
