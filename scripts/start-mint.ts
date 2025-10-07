/**
 * Script to start minting for a collection
 * This updates the mint stage from not_started -> allowlist -> public
 * 
 * Usage: npx tsx scripts/start-mint.ts <collection-address> [stage]
 * 
 * Examples:
 * - Start allowlist mint: npx tsx scripts/start-mint.ts 0x123...
 * - Progress to next stage: npx tsx scripts/start-mint.ts 0x123...
 * - Skip to public mint: npx tsx scripts/start-mint.ts 0x123... 2
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { ERC721Collection_ABI } from "../src/lib/contracts/abis";

dotenv.config();

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const collectionAddress = args[0];
  const targetStage = args[1] ? parseInt(args[1]) : undefined;

  if (!collectionAddress) {
    console.error("❌ Please provide a collection address");
    console.log("Usage: npx tsx scripts/start-mint.ts <collection-address> [target-stage]");
    process.exit(1);
  }

  // Connect to network
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Get signer (use first account from local node or private key from env)
  let signer: ethers.Signer;
  if (process.env.PRIVATE_KEY) {
    signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  } else {
    // Use first account from local node
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      console.error("❌ No accounts available");
      process.exit(1);
    }
    signer = await provider.getSigner(0);
  }

  const signerAddress = await signer.getAddress();
  console.log("🔑 Using account:", signerAddress);

  // Connect to collection contract
  const collection = new ethers.Contract(
    collectionAddress,
    ERC721Collection_ABI,
    signer
  );

  try {
    // Get current collection info
    const [name, symbol, owner] = await Promise.all([
      collection.name(),
      collection.symbol(),
      collection.owner()
    ]);

    console.log("\n📋 Collection Info:");
    console.log("  Name:", name);
    console.log("  Symbol:", symbol);
    console.log("  Owner:", owner);
    console.log("  Address:", collectionAddress);

    // Check if signer is owner
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      console.error("\n❌ Error: Only the collection owner can update mint stage");
      console.log("  Current owner:", owner);
      console.log("  Your address:", signerAddress);
      process.exit(1);
    }

    // Get current mint info
    const mintInfo = await collection.getMintInfo(signerAddress);
    const currentStage = mintInfo.currentStage || mintInfo[3];
    
    let currentStageName = "unknown";
    if (currentStage == 0n) currentStageName = "not_started";
    else if (currentStage == 1n) currentStageName = "allowlist";
    else if (currentStage == 2n) currentStageName = "public";

    console.log("\n🎯 Current mint stage:", currentStageName, `(${currentStage})`);
    console.log("  Total minted:", mintInfo.totalMinted?.toString() || mintInfo[7]?.toString());
    console.log("  Max supply:", mintInfo.maxSupply?.toString() || mintInfo[8]?.toString());
    console.log("  Mint price:", ethers.formatEther(mintInfo.currentMintPrice || mintInfo[4] || "0"), "ETH");

    // Check if we need to update
    if (currentStage == 2n) {
      console.log("\n✅ Minting is already in public stage!");
      process.exit(0);
    }

    // Calculate how many times to call updateMintStage
    let updatesNeeded = 0;
    if (targetStage !== undefined) {
      updatesNeeded = targetStage - Number(currentStage);
      if (updatesNeeded <= 0) {
        console.log("\n✅ Already at or past target stage");
        process.exit(0);
      }
    } else {
      // Default: progress to next stage
      updatesNeeded = 1;
    }

    console.log(`\n🚀 Updating mint stage ${updatesNeeded} time(s)...`);

    for (let i = 0; i < updatesNeeded; i++) {
      console.log(`\n📝 Update ${i + 1}/${updatesNeeded}:`);
      
      const tx = await collection.updateMintStage();
      console.log("  Transaction hash:", tx.hash);
      console.log("  Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("  ✅ Confirmed in block:", receipt.blockNumber);

      // Get updated stage
      const updatedMintInfo = await collection.getMintInfo(signerAddress);
      const newStage = updatedMintInfo.currentStage || updatedMintInfo[3];
      
      let newStageName = "unknown";
      if (newStage == 0n) newStageName = "not_started";
      else if (newStage == 1n) newStageName = "allowlist";
      else if (newStage == 2n) newStageName = "public";
      
      console.log("  New stage:", newStageName, `(${newStage})`);
    }

    // Final status
    const finalMintInfo = await collection.getMintInfo(signerAddress);
    const finalStage = finalMintInfo.currentStage || finalMintInfo[3];
    
    let finalStageName = "unknown";
    if (finalStage == 0n) finalStageName = "not_started";
    else if (finalStage == 1n) finalStageName = "allowlist";
    else if (finalStage == 2n) finalStageName = "public";

    console.log("\n✅ Mint stage updated successfully!");
    console.log("  Final stage:", finalStageName, `(${finalStage})`);
    console.log("\n🎉 Users can now mint from this collection!");

  } catch (error: any) {
    console.error("\n❌ Error updating mint stage:");
    if (error.reason) {
      console.error("  Reason:", error.reason);
    }
    if (error.data) {
      console.error("  Error data:", error.data);
    }
    console.error("  Details:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
