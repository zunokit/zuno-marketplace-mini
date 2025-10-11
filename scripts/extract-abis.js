/**
 * Extract ABIs from Foundry contract artifacts
 * Copies ABI files from zuno-marketplace-contracts to frontend
 */

const fs = require('fs');
const path = require('path');

const CONTRACTS_DIR = path.join(__dirname, '../../zuno-marketplace-contracts/out');
const OUTPUT_DIR = path.join(__dirname, '../src/lib/contracts/abis');

// Contract artifacts to extract
const CONTRACTS_TO_EXTRACT = [
  // Core contracts
  { name: 'MarketplaceHub', path: 'MarketplaceHub.sol/MarketplaceHub.json' },

  // Exchange contracts
  { name: 'ERC721NFTExchange', path: 'ERC721NFTExchange.sol/ERC721NFTExchange.json' },
  { name: 'ERC1155NFTExchange', path: 'ERC1155NFTExchange.sol/ERC1155NFTExchange.json' },

  // Auction contracts
  { name: 'EnglishAuction', path: 'EnglishAuction.sol/EnglishAuction.json' },
  { name: 'DutchAuction', path: 'DutchAuction.sol/DutchAuction.json' },

  // Feature contracts
  { name: 'BundleManager', path: 'BundleManager.sol/BundleManager.json' },
  { name: 'OfferManager', path: 'OfferManager.sol/OfferManager.json' },

  // Collection contracts
  { name: 'ERC721Collection', path: 'ERC721Collection.sol/ERC721Collection.json' },
  { name: 'ERC1155Collection', path: 'ERC1155Collection.sol/ERC1155Collection.json' },
  { name: 'ERC721CollectionFactory', path: 'ERC721CollectionFactory.sol/ERC721CollectionFactory.json' },
  { name: 'ERC1155CollectionFactory', path: 'ERC1155CollectionFactory.sol/ERC1155CollectionFactory.json' },

  // Registry contracts
  { name: 'ExchangeRegistry', path: 'ExchangeRegistry.sol/ExchangeRegistry.json' },
  { name: 'CollectionRegistry', path: 'CollectionRegistry.sol/CollectionRegistry.json' },
  { name: 'AuctionRegistry', path: 'AuctionRegistry.sol/AuctionRegistry.json' },
  { name: 'FeeRegistry', path: 'FeeRegistry.sol/FeeRegistry.json' },

  // Fee & Royalty Management
  { name: 'AdvancedFeeManager', path: 'AdvancedFeeManager.sol/AdvancedFeeManager.json' },
  { name: 'AdvancedRoyaltyManager', path: 'AdvancedRoyaltyManager.sol/AdvancedRoyaltyManager.json' },

  // Access Control & Security
  { name: 'MarketplaceAccessControl', path: 'MarketplaceAccessControl.sol/MarketplaceAccessControl.json' },
  { name: 'EmergencyManager', path: 'EmergencyManager.sol/EmergencyManager.json' },
  { name: 'MarketplaceTimelock', path: 'MarketplaceTimelock.sol/MarketplaceTimelock.json' },

  // Validation & Analytics
  { name: 'ListingValidator', path: 'ListingValidator.sol/ListingValidator.json' },
  { name: 'ListingHistoryTracker', path: 'ListingHistoryTracker.sol/ListingHistoryTracker.json' },
  { name: 'CollectionVerifier', path: 'CollectionVerifier.sol/CollectionVerifier.json' },
];

async function extractABIs() {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('🔍 Extracting ABIs from contracts...\n');

    const extractedABIs = [];

    for (const contract of CONTRACTS_TO_EXTRACT) {
      const artifactPath = path.join(CONTRACTS_DIR, contract.path);

      if (!fs.existsSync(artifactPath)) {
        console.log(`⚠️  Artifact not found: ${contract.name}`);
        continue;
      }

      // Read the artifact
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

      // Extract only the ABI
      const abi = artifact.abi;

      // Write ABI to separate file
      const outputPath = path.join(OUTPUT_DIR, `${contract.name}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));

      extractedABIs.push({
        name: contract.name,
        exportName: `${contract.name}_ABI`,
      });

      console.log(`✅ Extracted: ${contract.name}`);
    }

    // Generate index.ts that exports all ABIs
    const indexContent = `/**
 * Auto-generated ABI exports
 * Generated from contract artifacts
 */

${extractedABIs.map(({ name, exportName }) =>
  `import ${exportName} from './${name}.json';`
).join('\n')}

export {
${extractedABIs.map(({ exportName }) => `  ${exportName},`).join('\n')}
};

// Type-safe ABI access
export const ABIS = {
${extractedABIs.map(({ name, exportName }) => `  ${name}: ${exportName},`).join('\n')}
} as const;
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
    console.log('\n✅ Generated index.ts with all exports');

    console.log(`\n🎉 Successfully extracted ${extractedABIs.length} ABIs`);
  } catch (error) {
    console.error('❌ Error extracting ABIs:', error);
    process.exit(1);
  }
}

extractABIs();
