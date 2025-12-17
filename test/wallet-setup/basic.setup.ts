/**
 * Basic MetaMask Wallet Setup for Synpress
 * Creates a cached wallet state for E2E tests
 */

import { defineWalletSetup, getExtensionId } from '@synthetixio/synpress'
import { MetaMask } from '@synthetixio/synpress/playwright'

// Anvil default test account seed phrase (for local testing only!)
const SEED_PHRASE = 'test test test test test test test test test test test junk'
const PASSWORD = 'Tester@1234'

// Anvil local network configuration
const ANVIL_NETWORK = {
  name: 'Anvil Local',
  rpcUrl: 'http://127.0.0.1:8545',
  chainId: 31337,
  symbol: 'ETH',
}

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  // Get extension ID for popup detection
  const extensionId = await getExtensionId(context, 'MetaMask')

  // Create MetaMask instance
  const metamask = new MetaMask(context, walletPage, PASSWORD, extensionId)

  // Import wallet using seed phrase
  await metamask.importWallet(SEED_PHRASE)

  // Add Anvil local network
  await metamask.addNetwork(ANVIL_NETWORK)

  // Switch to Anvil network
  await metamask.switchNetwork(ANVIL_NETWORK.name)
})

// Export constants for use in tests
export { SEED_PHRASE, PASSWORD, ANVIL_NETWORK }
