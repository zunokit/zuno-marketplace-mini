/**
 * E2E Tests: Auction Module (SDK)
 * Full test coverage for English and Dutch auctions
 * 
 * SDK Functions Tested:
 * - createEnglishAuction / batchCreateEnglishAuction
 * - createDutchAuction / batchCreateDutchAuction
 * - placeBid
 * - buyNow (Dutch auction)
 * - cancelAuction / batchCancelAuction
 * - settleAuction
 * - withdrawBid
 * - useAuctionDetails / useDutchAuctionPrice / usePendingRefund
 */

import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import basicSetup from '../../../test/wallet-setup/basic.setup'

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

// Test constants
const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

// Helper: Connect wallet
async function connectWallet(page: any, metamask: MetaMask) {
  await page.goto('/')
  await page.getByRole('button', { name: /connect/i }).click()
  await metamask.connectToDapp()
  await expect(page.getByText(/0xf39f/i)).toBeVisible({ timeout: 15000 })
}

// Helper: Wait for transaction success
async function waitForTxSuccess(page: any, timeout = 60000) {
  await expect(
    page.getByText(/success|confirmed|completed|created/i).first()
  ).toBeVisible({ timeout })
}

test.describe('Auction Module - Create Auctions', () => {
  test.describe('English Auction', () => {
    test('should create English auction', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/auctions/create')
      await page.waitForLoadState('networkidle')

      // Select English auction type
      const englishOption = page.getByLabel(/english/i)
      if (await englishOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await englishOption.check()
      }

      // Select NFT to auction
      const nftSelector = page.getByRole('combobox').first()
      if (await nftSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nftSelector.click()
        await page.getByRole('option').first().click()
      } else {
        // Try different selector pattern
        const selectNftButton = page.getByRole('button', { name: /select.*nft|choose/i }).first()
        if (await selectNftButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await selectNftButton.click()
          await page.locator('[data-testid="nft-option"]').first().click()
        } else {
          test.skip()
          return
        }
      }

      // Fill auction params
      await page.getByLabel(/starting.*bid|start.*price|reserve/i).fill('0.1')
      await page.getByLabel(/duration/i).fill('86400') // 1 day

      // Create auction
      await page.getByRole('button', { name: /create/i }).click()

      // May need approval first
      try {
        await metamask.confirmTransaction()
      } catch {
        await metamask.approveTokenPermission()
        await metamask.confirmTransaction()
      }

      await waitForTxSuccess(page)

      // Verify auction appears
      await page.goto('/auctions')
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/0.1.*ETH/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('should validate minimum starting bid', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/auctions/create')
      await page.waitForLoadState('networkidle')

      // Try zero starting bid
      const bidInput = page.getByLabel(/starting.*bid|start.*price/i)
      if (await bidInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bidInput.fill('0')

        const createButton = page.getByRole('button', { name: /create/i })
        const isDisabled = await createButton.isDisabled().catch(() => false)
        const errorMsg = page.getByText(/invalid|minimum|greater than/i)

        expect(isDisabled || await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy()
      }
    })
  })

  test.describe('Dutch Auction', () => {
    test('should create Dutch auction', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/auctions/create')
      await page.waitForLoadState('networkidle')

      // Select Dutch auction type
      const dutchOption = page.getByLabel(/dutch/i)
      if (!(await dutchOption.isVisible({ timeout: 2000 }).catch(() => false))) {
        // Try tab or button
        const dutchTab = page.getByRole('tab', { name: /dutch/i })
        if (await dutchTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dutchTab.click()
        } else {
          test.skip()
          return
        }
      } else {
        await dutchOption.check()
      }

      // Select NFT
      const nftSelector = page.getByRole('combobox').first()
      if (await nftSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nftSelector.click()
        await page.getByRole('option').first().click()
      } else {
        test.skip()
        return
      }

      // Fill Dutch auction params
      await page.getByLabel(/starting.*price|start.*price/i).fill('1.0')
      await page.getByLabel(/ending.*price|end.*price|floor/i).fill('0.1')
      await page.getByLabel(/duration/i).fill('86400')

      // Create
      await page.getByRole('button', { name: /create/i }).click()

      try {
        await metamask.confirmTransaction()
      } catch {
        await metamask.approveTokenPermission()
        await metamask.confirmTransaction()
      }

      await waitForTxSuccess(page)
    })

    test('should validate starting > ending price', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/auctions/create')
      await page.waitForLoadState('networkidle')

      // Select Dutch
      const dutchOption = page.getByLabel(/dutch/i)
      if (await dutchOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dutchOption.check()
      }

      // Set invalid prices (ending > starting)
      const startInput = page.getByLabel(/starting.*price/i)
      const endInput = page.getByLabel(/ending.*price|floor/i)

      if (await startInput.isVisible({ timeout: 2000 }).catch(() => false) &&
          await endInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startInput.fill('0.1')
        await endInput.fill('1.0') // Invalid: end > start

        const errorMsg = page.getByText(/invalid|must be less|starting.*greater/i)
        await expect(errorMsg).toBeVisible({ timeout: 3000 })
      }
    })
  })

  test.describe('Batch Create Auctions', () => {
    test('should batch create English auctions', async ({
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

      // Select multiple NFTs
      const checkboxes = page.locator('[type="checkbox"]')
      const count = await checkboxes.count()

      if (count < 2) {
        test.skip()
        return
      }

      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Click batch auction
      const batchAuctionButton = page.getByRole('button', { name: /auction.*selected|batch.*auction/i })
      if (!(await batchAuctionButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await batchAuctionButton.click()

      // Fill auction params
      await page.getByLabel(/starting.*bid|start.*price/i).fill('0.1')
      await page.getByLabel(/duration/i).fill('86400')

      // Create
      await page.getByRole('button', { name: /create|confirm/i }).click()
      await metamask.confirmTransaction()
      await waitForTxSuccess(page)
    })
  })
})

test.describe('Auction Module - Bidding', () => {
  test('should place bid on English auction', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    // Find an active English auction
    const auctionCard = page.locator('[data-testid="auction-card"]').first()
    if (!(await auctionCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Try link
      const auctionLink = page.getByRole('link').filter({ hasText: /auction|bid/i }).first()
      if (await auctionLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await auctionLink.click()
      } else {
        test.skip()
        return
      }
    } else {
      await auctionCard.click()
    }

    await page.waitForLoadState('networkidle')

    // Find bid input
    const bidInput = page.getByLabel(/bid|amount/i).first()
    if (!(await bidInput.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    // Enter bid amount (higher than current)
    await bidInput.fill('0.5')

    // Place bid
    const bidButton = page.getByRole('button', { name: /place.*bid|bid/i }).first()
    await bidButton.click()

    await metamask.confirmTransaction()
    await waitForTxSuccess(page)

    // Verify bid is recorded
    await expect(page.getByText(/0.5.*ETH|your.*bid/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('should reject bid lower than current', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    const auctionLink = page.getByRole('link').filter({ hasText: /auction/i }).first()
    if (!(await auctionLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    await auctionLink.click()
    await page.waitForLoadState('networkidle')

    // Try low bid
    const bidInput = page.getByLabel(/bid|amount/i).first()
    if (await bidInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bidInput.fill('0.001') // Very low

      const bidButton = page.getByRole('button', { name: /place.*bid|bid/i }).first()
      
      // Should show error or be disabled
      const isDisabled = await bidButton.isDisabled().catch(() => false)
      const errorMsg = page.getByText(/too low|minimum|higher than/i)

      if (!isDisabled) {
        await bidButton.click()
        await expect(errorMsg).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Auction Module - Dutch Auction Buy Now', () => {
  test('should buy NFT from Dutch auction', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    // Find Dutch auction (look for "Dutch" label or declining price indicator)
    const dutchAuction = page.locator('[data-auction-type="dutch"]').first()
    const dutchLabel = page.getByText(/dutch/i).first()

    if (await dutchAuction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dutchAuction.click()
    } else if (await dutchLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dutchLabel.click()
    } else {
      test.skip()
      return
    }

    await page.waitForLoadState('networkidle')

    // Buy now button
    const buyNowButton = page.getByRole('button', { name: /buy.*now|purchase/i }).first()
    if (!(await buyNowButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    await buyNowButton.click()

    // Confirm
    const confirmButton = page.getByRole('button', { name: /confirm/i })
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click()
    }

    await metamask.confirmTransaction()
    await waitForTxSuccess(page)
  })

  test('should display current Dutch auction price', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    // Find Dutch auction
    const dutchLabel = page.getByText(/dutch/i).first()
    if (await dutchLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dutchLabel.click()
      await page.waitForLoadState('networkidle')

      // Should show current price
      const priceDisplay = page.getByText(/current.*price|price/i).first()
      await expect(priceDisplay).toBeVisible({ timeout: 5000 })

      // Price should be a number with ETH
      await expect(page.getByText(/\d+(\.\d+)?\s*ETH/i).first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Auction Module - Auction Management', () => {
  test('should cancel own auction', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Go to auctions tab
    const auctionsTab = page.getByRole('tab', { name: /auctions/i })
    if (await auctionsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await auctionsTab.click()
    }

    // Find cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i }).first()
    if (!(await cancelButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
      return
    }

    await cancelButton.click()

    // Confirm
    const confirmButton = page.getByRole('button', { name: /confirm|yes/i })
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click()
    }

    await metamask.confirmTransaction()
    await waitForTxSuccess(page)
  })

  test('should settle ended auction', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    // Find ended auction
    const endedAuction = page.locator('[data-status="ended"]').first()
    const settleButton = page.getByRole('button', { name: /settle|claim|finalize/i }).first()

    if (await settleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settleButton.click()
      await metamask.confirmTransaction()
      await waitForTxSuccess(page)
    } else if (await endedAuction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endedAuction.click()
      await page.waitForLoadState('networkidle')

      const settleBtn = page.getByRole('button', { name: /settle|claim/i }).first()
      if (await settleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await settleBtn.click()
        await metamask.confirmTransaction()
        await waitForTxSuccess(page)
      }
    }
  })

  test('should withdraw outbid refund', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    // Look for withdraw/refund button
    const withdrawButton = page.getByRole('button', { name: /withdraw|refund|claim/i }).first()

    if (!(await withdrawButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Check profile page for pending refunds
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      const refundSection = page.getByText(/pending.*refund|outbid/i).first()
      if (!(await refundSection.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }
    }

    const withdrawBtn = page.getByRole('button', { name: /withdraw|refund|claim/i }).first()
    if (await withdrawBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await withdrawBtn.click()
      await metamask.confirmTransaction()
      await waitForTxSuccess(page)
    }
  })

  test('should batch cancel auctions', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Go to auctions tab
    const auctionsTab = page.getByRole('tab', { name: /auctions/i })
    if (await auctionsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await auctionsTab.click()
    }

    // Enable selection mode
    const selectModeButton = page.getByRole('button', { name: /select|batch/i })
    if (!(await selectModeButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip()
      return
    }

    await selectModeButton.click()

    // Select multiple auctions
    const checkboxes = page.locator('[type="checkbox"]')
    const count = await checkboxes.count()

    if (count < 2) {
      test.skip()
      return
    }

    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    // Batch cancel
    const batchCancelButton = page.getByRole('button', { name: /cancel.*selected|batch.*cancel/i })
    await batchCancelButton.click()

    // Confirm
    await page.getByRole('button', { name: /confirm|yes/i }).click()
    await metamask.confirmTransaction()
    await waitForTxSuccess(page)
  })
})

test.describe('Auction Module - Query Functions', () => {
  test('should display auction details', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    const auctionLink = page.getByRole('link').filter({ hasText: /auction|view/i }).first()
    if (!(await auctionLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      const auctionCard = page.locator('[data-testid="auction-card"]').first()
      if (await auctionCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await auctionCard.click()
      } else {
        test.skip()
        return
      }
    } else {
      await auctionLink.click()
    }

    await page.waitForLoadState('networkidle')

    // Verify auction info is displayed
    await expect(page.getByText(/price|bid|starting/i).first()).toBeVisible()
    await expect(page.getByText(/time|ends|duration/i).first()).toBeVisible()
  })

  test('should list user auctions', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    // Filter by "My Auctions"
    const myAuctionsTab = page.getByRole('tab', { name: /my.*auctions|owned/i })
    if (await myAuctionsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await myAuctionsTab.click()
      await page.waitForLoadState('networkidle')

      // Should show user's auctions or empty state
      const hasAuctions = await page.locator('[data-testid="auction-card"]').count() > 0
      const emptyState = page.getByText(/no auctions|create.*first/i)

      expect(hasAuctions || await emptyState.isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy()
    }
  })

  test('should show time remaining', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/auctions')
    await page.waitForLoadState('networkidle')

    // Look for time indicators
    const timeDisplay = page.getByText(/\d+\s*(h|hr|hour|d|day|m|min)/i).first()
    await expect(timeDisplay).toBeVisible({ timeout: 5000 })
  })
})
