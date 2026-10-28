import { test, expect } from '@playwright/test';

test.describe('CRMate - Smooth Navigation & UI Fluidity Suite', () => {

  test('should navigate between all sections smoothly with page transition and zero console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Visit Dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Dashboard data & KPI is loaded
    await expect(page.locator('text=CRMate').first()).toBeVisible();
    await expect(page.locator('.crm-page-transition')).toBeVisible();

    // 2. Navigate to Projects via Sidebar
    const startTime = Date.now();
    await page.locator('aside a[href="/projects"]').click();
    await page.waitForURL('**/projects');
    const navDuration = Date.now() - startTime;
    console.log(`Navigation to /projects took ${navDuration}ms`);
    expect(navDuration).toBeLessThan(1500); // Fluid client-side transition

    // Verify Projects page is rendered
    await expect(page.locator('.crm-page-transition')).toBeVisible();
    await expect(page.locator('text=مسار المشاريع').or(page.locator('text=Projects Pipeline'))).toBeVisible();

    // 3. Test View Mode State Preservation in Projects (Switch to Table view)
    const tableViewBtn = page.locator('button').filter({ hasText: /جدول|Table/ });
    await tableViewBtn.click();
    await expect(page.locator('table')).toBeVisible();

    // 4. Navigate to Companies
    await page.locator('aside a[href="/companies"]').click();
    await page.waitForURL('**/companies');
    await expect(page.locator('.crm-page-transition')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // Set filter in Companies
    const companySearchInput = page.locator('input[type="text"]').first();
    await companySearchInput.fill('Al Mespar');

    // 5. Navigate to Contacts
    await page.locator('aside a[href="/contacts"]').click();
    await page.waitForURL('**/contacts');
    await expect(page.locator('.crm-page-transition')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // 6. Navigate back to Companies and check filter preservation
    await page.locator('aside a[href="/companies"]').click();
    await page.waitForURL('**/companies');
    const preservedCompanySearch = await companySearchInput.inputValue();
    expect(preservedCompanySearch).toBe('Al Mespar');

    // 7. Navigate back to Projects and check View Mode preservation (should still be Table!)
    await page.locator('aside a[href="/projects"]').click();
    await page.waitForURL('**/projects');
    await expect(page.locator('table')).toBeVisible();

    // 8. Navigate to Quotations
    await page.locator('aside a[href="/quotations"]').click();
    await page.waitForURL('**/quotations');
    await expect(page.locator('.crm-page-transition')).toBeVisible();
    
    // Switch to Pipeline tab in Quotations
    const pipelineTabBtn = page.locator('button').filter({ hasText: /مشاريع قيد التسعير والمتابعة|Pipeline Projects in Quotation/ });
    await pipelineTabBtn.click();

    // Navigate to Activities
    await page.locator('aside a[href="/activities"]').click();
    await page.waitForURL('**/activities');
    await expect(page.locator('.crm-page-transition')).toBeVisible();

    // Navigate back to Quotations and verify tab is preserved
    await page.locator('aside a[href="/quotations"]').click();
    await page.waitForURL('**/quotations');
    await expect(page.locator('text=PR# / Project Name').or(page.locator('text=رقم PR / اسم المشروع')).first()).toBeVisible();

    // 9. Navigate to My Week
    await page.locator('aside a[href="/my-week"]').click();
    await page.waitForURL('**/my-week');
    await expect(page.locator('.crm-page-transition')).toBeVisible();

    // 10. Navigate to Reports
    await page.locator('aside a[href="/reports"]').click();
    await page.waitForURL('**/reports');
    await expect(page.locator('.crm-page-transition')).toBeVisible();

    // 11. Navigate to Settings
    await page.locator('aside a[href="/settings"]').click();
    await page.waitForURL('**/settings');
    await expect(page.locator('.crm-page-transition')).toBeVisible();

    // 12. Return to Dashboard
    await page.locator('aside a[href="/"]').first().click();
    await page.waitForURL(url => url.pathname === '/');
    await expect(page.locator('.crm-page-transition')).toBeVisible();

    // Assert zero critical errors
    const criticalErrors = consoleErrors.filter(err => !err.includes('404') && !err.includes('React Router'));
    expect(criticalErrors).toHaveLength(0);
  });

});
