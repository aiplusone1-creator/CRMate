import { test, expect } from '@playwright/test';

test.describe('Al-Mespar CRM - Projects Pipeline & Autosave Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display Kanban board columns and commercial header ribbon', async ({ page }) => {
    // 1. Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: /Projects|المشاريع/i }).first()).toBeVisible();

    // 2. Verify all 7 contracting lifecycle columns exist
    const stagePatterns = [
      /Lead|عميل محتمل/i,
      /RFQ|طلب تسعير/i,
      /Quotation|عرض سعر/i,
      /Submittal|اعتماد فني/i,
      /Negotiation|تفاوض/i,
      /Won|صفقة رابحة/i,
      /Lost|صفقة خاسرة/i
    ];

    for (const pattern of stagePatterns) {
      await expect(page.locator('.crm-kanban-column').filter({ hasText: pattern }).first()).toBeVisible();
    }

    // 3. Verify Autosave indicator in header
    const autosaveButton = page.locator('button').filter({ hasText: /محفوظ تلقائياً|Excel Autosaved|مزامنة الإكسيل|Sync Excel/i }).first();
    await expect(autosaveButton).toBeVisible();
  });

  test('should open Add Project modal, verify Project Date field, and create a project with autosave', async ({ page }) => {
    // 1. Open Add Project Modal
    const addBtn = page.getByRole('button', { name: /Add Project|\+ إضافة مشروع/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 2. Scope inputs inside the modal
    const modal = page.locator('.glass-card, [role="dialog"], form').first();
    await expect(modal).toBeVisible();

    const prInput = modal.locator('input[placeholder*="PR1045"]');
    const nameInput = modal.locator('input[placeholder*="King Salman Park"]');
    const dateInput = modal.locator('input[type="date"]').first();

    await expect(prInput).toBeVisible();
    await expect(nameInput).toBeVisible();
    await expect(dateInput).toBeVisible();

    // 3. Fill required fields with custom project date
    await prInput.fill('PR9099');
    await nameInput.fill('Automated E2E Tower Obhur Package');
    await dateInput.fill('2026-10-10');

    // 4. Submit modal form
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();

    // 5. Verify new project card appears on board
    await expect(page.locator('text=PR9099').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Automated E2E Tower Obhur Package').first()).toBeVisible();

    // 6. Verify autosave indicator triggers
    const autosaveBadge = page.locator('text=/محفوظ تلقائياً|Autosav|Excel Autosaved/');
    await expect(autosaveBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle to Table View and display structured project records', async ({ page }) => {
    const tableToggle = page.locator('button').filter({ hasText: /جدول|Table/i }).first();
    await expect(tableToggle).toBeVisible();
    await tableToggle.click();
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /#PR/i }).first()).toBeVisible();
  });
});
