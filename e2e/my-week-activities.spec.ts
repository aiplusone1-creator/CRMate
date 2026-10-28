import { test, expect } from '@playwright/test';

test.describe('Al-Mespar CRM - My Week & Activities Suite', () => {
  test('should render weekly plan and strictly confirm Roll Forward button is removed', async ({ page }) => {
    await page.goto('/my-week');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify My Week title
    await expect(page.locator('h1, h2').filter({ hasText: /My Week|أسبوعي|خطة الأسبوع/i }).first()).toBeVisible();

    // 2. CRITICAL REGRESSION TEST: Ensure Roll Forward button is COMPLETELY REMOVED
    const rollForwardBtn = page.locator('button, a').filter({ hasText: /roll forward|ترحيل الكل إلى هذا الأسبوع|ترحيل للآن/i });
    await expect(rollForwardBtn).toHaveCount(0);
  });

  test('should render activities list and support activity search/filters', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Activities title
    await expect(page.locator('h1, h2').filter({ hasText: /Activities|الأنشطة/i }).first()).toBeVisible();

    // 2. Verify Log Activity button exists (use first to avoid multiple day card buttons)
    const logActivityBtn = page.getByRole('button', { name: /Log Activity|تسجيل نشاط/i }).first();
    await expect(logActivityBtn).toBeVisible();

    // 3. Verify Search box or filters are present
    const searchOrFilter = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"], select').first();
    await expect(searchOrFilter).toBeVisible();
  });
});
