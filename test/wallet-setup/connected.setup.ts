/**
 * Connected Wallet Setup for Synpress
 * Pre-connects wallet to dApp for faster tests
 */

import { defineWalletSetup, getExtensionId } from '@synthetixio/synpress'
import { MetaMask } from '@synthetixio/synpress/playwright'

const SEED_PHRASE = 'test test test test test test test test test test test junk'
const PASSWORD = 'Tester@1234'

const ANVIL_NETWORK = {
  name: 'Anvil Local',
  rpcUrl: 'http://127.0.0.1:8545',
  chainId: 31337,
  symbol: 'ETH',
}

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const extensionId = await getExtensionId(context, 'MetaMask')
  const metamask = new MetaMask(context, walletPage, PASSWORD, extensionId)

  await metamask.importWallet(SEED_PHRASE)
  await metamask.addNetwork(ANVIL_NETWORK)
  await metamask.switchNetwork(ANVIL_NETWORK.name)

  // Pre-connect to localhost:3000 (optional - speeds up tests)
  // Note: This requires the dApp to be running during cache build
  // Uncomment if needed:
  // const page = await context.newPage()
  // await page.goto('http://localhost:3000')
  // await page.locator('#connectButton').click()
  // await metamask.connectToDapp()
  // await page.close()
})

export { SEED_PHRASE, PASSWORD, ANVIL_NETWORK }
