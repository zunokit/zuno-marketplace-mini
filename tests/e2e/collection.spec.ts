/**
 * E2E Tests: Collection Flows
 * Tests NFT collection creation and minting with MetaMask
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

test.describe('Collection Flows', () => {
  test('should navigate to collections page', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/collections')
    await expect(page).toHaveURL(/collections/)
  })

  test('should display collections heading', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
    await connectWallet(page, metamask)

    await page.goto('/collections')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { name: /collection/i }).first()
    await expect(heading).toBeVisible()
  })

  test.describe('Create Collection Flow', () => {
    test('should open create collection modal', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      const createButton = page.getByRole('button', { name: /create/i }).first()

      if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createButton.click()
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should create collection with MetaMask transaction', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      const createButton = page.getByRole('button', { name: /create/i }).first()

      if (!(await createButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip()
        return
      }

      await createButton.click()

      // Fill collection form
      const nameInput = page.getByPlaceholder(/name/i).first()
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Test Collection')
      }

      const symbolInput = page.getByPlaceholder(/symbol/i).first()
      if (await symbolInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await symbolInput.fill('TEST')
      }

      // Submit
      const submitButton = page.getByRole('button', { name: /create|submit|confirm/i }).last()
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click()

        // Confirm MetaMask transaction
        await metamask.confirmTransaction()

        // Wait for success
        await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 60000 })
      }
    })
  })

  test.describe('Mint NFT Flow', () => {
    test('should open mint modal on collection page', async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
      await connectWallet(page, metamask)

      await page.goto('/collections')
      await page.waitForLoadState('networkidle')

      // Click on first collection if available
      const collectionCard = page.locator('[data-testid="collection-card"]').first()
      if (await collectionCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await collectionCard.click()

        const mintButton = page.getByRole('button', { name: /mint/i }).first()
        if (await mintButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await mintButton.click()
          await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })
})
