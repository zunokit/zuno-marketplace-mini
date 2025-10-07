/**
 * Mint NFTs on an ERC721 Collection
 * Usage: node scripts/nfts/mint-erc721.js [collectionAddress] [quantity]
 */

const { ethers } = require("ethers");
const {
  getProviderAndSigner,
  waitForTransaction,
  ERC721_ABI
} = require("../utils/config");

// Extended ABI for minting functions
const MINT_ABI = [
  ...ERC721_ABI,
  "function mint(address to) external payable returns (uint256)",
  "function publicMint(uint256 quantity) external payable",
  "function mintTo(address to, uint256 quantity) external payable",
  "function safeMint(address to) external returns (uint256)",
  "function getMintPrice() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)"
];

async function mintERC721(collectionAddress, quantity = 1, recipientAddress = null) {
  try {
    // Validate inputs
    if (!collectionAddress || !ethers.isAddress(collectionAddress)) {
      throw new Error("Invalid collection address");
    }

    // Connect to network
    const { provider, signer, account } = await getProviderAndSigner();
    const recipient = recipientAddress || account;
    
    // Connect to collection
    const collection = new ethers.Contract(collectionAddress, MINT_ABI, signer);
    
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
    } catch (e) {
      console.log("   Max Supply: Unable to fetch");
    }
    
    // Try to get mint price
    try {
      mintPrice = await collection.getMintPrice();
    } catch (e1) {
      try {
        mintPrice = await collection.mintPrice();
      } catch (e2) {
        mintPrice = ethers.parseEther("0.01"); // Default fallback
        console.log("   Mint Price: Using default 0.01 ETH");
      }
    }
    
    if (mintPrice) {
      console.log("   Mint Price:", ethers.formatEther(mintPrice), "ETH");
    }
    
    const totalCost = mintPrice * BigInt(quantity);
    console.log(`   Total Cost for ${quantity} NFT(s):`, ethers.formatEther(totalCost), "ETH");
    
    console.log("\n🎯 Minting Parameters:");
    console.log("   Recipient:", recipient);
    console.log("   Quantity:", quantity);
    
    // Try different mint methods
    let tx;
    let success = false;
    
    // Method 1: Try publicMint with quantity
    if (!success && quantity > 1) {
      try {
        console.log("\n🔄 Attempting publicMint(quantity)...");
        tx = await collection.publicMint(quantity, { value: totalCost });
        success = true;
      } catch (e) {
        console.log("   publicMint not available");
      }
    }
    
    // Method 2: Try mintTo
    if (!success) {
      try {
        console.log("\n🔄 Attempting mintTo(address, quantity)...");
        tx = await collection.mintTo(recipient, quantity, { value: totalCost });
        success = true;
      } catch (e) {
        console.log("   mintTo not available");
      }
    }
    
    // Method 3: Try simple mint
    if (!success) {
      try {
        console.log("\n🔄 Attempting mint(address)...");
        if (quantity > 1) {
          console.log("   Minting one by one...");
          for (let i = 0; i < quantity; i++) {
            tx = await collection.mint(recipient, { value: mintPrice });
            await waitForTransaction(tx, `Mint NFT ${i + 1}/${quantity}`);
          }
          console.log(`\n✅ Successfully minted ${quantity} NFTs!`);
          return;
        } else {
          tx = await collection.mint(recipient, { value: mintPrice });
          success = true;
        }
      } catch (e) {
        console.log("   mint not available");
      }
    }
    
    // Method 4: Try safeMint
    if (!success) {
      try {
        console.log("\n🔄 Attempting safeMint(address)...");
        if (quantity > 1) {
          console.log("   Minting one by one...");
          for (let i = 0; i < quantity; i++) {
            tx = await collection.safeMint(recipient);
            await waitForTransaction(tx, `Safe Mint NFT ${i + 1}/${quantity}`);
          }
          console.log(`\n✅ Successfully minted ${quantity} NFTs!`);
          return;
        } else {
          tx = await collection.safeMint(recipient);
          success = true;
        }
      } catch (e) {
        console.log("   safeMint not available");
        throw new Error("No compatible mint function found on this collection");
      }
    }
    
    if (success && tx) {
      const receipt = await waitForTransaction(tx, "Mint NFT");
      
      console.log("\n✅ NFT(s) minted successfully!");
      
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
          console.log("\n📦 Minted Token IDs:");
          transferEvents.forEach(event => {
            const parsed = collection.interface.parseLog(event);
            console.log(`   Token #${parsed.args[2]}`);
          });
        }
      } catch (e) {
        // Event parsing failed
      }
      
      // Check new balance
      try {
        const balance = await collection.balanceOf(recipient);
        console.log(`\n📊 New Balance: ${balance} NFTs`);
      } catch (e) {
        // Balance check failed
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error minting NFT:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const collectionAddress = args[0];
  const quantity = parseInt(args[1]) || 1;
  const recipient = args[2];
  
  if (!collectionAddress) {
    console.error("Usage: node mint-erc721.js <collectionAddress> [quantity] [recipient]");
    console.error("Example: node mint-erc721.js 0x123... 5");
    process.exit(1);
  }
  
  mintERC721(collectionAddress, quantity, recipient)
    .then(() => {
      console.log("\n✨ Minting completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Minting failed:", error);
      process.exit(1);
    });
}

module.exports = { mintERC721 };
