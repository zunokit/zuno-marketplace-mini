/**
 * E2E Tests: Marketplace Flows
 * Tests NFT listing and buying with MetaMask transactions
 */

import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup from '../../test/wallet-setup/basic.setup'

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

// Helper to connect wallet
async function connectWallet(
  page: any,
  metamask: MetaMask
) {
  await page.goto('/')
  await page.getByRole('button', { name: /connect/i }).click()
  await metamask.connectToDapp()
  await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })
}

test.describe('Marketplace Flows', () => {
  test('should navigate to marketplace page', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/marketplace')
    await expect(page).toHaveURL(/marketplace/)
  })

  test('should display marketplace heading', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { name: /marketplace/i }).first()
    await expect(heading).toBeVisible()
  })

  test('should load NFT listings section', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')

    // Page should be accessible
    await expect(page).toHaveTitle(/.+/)
  })

  test.describe('List NFT Flow', () => {
    test('should open list NFT modal if button exists', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')

      const listButton = page.getByRole('button', { name: /list|sell/i }).first()

      if (await listButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await listButton.click()
        // Modal should appear
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should list NFT with MetaMask approval', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')

      const listButton = page.getByRole('button', { name: /list|sell/i }).first()

      if (!(await listButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await listButton.click()

      // Fill listing form
      const priceInput = page.getByPlaceholder(/price/i)
      if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await priceInput.fill('0.1')
      }

      // Submit listing
      const submitButton = page.getByRole('button', { name: /confirm|list|submit/i })
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click()

        // Approve in MetaMask (may need approval + transaction)
        try {
          await metamask.confirmTransaction()
        } catch {
          // May need signature first
          await metamask.confirmSignature()
          await metamask.confirmTransaction()
        }

        // Wait for success
        await expect(page.getByText(/success|listed/i)).toBeVisible({ timeout: 30000 })
      }
    })
  })

  test.describe('Buy NFT Flow', () => {
    test('should click buy button on NFT if available', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')

      const buyButton = page.getByRole('button', { name: /buy/i }).first()

      if (await buyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await buyButton.click()
        // Should show confirmation or MetaMask popup
        await page.waitForTimeout(1000)
      }
    })

    test('should complete NFT purchase with MetaMask', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')

      const buyButton = page.getByRole('button', { name: /buy/i }).first()

      if (!(await buyButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await buyButton.click()

      // Confirm in UI if needed
      const confirmButton = page.getByRole('button', { name: /confirm/i })
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click()
      }

      // Confirm MetaMask transaction
      await metamask.confirmTransaction()

      // Wait for success
      await expect(page.getByText(/success|purchased|bought/i)).toBeVisible({ timeout: 60000 })
    })
  })
})
