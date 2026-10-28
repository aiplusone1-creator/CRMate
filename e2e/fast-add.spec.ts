import { test, expect } from '@playwright/test';

test.describe('Al-Mespar CRM - Fast Add Company & Contact Integration Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should allow fast company creation and auto-select it in project form', async ({ page }) => {
    // 1. Open Add Project modal
    await page.getByRole('button', { name: /Add Project|\+ إضافة مشروع/i }).click();

    const modal = page.locator('.glass-card, [role="dialog"], form').first();
    await expect(modal).toBeVisible();

    // 2. Click Fast Add Company button
    const fastCompBtn = modal.locator('button').filter({ hasText: /Fast Add Company|شركة جديدة/i }).first();
    await expect(fastCompBtn).toBeVisible();
    await fastCompBtn.click();

    // 3. Fill Fast Company fields
    const compNameInput = modal.locator('input[placeholder*="Al-Mespar"], input[placeholder*="شركة المسبار"]').last();
    await compNameInput.fill('Al-Fawzan Contracting Group E2E');

    // 4. Click Save Company
    const saveCompBtn = modal.locator('button').filter({ hasText: /حفظ واختيار الشركة|Save & Select Company/i }).first();
    await saveCompBtn.click();

    // 5. Verify company is now selected in the company dropdown
    const companySelect = modal.locator('select').filter({ hasText: /اختر الشركة|Select Company/ });
    const selectedText = await companySelect.locator('option:checked').textContent();
    expect(selectedText).toContain('Al-Fawzan Contracting Group E2E');
  });

  test('should enforce associated company when adding a fast contact', async ({ page }) => {
    // 1. Open Add Project modal
    await page.getByRole('button', { name: /Add Project|\+ إضافة مشروع/i }).click();

    const modal = page.locator('.glass-card, [role="dialog"], form').first();
    await expect(modal).toBeVisible();

    // 2. Click Fast Add Contact button
    const fastContactBtn = modal.locator('button').filter({ hasText: /Fast Add Contact|جهة اتصال جديدة/i }).first();
    await expect(fastContactBtn).toBeVisible();
    await fastContactBtn.click();

    // 3. Verify company selection inside fast contact is present
    const assocCompSelect = modal.locator('select').last();
    await expect(assocCompSelect).toBeVisible();

    // 4. Fill contact details
    const contactNameInput = modal.locator('input[placeholder*="Ahmed Fahad"], input[placeholder*="أحمد فهد"]').last();
    await contactNameInput.fill('Eng. Khaled Al-Ghamdi');

    const phoneInput = modal.locator('input[placeholder*="9665"], input[placeholder*="05"]').last();
    await phoneInput.fill('966501234999');

    // 5. Save Contact
    const saveContactBtn = modal.locator('button').filter({ hasText: /حفظ واختيار جهة الاتصال|Save & Select Contact/i }).first();
    await saveContactBtn.click();
  });
});
