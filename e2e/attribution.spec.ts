import { test, expect } from '@playwright/test'

test('attribution page loads and contains MIT copyright', async ({ page }) => {
  await page.goto('/legal/attribution')
  await expect(page).toHaveTitle(/attribution/i)
  await expect(page.getByText(/MIT License/i)).toBeVisible()
  await expect(page.getByText(/kananinirav/i)).toBeVisible()
})

test('footer contains attribution link', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: /attribution/i })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/legal\/attribution/)
})
