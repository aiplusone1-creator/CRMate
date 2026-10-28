import { test, expect } from '@playwright/test';

test.describe('Al-Mespar CRM - Dashboard Enhancements Suite', () => {

  test('should verify adaptive quarterly target pace and updated KPI cards', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Sales Rep Cockpit displays Adaptive Quota Target instead of daily run rate
    const quarterlyTargetCard = page.locator('text=المستهدف الفصلي')
      .or(page.locator('text=Target Needed'))
      .or(page.locator('text=الهدف الشهري'))
      .or(page.locator('text=Monthly Quota'));
    await expect(quarterlyTargetCard.first()).toBeVisible();

    // Verify daily run rate label is absent
    const dailyRunRate = page.locator('text=Daily Run-Rate Needed').or(page.locator('text=الركض اليومي المطلوب'));
    await expect(dailyRunRate).toHaveCount(0);

    // 2. Verify KPI Cards Titles Clarity (Deals Count vs Pipeline Value)
    const activeDealsCountCard = page.locator('text=عدد الصفقات النشطة')
      .or(page.locator('text=Active Deals Count'))
      .or(page.locator('text=الفرص النشطة'))
      .or(page.locator('text=Active Opportunities'));
    await expect(activeDealsCountCard.first()).toBeVisible();

    const pipelineValueCard = page.locator('text=قيمة المسار')
      .or(page.locator('text=إجمالي قيمة المسار'))
      .or(page.locator('text=Total Pipeline Value'))
      .or(page.locator('text=إجمالي خط الصفقات'))
      .or(page.locator('text=Pipeline Value'));
    await expect(pipelineValueCard.first()).toBeVisible();

    // 3. Verify Dual Donut Charts for Projects by Type
    const typeDonutWidget = page.locator('text=المشاريع حسب النوع')
      .or(page.locator('text=Projects by Type'))
      .or(page.locator('text=مزيج الفرص النشطة'))
      .or(page.locator('text=Active Opportunity Mix'));
    await expect(typeDonutWidget.first()).toBeVisible();

    // Both portfolio and RFQ focus sections should be visible
    const portfolioChart = page.locator('text=الفرص النشطة')
      .or(page.locator('text=Active Pipeline'))
      .or(page.locator('text=إجمالي المحفظة'))
      .or(page.locator('text=Total Portfolio'));
    await expect(portfolioChart.first()).toBeVisible();

    const rfqFocusChart = page.locator('text=طلبات التسعير (RFQ)')
      .or(page.locator('text=RFQ Processing'))
      .or(page.locator('text=مرحلة التسعير'))
      .or(page.locator('text=RFQ Focus'))
      .or(page.locator('text=RFQ Pricing Focus'));
    await expect(rfqFocusChart.first()).toBeVisible();

    // 4. Verify Attention Center module is completely removed
    const attentionCenter = page.locator('text=Attention Center').or(page.locator('text=مركز التنبيهات العاجلة'));
    await expect(attentionCenter).toHaveCount(0);

    // 5. Verify Mini Kanban Health SLA Legend or Project Pipeline Preview
    const healthLegend = page.locator('text=مسار المشاريع المصغر')
      .or(page.locator('text=Project Pipeline Preview'))
      .or(page.locator('text=دليل الحالة الصحية للمشروع'))
      .or(page.locator('text=Project SLA Health Guide'));
    await expect(healthLegend.first()).toBeVisible();
  });

});
