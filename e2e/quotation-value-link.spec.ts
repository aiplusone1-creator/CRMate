import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Al-Mespar CRM - Quotation Value Navigation & Quotations Hub Suite', () => {

  test('clicking Quotation Value card on Dashboard navigates to /quotations successfully without 404', async ({ page }) => {
    // 1. Open Dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. Find KPI 3: Quotation Value card
    const quotationValueCard = page.locator('a[href="/quotations"]').first();
    await expect(quotationValueCard).toBeVisible();

    // 3. Click the card
    await quotationValueCard.click();
    await page.waitForURL('**/quotations');

    // 4. Verify that /quotations is loaded (Not 404!)
    const notFound = page.locator('text=404').or(page.locator('text=This page could not be found'));
    await expect(notFound).toHaveCount(0);

    // Verify main header
    const mainHeading = page.locator('h1').filter({ hasText: /عروض الأسعار والمقترحات الفنية|Commercial Quotations & Bids/ });
    await expect(mainHeading).toBeVisible();

    // Verify KPI cards on quotations hub
    const kpiSection = page.locator('text=قيمة العروض النشطة').or(page.locator('text=Active Quotation Value'));
    await expect(kpiSection.first()).toBeVisible();

    // 5. Test switching tabs: Official Quotations vs Pipeline Projects
    const pipelineTab = page.locator('button').filter({ hasText: /مشاريع قيد التسعير والمتابعة|Pipeline Projects in Quotation/ });
    await expect(pipelineTab).toBeVisible();
    await pipelineTab.click();

    // Verify pipeline projects table shows
    const pipelineTable = page.locator('text=PR# / Project Name').or(page.locator('text=رقم PR / اسم المشروع'));
    await expect(pipelineTable.first()).toBeVisible();

    // Switch back to official quotations tab
    const officialTab = page.locator('button').filter({ hasText: /سجل عروض الأسعار الرسمية|Official Quotation Documents/ });
    await officialTab.click();

    // Take screenshot of Quotations Hub
    const screenshotPath = 'C:\\Users\\eslam\\.gemini\\antigravity\\brain\\1510c384-06bf-4f29-af63-8606eb3135f0\\quotations-hub-verified.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // 6. Test Sidebar Quotations link
    const sidebarQuotationLink = page.locator('aside a[href="/quotations"]');
    await expect(sidebarQuotationLink).toBeVisible();

    // 7. Test /quotations/new redirect
    await page.goto('/quotations/new');
    await page.waitForURL('**/quotations?action=new');
    const projectSelectorTitle = page.locator('text=اختر المشروع لإنشاء عرض السعر').or(page.locator('text=Select Project for Quotation'));
    await expect(projectSelectorTitle).toBeVisible();
  });

});
