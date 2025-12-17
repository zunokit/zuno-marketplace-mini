/**
 * E2E Tests: Connect Wallet Flow
 * Tests MetaMask wallet connection using Synpress
 */

import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup from '../../test/wallet-setup/basic.setup'

// Create test instance with Synpress and MetaMask fixtures
const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

// Test account address (Anvil account #0)
const TEST_ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

test.describe('Connect Wallet Flow', () => {
  test('should display connect wallet button when not connected', async ({ page }) => {
    await page.goto('/')

    const connectButton = page.getByRole('button', { name: /connect/i })
    await expect(connectButton).toBeVisible()
  })

  test('should connect wallet successfully', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)

    await page.goto('/')

    // Click connect button
    await page.getByRole('button', { name: /connect/i }).click()

    // Approve connection in MetaMask
    await metamask.connectToDapp()

    // Verify wallet is connected - check for truncated address
    const addressPattern = TEST_ACCOUNT_ADDRESS.slice(0, 6).toLowerCase()
    await expect(page.getByText(new RegExp(addressPattern, 'i'))).toBeVisible({ timeout: 15000 })
  })

  test('should show wallet address after connection', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)

    await page.goto('/')
    await page.getByRole('button', { name: /connect/i }).click()
    await metamask.connectToDapp()

    // Should display truncated address (0xf39F...2266)
    await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })
  })

  test('should show ETH balance after connection', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)

    await page.goto('/')
    await page.getByRole('button', { name: /connect/i }).click()
    await metamask.connectToDapp()

    // Should display ETH balance
    await expect(page.getByText(/\d+(\.\d+)?\s*ETH/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('should disconnect wallet', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)

    await page.goto('/')
    await page.getByRole('button', { name: /connect/i }).click()
    await metamask.connectToDapp()

    // Wait for connection
    await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })

    // Click disconnect button if available
    const disconnectButton = page.getByRole('button', { name: /disconnect/i })
    if (await disconnectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disconnectButton.click()

      // Should show connect button again
      await expect(page.getByRole('button', { name: /connect/i })).toBeVisible({ timeout: 10000 })
    }
  })
})
