/**
 * Mint NFTs on an ERC1155 Collection
 * Usage: node scripts/nfts/mint-erc1155.js [collectionAddress] [tokenId] [amount]
 */

const { ethers } = require("ethers");
const {
  getProviderAndSigner,
  waitForTransaction,
  ERC1155_ABI
} = require("../utils/config");

// Extended ABI for minting functions
const MINT_ABI = [
  ...ERC1155_ABI,
  "function mint(address to, uint256 id, uint256 amount) external payable",
  "function publicMint(uint256 id, uint256 amount) external payable",
  "function getMintPrice() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function totalSupply(uint256 id) view returns (uint256)",
  "function exists(uint256 id) view returns (bool)"
];

async function mintERC1155(collectionAddress, tokenId = 1, amount = 1, recipientAddress = null) {
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
    let name, symbol, uri, mintPrice;
    try {
      name = await collection.name();
      symbol = await collection.symbol();
      console.log("   Name:", name || "N/A");
      console.log("   Symbol:", symbol || "N/A");
    } catch (e) {
      console.log("   Name/Symbol: Unable to fetch");
    }
    
    try {
      uri = await collection.uri(tokenId);
      console.log("   Token URI:", uri || "N/A");
    } catch (e) {
      console.log("   Token URI: Unable to fetch");
    }
    
    // Check if token exists
    try {
      const exists = await collection.exists(tokenId);
      if (!exists) {
        console.log(`   ⚠️ Token ID ${tokenId} doesn't exist yet (will be created)`);
      }
    } catch (e) {
      // Method might not exist
    }
    
    // Try to get current supply for this token ID
    try {
      const supply = await collection.totalSupply(tokenId);
      console.log(`   Current Supply (Token #${tokenId}):`, supply.toString());
    } catch (e) {
      // Method might not exist
    }
    
    // Try to get mint price
    try {
      mintPrice = await collection.getMintPrice();
    } catch (e1) {
      try {
        mintPrice = await collection.mintPrice();
      } catch (e2) {
        mintPrice = ethers.parseEther("0.005"); // Default for ERC1155
        console.log("   Mint Price: Using default 0.005 ETH");
      }
    }
    
    if (mintPrice) {
      console.log("   Mint Price (per token):", ethers.formatEther(mintPrice), "ETH");
    }
    
    const totalCost = mintPrice * BigInt(amount);
    console.log(`   Total Cost for ${amount} token(s):`, ethers.formatEther(totalCost), "ETH");
    
    console.log("\n🎯 Minting Parameters:");
    console.log("   Recipient:", recipient);
    console.log("   Token ID:", tokenId);
    console.log("   Amount:", amount);
    
    // Try different mint methods
    let tx;
    let success = false;
    
    // Method 1: Try publicMint
    if (!success) {
      try {
        console.log("\n🔄 Attempting publicMint(id, amount)...");
        tx = await collection.publicMint(tokenId, amount, { value: totalCost });
        success = true;
      } catch (e) {
        console.log("   publicMint not available");
      }
    }
    
    // Method 2: Try mint with value
    if (!success) {
      try {
        console.log("\n🔄 Attempting mint(to, id, amount) with payment...");
        tx = await collection.mint(recipient, tokenId, amount, { value: totalCost });
        success = true;
      } catch (e) {
        console.log("   Paid mint not available");
      }
    }
    
    // Method 3: Try mint without value (might be owner only)
    if (!success) {
      try {
        console.log("\n🔄 Attempting mint(to, id, amount) without payment...");
        tx = await collection.mint(recipient, tokenId, amount);
        success = true;
      } catch (e) {
        console.log("   Free mint not available");
        throw new Error("No compatible mint function found on this collection");
      }
    }
    
    if (success && tx) {
      const receipt = await waitForTransaction(tx, "Mint ERC1155 Token");
      
      console.log("\n✅ Token(s) minted successfully!");
      console.log(`   Minted ${amount} of Token ID ${tokenId}`);
      
      // Try to parse TransferSingle event
      try {
        const transferEvents = receipt.logs.filter(log => {
          try {
            const parsed = collection.interface.parseLog(log);
            return parsed?.name === "TransferSingle" || parsed?.name === "TransferBatch";
          } catch {
            return false;
          }
        });
        
        if (transferEvents.length > 0) {
          console.log("\n📦 Transfer Events:");
          transferEvents.forEach(event => {
            const parsed = collection.interface.parseLog(event);
            if (parsed.name === "TransferSingle") {
              console.log(`   Token #${parsed.args[3]}: ${parsed.args[4]} units`);
            }
          });
        }
      } catch (e) {
        // Event parsing failed
      }
      
      // Check new balance
      try {
        const balance = await collection.balanceOf(recipient, tokenId);
        console.log(`\n📊 New Balance: ${balance} units of Token #${tokenId}`);
      } catch (e) {
        // Balance check failed
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error minting ERC1155 token:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const collectionAddress = args[0];
  const tokenId = parseInt(args[1]) || 1;
  const amount = parseInt(args[2]) || 1;
  const recipient = args[3];
  
  if (!collectionAddress) {
    console.error("Usage: node mint-erc1155.js <collectionAddress> [tokenId] [amount] [recipient]");
    console.error("Example: node mint-erc1155.js 0x123... 1 100");
    process.exit(1);
  }
  
  mintERC1155(collectionAddress, tokenId, amount, recipient)
    .then(() => {
      console.log("\n✨ Minting completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Minting failed:", error);
      process.exit(1);
    });
}

module.exports = { mintERC1155 };
