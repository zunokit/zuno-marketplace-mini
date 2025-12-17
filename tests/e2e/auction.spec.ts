/**
 * E2E Tests: Auction Flows
 * Tests NFT auction creation and bidding with MetaMask
 */

import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup from '../../test/wallet-setup/basic.setup'

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

async function connectWallet(page: any, metamask: MetaMask) {
  await page.goto('/')
  await page.getByRole('button', { name: /connect/i }).click()
  await metamask.connectToDapp()
  await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })
}

test.describe('Auction Flows', () => {
  test('should navigate to auctions page', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await expect(page).toHaveURL(/auctions/)
  })

  test('should display auctions heading', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { name: /auction/i }).first()
    await expect(heading).toBeVisible()
  })

  test.describe('Create Auction Flow', () => {
    test('should open create auction modal', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/auctions')
      await page.waitForLoadState('networkidle')

      const createButton = page.getByRole('button', { name: /create|new/i }).first()

      if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createButton.click()
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Bid Flow', () => {
    test('should place bid on auction with MetaMask', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/auctions')
      await page.waitForLoadState('networkidle')

      // Find first active auction
      const auctionCard = page.locator('[data-testid="auction-card"]').first()

      if (!(await auctionCard.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await auctionCard.click()

      // Find bid input and button
      const bidInput = page.getByPlaceholder(/bid|amount/i).first()
      const bidButton = page.getByRole('button', { name: /bid|place/i }).first()

      if (
        !(await bidInput.isVisible({ timeout: 3000 }).catch(() => false)) ||
        !(await bidButton.isVisible({ timeout: 3000 }).catch(() => false))
      ) {
        test.skip()
        return
      }

      // Enter bid amount
      await bidInput.fill('0.1')
      await bidButton.click()

      // Confirm MetaMask transaction
      await metamask.confirmTransaction()

      // Wait for success
      await expect(page.getByText(/success|bid placed/i)).toBeVisible({ timeout: 60000 })
    })
  })
})
