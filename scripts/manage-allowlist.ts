/**
 * Script to manage allowlist for a collection
 * 
 * Usage: 
 * - Add to allowlist: npx tsx scripts/manage-allowlist.ts <collection-address> add <address1> [address2...]
 * - Remove from allowlist: npx tsx scripts/manage-allowlist.ts <collection-address> remove <address1> [address2...]
 * - Check if in allowlist: npx tsx scripts/manage-allowlist.ts <collection-address> check <address>
 * 
 * Examples:
 * npx tsx scripts/manage-allowlist.ts 0x123... add 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
 * npx tsx scripts/manage-allowlist.ts 0x123... add 0xabc... 0xdef... 0xghi...
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { ERC721Collection_ABI } from "../src/lib/contracts/abis";

dotenv.config();

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const collectionAddress = args[0];
  const action = args[1]?.toLowerCase(); // add, remove, or check
  const addresses = args.slice(2);

  if (!collectionAddress || !action || addresses.length === 0) {
    console.error("❌ Invalid arguments");
    console.log("Usage:");
    console.log("  Add: npx tsx scripts/manage-allowlist.ts <collection> add <address1> [address2...]");
    console.log("  Remove: npx tsx scripts/manage-allowlist.ts <collection> remove <address1> [address2...]");
    console.log("  Check: npx tsx scripts/manage-allowlist.ts <collection> check <address>");
    process.exit(1);
  }

  if (!["add", "remove", "check"].includes(action)) {
    console.error("❌ Invalid action. Use 'add', 'remove', or 'check'");
    process.exit(1);
  }

  // Connect to network
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Get signer
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
    // Get collection info
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

    // Check action
    if (action === "check") {
      console.log("\n🔍 Checking allowlist status...");
      
      for (const address of addresses) {
        try {
          // Get mint info for the address
          const mintInfo = await collection.getMintInfo(address);
          const isAllowlisted = mintInfo.accountInAllowlist || mintInfo[11] || false;
          
          console.log(`  ${address}: ${isAllowlisted ? "✅ In allowlist" : "❌ Not in allowlist"}`);
        } catch (error) {
          console.log(`  ${address}: ❌ Error checking status`);
        }
      }
    } else {
      // Check if signer is owner for add/remove actions
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        console.error("\n❌ Error: Only the collection owner can manage the allowlist");
        console.log("  Current owner:", owner);
        console.log("  Your address:", signerAddress);
        process.exit(1);
      }

      if (action === "add") {
        console.log("\n➕ Adding addresses to allowlist...");
        console.log("  Addresses:", addresses);

        const tx = await collection.addToAllowlist(addresses);
        console.log("  Transaction hash:", tx.hash);
        console.log("  Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("  ✅ Confirmed in block:", receipt.blockNumber);

        // Verify they were added
        console.log("\n📋 Verification:");
        for (const address of addresses) {
          try {
            const mintInfo = await collection.getMintInfo(address);
            const isAllowlisted = mintInfo.accountInAllowlist || mintInfo[11] || false;
            console.log(`  ${address}: ${isAllowlisted ? "✅ Added successfully" : "⚠️ Not added (check transaction)"}`);
          } catch {
            console.log(`  ${address}: ⚠️ Could not verify`);
          }
        }

        console.log("\n✅ Addresses added to allowlist successfully!");
        
      } else if (action === "remove") {
        console.log("\n➖ Removing addresses from allowlist...");
        console.log("  Addresses:", addresses);

        const tx = await collection.removeFromAllowlist(addresses);
        console.log("  Transaction hash:", tx.hash);
        console.log("  Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("  ✅ Confirmed in block:", receipt.blockNumber);

        // Verify they were removed
        console.log("\n📋 Verification:");
        for (const address of addresses) {
          try {
            const mintInfo = await collection.getMintInfo(address);
            const isAllowlisted = mintInfo.accountInAllowlist || mintInfo[11] || false;
            console.log(`  ${address}: ${!isAllowlisted ? "✅ Removed successfully" : "⚠️ Still in allowlist (check transaction)"}`);
          } catch {
            console.log(`  ${address}: ⚠️ Could not verify`);
          }
        }

        console.log("\n✅ Addresses removed from allowlist successfully!");
      }
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.reason || error.message);
    if (error.data) {
      console.error("  Error data:", error.data);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
