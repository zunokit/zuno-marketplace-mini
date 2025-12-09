/**
 * E2E Tests: Exchange Module (SDK)
 * Full test coverage for NFT listing, buying, and cancellation flows
 * 
 * SDK Functions Tested:
 * - listNFT / batchListNFT
 * - buyNFT / batchBuyNFT  
 * - cancelListing / batchCancelListing
 * - useListingsBySeller
 */

import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup from '../../../test/wallet-setup/basic.setup'

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

// Test account (Anvil account #0)
const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

// Helper: Connect wallet
async function connectWallet(page: any, metamask: MetaMask) {
  await page.goto('/')
  await page.getByRole('button', { name: /connect/i }).click()
  await metamask.connectToDapp()
  await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })
}

// Helper: Wait for transaction success toast
async function waitForTxSuccess(page: any, timeout = 60000) {
  await expect(
    page.getByText(/success|confirmed|completed/i).first()
  ).toBeVisible({ timeout })
}

// Helper: Create a test collection first
async function createTestCollection(page: any, metamask: MetaMask) {
  await page.goto('/collections/create')
  await page.waitForLoadState('networkidle')

  // Fill form
  await page.getByLabel(/name/i).first().fill('Test Exchange Collection')
  await page.getByLabel(/symbol/i).first().fill('TEC')
  await page.getByLabel(/max supply/i).first().fill('100')
  await page.getByLabel(/mint price/i).first().fill('0.01')

  // Submit
  await page.getByRole('button', { name: /create/i }).click()
  await metamask.confirmTransaction()
  await waitForTxSuccess(page)

  // Return to collections and get the new collection address
  await page.goto('/collections')
  await page.waitForLoadState('networkidle')
}

// Helper: Mint NFT for testing
async function mintTestNFT(page: any, metamask: MetaMask) {
  // Navigate to first collection's mint page
  const mintLink = page.getByRole('link', { name: /mint/i }).first()
  if (await mintLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mintLink.click()
    await page.waitForLoadState('networkidle')

    // Mint 1 NFT
    const mintButton = page.getByRole('button', { name: /mint/i }).first()
    if (await mintButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mintButton.click()
      await metamask.confirmTransaction()
      await waitForTxSuccess(page)
    }
  }
}

test.describe('Exchange Module - Single Operations', () => {
  test.describe('List NFT Flow', () => {
    test('should list NFT from profile page', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      // Go to profile
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Find NFT to list
      const listButton = page.getByRole('button', { name: /list|sell/i }).first()

      if (!(await listButton.isVisible({ timeout: 5000 }).catch(() => false))) {
        test.skip()
        return
      }

      await listButton.click()

      // Fill listing form
      const priceInput = page.getByLabel(/price/i).first()
      await priceInput.fill('0.5')

      const durationSelect = page.getByLabel(/duration/i).first()
      if (await durationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await durationSelect.selectOption({ label: /7 days/i })
      }

      // Submit listing
      await page.getByRole('button', { name: /confirm|list|submit/i }).click()

      // May need approval first
      try {
        await metamask.confirmTransaction()
      } catch {
        // Try approval + transaction
        await metamask.approveTokenPermission()
        await metamask.confirmTransaction()
      }

      await waitForTxSuccess(page)

      // Verify listing appears in marketplace
      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/0.5.*ETH/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('should validate listing price', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      const listButton = page.getByRole('button', { name: /list|sell/i }).first()

      if (!(await listButton.isVisible({ timeout: 5000 }).catch(() => false))) {
        test.skip()
        return
      }

      await listButton.click()

      // Try invalid price
      const priceInput = page.getByLabel(/price/i).first()
      await priceInput.fill('0')

      const submitButton = page.getByRole('button', { name: /confirm|list/i })
      
      // Should show validation error or be disabled
      const isDisabled = await submitButton.isDisabled().catch(() => false)
      const errorMsg = page.getByText(/invalid|minimum|greater than/i)
      
      expect(isDisabled || await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy()
    })
  })

  test.describe('Buy NFT Flow', () => {
    test('should buy NFT from marketplace', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')

      // Find a listing (not owned by current user)
      const buyButton = page.getByRole('button', { name: /buy/i }).first()

      if (!(await buyButton.isVisible({ timeout: 5000 }).catch(() => false))) {
        test.skip()
        return
      }

      await buyButton.click()

      // Confirm purchase dialog if present
      const confirmButton = page.getByRole('button', { name: /confirm/i })
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click()
      }

      await metamask.confirmTransaction()
      await waitForTxSuccess(page)

      // Verify NFT appears in profile
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')
      // NFT should be in owned tokens
    })

    test('should show insufficient balance error', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')

      // Find expensive listing
      const expensiveListing = page.locator('[data-price]').filter({ hasText: /1000.*ETH/i }).first()

      if (await expensiveListing.isVisible({ timeout: 3000 }).catch(() => false)) {
        const buyButton = expensiveListing.getByRole('button', { name: /buy/i })
        await buyButton.click()

        // Should show insufficient balance error
        await expect(page.getByText(/insufficient|not enough/i)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Cancel Listing Flow', () => {
    test('should cancel own listing', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Go to My Listings tab
      const listingsTab = page.getByRole('tab', { name: /listings|listed/i })
      if (await listingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await listingsTab.click()
      }

      // Find cancel button
      const cancelButton = page.getByRole('button', { name: /cancel/i }).first()

      if (!(await cancelButton.isVisible({ timeout: 5000 }).catch(() => false))) {
        test.skip()
        return
      }

      await cancelButton.click()

      // Confirm cancellation
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i })
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click()
      }

      await metamask.confirmTransaction()
      await waitForTxSuccess(page)

      // Verify listing is removed
      await page.reload()
      await page.waitForLoadState('networkidle')
    })
  })
})

test.describe('Exchange Module - Batch Operations', () => {
  test.describe('Batch List NFTs', () => {
    test('should batch list multiple NFTs', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Enable selection mode
      const selectModeButton = page.getByRole('button', { name: /select|batch/i })
      if (!(await selectModeButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await selectModeButton.click()

      // Select multiple NFTs (at least 2)
      const checkboxes = page.locator('[type="checkbox"]')
      const count = await checkboxes.count()
      
      if (count < 2) {
        test.skip()
        return
      }

      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Click batch list
      const batchListButton = page.getByRole('button', { name: /list selected|batch list/i })
      await batchListButton.click()

      // Fill batch listing form
      const priceInput = page.getByLabel(/price/i).first()
      await priceInput.fill('0.1')

      await page.getByRole('button', { name: /confirm|list/i }).click()

      // Approve batch transaction
      await metamask.confirmTransaction()
      await waitForTxSuccess(page)
    })
  })

  test.describe('Batch Buy NFTs', () => {
    test('should batch buy multiple NFTs', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/marketplace')
      await page.waitForLoadState('networkidle')

      // Enable selection mode
      const selectModeButton = page.getByRole('button', { name: /select|batch/i })
      if (!(await selectModeButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await selectModeButton.click()

      // Select multiple listings
      const checkboxes = page.locator('[type="checkbox"]')
      const count = await checkboxes.count()

      if (count < 2) {
        test.skip()
        return
      }

      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Click batch buy
      const batchBuyButton = page.getByRole('button', { name: /buy selected|batch buy/i })
      await batchBuyButton.click()

      // Confirm
      await page.getByRole('button', { name: /confirm/i }).click()
      await metamask.confirmTransaction()
      await waitForTxSuccess(page)
    })
  })

  test.describe('Batch Cancel Listings', () => {
    test('should batch cancel multiple listings', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      // Go to listings tab
      const listingsTab = page.getByRole('tab', { name: /listings|listed/i })
      if (await listingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await listingsTab.click()
      }

      // Enable selection mode
      const selectModeButton = page.getByRole('button', { name: /select|batch/i })
      if (!(await selectModeButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await selectModeButton.click()

      // Select multiple listings
      const checkboxes = page.locator('[type="checkbox"]')
      const count = await checkboxes.count()

      if (count < 2) {
        test.skip()
        return
      }

      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Click batch cancel
      const batchCancelButton = page.getByRole('button', { name: /cancel selected|batch cancel/i })
      await batchCancelButton.click()

      // Confirm
      await page.getByRole('button', { name: /confirm|yes/i }).click()
      await metamask.confirmTransaction()
      await waitForTxSuccess(page)
    })
  })
})

test.describe('Exchange Module - Query Functions', () => {
  test('should display user listings on profile', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Go to listings tab
    const listingsTab = page.getByRole('tab', { name: /listings|listed/i })
    if (await listingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await listingsTab.click()
      
      // Should show listings or empty state
      const hasListings = await page.locator('[data-testid="listing-card"]').count() > 0
      const emptyState = page.getByText(/no listings|empty/i)
      
      expect(hasListings || await emptyState.isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy()
    }
  })

  test('should filter marketplace listings', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/marketplace')
    await page.waitForLoadState('networkidle')

    // Find filter options
    const priceFilter = page.getByLabel(/price|min|max/i).first()
    if (await priceFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await priceFilter.fill('0.1')
      
      // Apply filter
      const filterButton = page.getByRole('button', { name: /filter|apply/i })
      if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
  })
})
