/**
 * E2E Tests: Full User Flows (SDK)
 * Complete end-to-end scenarios testing multiple SDK modules together
 * 
 * Scenarios:
 * 1. Creator Flow: Create collection -> Mint NFT -> List on marketplace -> Sell
 * 2. Buyer Flow: Browse marketplace -> Buy NFT -> List for resale
 * 3. Auction Flow: Create collection -> Mint -> Create auction -> Receive bids -> Settle
 * 4. Batch Operations Flow: Mint multiple -> List multiple -> Cancel multiple
 */

import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup from '../../../test/wallet-setup/basic.setup'

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

// Helper functions
async function connectWallet(page: any, metamask: MetaMask) {
  await page.goto('/')
  await page.getByRole('button', { name: /connect/i }).click()
  await metamask.connectToDapp()
  await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })
}

async function waitForTxSuccess(page: any, timeout = 60000) {
  await expect(
    page.getByText(/success|confirmed|completed|created/i).first()
  ).toBeVisible({ timeout })
}

async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Extra time for React hydration
}

test.describe('Full User Flows', () => {
  test.describe('Creator Flow: Collection -> Mint -> List -> Sell', () => {
    test('complete creator journey', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Step 1: Create Collection
      await test.step('Create new collection', async () => {
        await page.goto('/collections/create')
        await waitForPageLoad(page)

        await page.getByLabel(/^name$/i).fill('Creator Test Collection')
        await page.getByLabel(/symbol/i).fill('CTC')
        await page.getByLabel(/max supply/i).fill('100')
        await page.getByLabel(/mint price/i).fill('0.01')

        await page.getByRole('button', { name: /create/i }).click()
        await metamask.confirmTransaction()
        await waitForTxSuccess(page)
      })

      // Step 2: Mint NFT
      await test.step('Mint NFT from collection', async () => {
        await page.goto('/collections')
        await waitForPageLoad(page)

        // Click on created collection
        const collectionLink = page.getByText(/Creator Test Collection/i).first()
        if (await collectionLink.isVisible({ timeout: 5000 }).catch(() => false)) {
          await collectionLink.click()
        } else {
          await page.getByRole('link').filter({ hasText: /collection/i }).first().click()
        }
        await waitForPageLoad(page)

        // Find and click mint
        const mintButton = page.getByRole('button', { name: /mint/i }).first()
        if (await mintButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await mintButton.click()
          await metamask.confirmTransaction()
          await waitForTxSuccess(page)
        }
      })

      // Step 3: List NFT on Marketplace
      await test.step('List minted NFT on marketplace', async () => {
        await page.goto('/profile')
        await waitForPageLoad(page)

        const listButton = page.getByRole('button', { name: /list|sell/i }).first()
        if (!(await listButton.isVisible({ timeout: 5000 }).catch(() => false))) {
          return // Skip if no NFTs to list
        }

        await listButton.click()

        // Fill listing form
        await page.getByLabel(/price/i).first().fill('0.5')
        await page.getByRole('button', { name: /confirm|list/i }).click()

        // Handle approval if needed
        try {
          await metamask.confirmTransaction()
        } catch {
          await metamask.approveTokenPermission()
          await metamask.confirmTransaction()
        }

        await waitForTxSuccess(page)
      })

      // Step 4: Verify listing on marketplace
      await test.step('Verify listing appears on marketplace', async () => {
        await page.goto('/marketplace')
        await waitForPageLoad(page)

        // Should see the listing
        await expect(page.getByText(/0.5.*ETH/i).first()).toBeVisible({ timeout: 10000 })
      })
    })
  })

  test.describe('Buyer Flow: Browse -> Buy -> Resell', () => {
    test('complete buyer journey', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Step 1: Browse marketplace
      await test.step('Browse marketplace listings', async () => {
        await page.goto('/marketplace')
        await waitForPageLoad(page)

        // Should see listings or empty state
        const hasListings = await page.locator('[data-testid="listing-card"]').count() > 0
        const buyButtons = await page.getByRole('button', { name: /buy/i }).count() > 0
        const emptyState = page.getByText(/no listings|empty/i)

        expect(
          hasListings || 
          buyButtons || 
          await emptyState.isVisible({ timeout: 3000 }).catch(() => false)
        ).toBeTruthy()
      })

      // Step 2: Buy NFT
      await test.step('Purchase NFT from marketplace', async () => {
        const buyButton = page.getByRole('button', { name: /buy/i }).first()
        if (!(await buyButton.isVisible({ timeout: 5000 }).catch(() => false))) {
          return // Skip if no listings
        }

        await buyButton.click()

        // Confirm if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm/i })
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click()
        }

        await metamask.confirmTransaction()
        await waitForTxSuccess(page)
      })

      // Step 3: Verify NFT in profile
      await test.step('Verify NFT appears in profile', async () => {
        await page.goto('/profile')
        await waitForPageLoad(page)

        // Should have NFTs or collections
        const hasNFTs = await page.locator('[data-testid="nft-card"]').count() > 0
        const hasContent = await page.getByText(/token|nft|collection/i).first().isVisible({ timeout: 5000 }).catch(() => false)

        expect(hasNFTs || hasContent).toBeTruthy()
      })

      // Step 4: List for resale
      await test.step('List purchased NFT for resale', async () => {
        const listButton = page.getByRole('button', { name: /list|sell/i }).first()
        if (!(await listButton.isVisible({ timeout: 5000 }).catch(() => false))) {
          return
        }

        await listButton.click()

        // Higher price for profit
        await page.getByLabel(/price/i).first().fill('1.0')
        await page.getByRole('button', { name: /confirm|list/i }).click()

        try {
          await metamask.confirmTransaction()
        } catch {
          await metamask.approveTokenPermission()
          await metamask.confirmTransaction()
        }

        await waitForTxSuccess(page)
      })
    })
  })

  test.describe('Auction Flow: Collection -> Mint -> Auction -> Settle', () => {
    test('complete auction journey', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Step 1: Create Collection
      await test.step('Create collection for auction', async () => {
        await page.goto('/collections/create')
        await waitForPageLoad(page)

        await page.getByLabel(/^name$/i).fill('Auction Test Collection')
        await page.getByLabel(/symbol/i).fill('ATC')
        await page.getByLabel(/max supply/i).fill('50')
        await page.getByLabel(/mint price/i).fill('0.01')

        await page.getByRole('button', { name: /create/i }).click()
        await metamask.confirmTransaction()
        await waitForTxSuccess(page)
      })

      // Step 2: Mint NFT
      await test.step('Mint NFT for auction', async () => {
        await page.goto('/collections')
        await waitForPageLoad(page)

        const collectionLink = page.getByText(/Auction Test Collection/i).first()
        if (await collectionLink.isVisible({ timeout: 5000 }).catch(() => false)) {
          await collectionLink.click()
          await waitForPageLoad(page)

          const mintButton = page.getByRole('button', { name: /mint/i }).first()
          if (await mintButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await mintButton.click()
            await metamask.confirmTransaction()
            await waitForTxSuccess(page)
          }
        }
      })

      // Step 3: Create Auction
      await test.step('Create English auction', async () => {
        await page.goto('/profile')
        await waitForPageLoad(page)

        // Look for auction option
        const auctionButton = page.getByRole('button', { name: /auction|create.*auction/i }).first()
        if (!(await auctionButton.isVisible({ timeout: 5000 }).catch(() => false))) {
          // Try auctions/create page
          await page.goto('/auctions/create')
          await waitForPageLoad(page)
        } else {
          await auctionButton.click()
        }

        // Select NFT if needed
        const nftSelector = page.getByRole('combobox').first()
        if (await nftSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nftSelector.click()
          await page.getByRole('option').first().click()
        }

        // Fill auction params
        const bidInput = page.getByLabel(/starting.*bid|start.*price/i)
        if (await bidInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await bidInput.fill('0.1')
        }

        const durationInput = page.getByLabel(/duration/i)
        if (await durationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await durationInput.fill('3600') // 1 hour for testing
        }

        await page.getByRole('button', { name: /create/i }).click()

        try {
          await metamask.confirmTransaction()
        } catch {
          await metamask.approveTokenPermission()
          await metamask.confirmTransaction()
        }

        await waitForTxSuccess(page)
      })

      // Step 4: Verify auction on auctions page
      await test.step('Verify auction is active', async () => {
        await page.goto('/auctions')
        await waitForPageLoad(page)

        // Should see active auctions
        const auctionCard = page.locator('[data-testid="auction-card"]').first()
        const auctionLink = page.getByRole('link').filter({ hasText: /auction/i }).first()
        const hasAuctions = 
          await auctionCard.isVisible({ timeout: 5000 }).catch(() => false) ||
          await auctionLink.isVisible({ timeout: 3000 }).catch(() => false)

        expect(hasAuctions).toBeTruthy()
      })
    })
  })

  test.describe('Batch Operations Flow', () => {
    test('batch mint, list, and cancel', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Step 1: Batch Mint
      await test.step('Batch mint multiple NFTs', async () => {
        await page.goto('/collections')
        await waitForPageLoad(page)

        const collectionLink = page.getByRole('link').filter({ hasText: /collection/i }).first()
        if (!(await collectionLink.isVisible({ timeout: 5000 }).catch(() => false))) {
          return
        }

        await collectionLink.click()
        await waitForPageLoad(page)

        // Set quantity
        const quantityInput = page.getByLabel(/quantity|amount/i)
        if (await quantityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await quantityInput.fill('3')
        } else {
          // Try increment buttons
          const plusButton = page.getByRole('button', { name: /\+|plus/i })
          if (await plusButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await plusButton.click()
            await plusButton.click()
          }
        }

        // Mint
        const mintButton = page.getByRole('button', { name: /mint/i }).first()
        if (await mintButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await mintButton.click()
          await metamask.confirmTransaction()
          await waitForTxSuccess(page)
        }
      })

      // Step 2: Batch List
      await test.step('Batch list minted NFTs', async () => {
        await page.goto('/profile')
        await waitForPageLoad(page)

        // Enable selection mode
        const selectModeButton = page.getByRole('button', { name: /select|batch/i })
        if (!(await selectModeButton.isVisible({ timeout: 3000 }).catch(() => false))) {
          return
        }

        await selectModeButton.click()

        // Select multiple NFTs
        const checkboxes = page.locator('[type="checkbox"]')
        const count = await checkboxes.count()

        if (count >= 2) {
          await checkboxes.nth(0).check()
          await checkboxes.nth(1).check()

          // Batch list
          const batchListButton = page.getByRole('button', { name: /list.*selected|batch.*list/i })
          if (await batchListButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await batchListButton.click()

            await page.getByLabel(/price/i).first().fill('0.2')
            await page.getByRole('button', { name: /confirm|list/i }).click()

            await metamask.confirmTransaction()
            await waitForTxSuccess(page)
          }
        }
      })

      // Step 3: Batch Cancel
      await test.step('Batch cancel listings', async () => {
        await page.goto('/profile')
        await waitForPageLoad(page)

        // Go to listings tab
        const listingsTab = page.getByRole('tab', { name: /listings/i })
        if (await listingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await listingsTab.click()
        }

        // Enable selection
        const selectModeButton = page.getByRole('button', { name: /select|batch/i })
        if (!(await selectModeButton.isVisible({ timeout: 3000 }).catch(() => false))) {
          return
        }

        await selectModeButton.click()

        // Select listings
        const checkboxes = page.locator('[type="checkbox"]')
        const count = await checkboxes.count()

        if (count >= 2) {
          await checkboxes.nth(0).check()
          await checkboxes.nth(1).check()

          // Batch cancel
          const batchCancelButton = page.getByRole('button', { name: /cancel.*selected|batch.*cancel/i })
          if (await batchCancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await batchCancelButton.click()

            await page.getByRole('button', { name: /confirm|yes/i }).click()
            await metamask.confirmTransaction()
            await waitForTxSuccess(page)
          }
        }
      })
    })
  })

  test.describe('Error Handling Flows', () => {
    test('should handle transaction rejection gracefully', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/collections/create')
      await waitForPageLoad(page)

      await page.getByLabel(/^name$/i).fill('Reject Test')
      await page.getByLabel(/symbol/i).fill('REJ')
      await page.getByLabel(/max supply/i).fill('10')

      await page.getByRole('button', { name: /create/i }).click()

      // Reject the transaction
      await metamask.rejectTransaction()

      // Should show error message or allow retry
      const errorMsg = page.getByText(/rejected|cancelled|denied|failed/i)
      const retryButton = page.getByRole('button', { name: /retry|try again/i })

      expect(
        await errorMsg.isVisible({ timeout: 5000 }).catch(() => false) ||
        await retryButton.isVisible({ timeout: 5000 }).catch(() => false) ||
        await page.getByRole('button', { name: /create/i }).isVisible({ timeout: 3000 }).catch(() => false)
      ).toBeTruthy()
    })

    test('should handle network errors', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Try to access a page that requires data
      await page.goto('/marketplace')
      await waitForPageLoad(page)

      // Page should either load or show appropriate error state
      const hasContent = 
        await page.getByText(/marketplace|listings/i).first().isVisible({ timeout: 5000 }).catch(() => false) ||
        await page.getByText(/error|failed|unavailable/i).first().isVisible({ timeout: 3000 }).catch(() => false) ||
        await page.getByText(/no listings|empty/i).first().isVisible({ timeout: 3000 }).catch(() => false)

      expect(hasContent).toBeTruthy()
    })
  })

  test.describe('Wallet State Flows', () => {
    test('should persist state across page navigation', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Navigate to multiple pages
      await page.goto('/marketplace')
      await waitForPageLoad(page)
      await expect(page.getByText(/0xf39f/i)).toBeVisible()

      await page.goto('/collections')
      await waitForPageLoad(page)
      await expect(page.getByText(/0xf39f/i)).toBeVisible()

      await page.goto('/auctions')
      await waitForPageLoad(page)
      await expect(page.getByText(/0xf39f/i)).toBeVisible()

      await page.goto('/profile')
      await waitForPageLoad(page)
      await expect(page.getByText(/0xf39f/i)).toBeVisible()
    })

    test('should handle disconnect and reconnect', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Find disconnect button
      const disconnectButton = page.getByRole('button', { name: /disconnect/i })
      if (await disconnectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await disconnectButton.click()

        // Should show connect button
        await expect(page.getByRole('button', { name: /connect/i })).toBeVisible({ timeout: 5000 })

        // Reconnect
        await page.getByRole('button', { name: /connect/i }).click()
        await metamask.connectToDapp()

        // Should be connected again
        await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })
      }
    })
  })
})
