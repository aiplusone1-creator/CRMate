import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Al-Mespar CRM - Team Management, User Creation & Territory Reassignment', () => {

  test('Login page displays enterprise security callout regarding internal team provisioning', async ({ page }) => {
    // 1. Mark explicit logout so getSession does not auto-seed default session
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('crmate_explicit_logout', 'true');
    });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 2. Verify enterprise callout is visible
    const callout = page.locator('text=حماية النظام وحسابات فريق العمل').or(page.locator('text=Enterprise Provisioning & Access'));
    await expect(callout).toBeVisible();

    const calloutDesc = page.locator('text=لحماية سرية عروض الأسعار والمناقصات، التسجيل الذاتي العام مغلق')
      .or(page.locator('text=To safeguard tender projects and proprietary margins, self-registration is disabled'));
    await expect(calloutDesc).toBeVisible();
  });

  test('Manager / Admin (Eng. Abdelrahman El-Qaffas) can edit territory for Abdelrahman Mohamed, add new accounts, but cannot change others photos', async ({ page }) => {
    // 1. Authenticate as Manager/Admin (u3: Abdelrahman El-Qaffas)
    await page.addInitScript(() => {
      localStorage.setItem('crmate_is_authenticated', 'true');
      localStorage.removeItem('crmate_explicit_logout');
      localStorage.setItem('crmate_auth_user', JSON.stringify({
        id: 'u3',
        email: 'ar.alkaffas@almespar.com',
        full_name: 'Abdelrahman El-Qaffas',
        name: 'Abdelrahman El-Qaffas',
        role: 'admin',
        title: 'Commercial Director & Managing Partner',
        avatar_initials: 'AQ'
      }));
      localStorage.setItem('al_mespar_session', JSON.stringify({
        user_id: 'u3',
        token: 'token_u3',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        remember_me: true
      }));
    });

    // 2. Open Settings directly on Team Tab as Manager/Admin
    await page.goto('/settings?tab=team');
    await page.waitForLoadState('networkidle');

    // 3. Verify Team Tab is active
    const activeAccountsBadge = page.locator('text=حسابات نشطة').or(page.locator('text=Active Accounts'));
    await expect(activeAccountsBadge).toBeVisible();

    // 4. Locate Abdelrahman Mohamed specific card (has badge u2)
    const abdelrahmanCard = page.locator('div.rounded-2xl').filter({ hasText: 'u2' }).first();
    await expect(abdelrahmanCard).toBeVisible();

    // 5. Verify Photo upload restriction: camera input should NOT exist on Abdelrahman's card for other users!
    const otherUserAvatarInput = abdelrahmanCard.locator('#team-avatar-u2');
    await expect(otherUserAvatarInput).toHaveCount(0);

    // 6. Click Edit Info & Territory on Abdelrahman's card (as Manager/Admin)
    const editBtn = abdelrahmanCard.locator('button').filter({ hasText: /تعديل والمنطقة|Edit & Territory/ });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // 7. Verify Edit Modal is open
    const modalHeading = page.locator('h3').filter({ hasText: /تعديل بيانات والمنطقة|Edit Profile & Territory/ });
    await expect(modalHeading).toBeVisible();

    // 8. Select Eastern Region from Territory presets
    const territorySelect = page.locator('select').filter({ hasText: /المنطقة الشرقية|Eastern Region/ });
    await territorySelect.selectOption('Eastern Region (Dammam, Khobar)');

    // 9. Save changes
    const saveBtn = page.locator('button[type="submit"]').filter({ hasText: /حفظ التعديلات والمنطقة|Save Changes/ });
    await saveBtn.click();

    // Verify modal closes and success toast appears
    await expect(modalHeading).toHaveCount(0);
    const toast = page.locator('text=تم حفظ التعديلات وتحديث منطقة').or(page.locator('text=Updated'));
    await expect(toast).toBeVisible();

    // 10. Verify Abdelrahman's card now shows Eastern Region
    await expect(abdelrahmanCard).toContainText('Eastern Region (Dammam, Khobar)');

    // 11. Test Adding a New Team Member (only visible to Managers/Admins)
    const addMemberBtn = page.locator('button').filter({ hasText: /إضافة عضو جديد|Add Team Member/ });
    await expect(addMemberBtn).toBeVisible();
    await addMemberBtn.click();

    // Verify Add Member Modal opens
    const addModalHeading = page.locator('h3').filter({ hasText: /إضافة عضو جديد لفريق العمل|Add New Team Member/ });
    await expect(addModalHeading).toBeVisible();

    // Fill form
    await page.locator('input[placeholder="e.g. Omar Khaled"]').fill('Tariq Mansoor');
    await page.locator('input[placeholder="مثال: عمر خالد"]').fill('طارق منصور');
    await page.locator('input[placeholder="name@almespar.com"]').fill('tariq.mansoor@almespar.com');
    await page.locator('input[placeholder="••••••••"]').fill('Tariq1234');
    await page.locator('input[placeholder="e.g. Regional Sales Engineer"]').fill('Senior Commercial Sales Engineer');

    // Submit new member
    const createBtn = page.locator('button[type="submit"]').filter({ hasText: /إنشاء الحساب|Create Account/ });
    await createBtn.click();

    // Verify modal closes and new member appears in roster
    await expect(addModalHeading).toHaveCount(0);
    const newMemberCard = page.locator('div.rounded-2xl').filter({ hasText: /Tariq Mansoor/ }).first();
    await expect(newMemberCard).toBeVisible();

    // 12. Capture full page screenshot of the Team Tab
    const screenshotPath = 'C:\\Users\\eslam\\.gemini\\antigravity\\brain\\1510c384-06bf-4f29-af63-8606eb3135f0\\team-territory-management-verified.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
  });

  test('Non-manager employee (Sales Engineer - Eslam) cannot add new members or edit others data', async ({ page }) => {
    // 1. Simulate logged in as regular Sales Engineer (Eslam Al-Mohandes u1)
    await page.addInitScript(() => {
      localStorage.setItem('crmate_is_authenticated', 'true');
      localStorage.removeItem('crmate_explicit_logout');
      localStorage.setItem('crmate_auth_user', JSON.stringify({
        id: 'u1',
        email: 'eslam.almohandes@almespar.com',
        full_name: 'Eslam Al-Mohandes',
        name: 'Eslam Al-Mohandes',
        role: 'sales_engineer',
        title: 'Sales Engineer',
        avatar_initials: 'EM'
      }));
      localStorage.setItem('al_mespar_session', JSON.stringify({
        user_id: 'u1',
        token: 'token_u1',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        remember_me: true
      }));
    });

    await page.goto('/settings?tab=team');
    await page.waitForLoadState('networkidle');

    // 2. Verify "+ Add Team Member" button is strictly HIDDEN for Eslam (Sales Engineer)
    const addMemberBtn = page.locator('button').filter({ hasText: /إضافة عضو جديد|Add Team Member/ });
    await expect(addMemberBtn).toHaveCount(0);

    // 3. Locate another user card (e.g. Karim Abdelazeez u4)
    const karimCard = page.locator('div.rounded-2xl').filter({ hasText: 'u4' }).first();
    await expect(karimCard).toBeVisible();

    // 4. Verify "Edit & Territory" button is strictly HIDDEN on other people's cards for Sales Engineer
    const karimEditBtn = karimCard.locator('button').filter({ hasText: /تعديل والمنطقة|Edit & Territory/ });
    await expect(karimEditBtn).toHaveCount(0);

    // 5. Verify camera upload input is strictly HIDDEN on other people's cards
    const karimCameraInput = karimCard.locator('#team-avatar-u4');
    await expect(karimCameraInput).toHaveCount(0);

    // 6. Verify camera upload input IS VISIBLE on Eslam's OWN card (u1)
    const eslamCard = page.locator('div.rounded-2xl').filter({ hasText: 'u1' }).first();
    await expect(eslamCard).toBeVisible();
    const eslamCameraInput = eslamCard.locator('#team-avatar-u1');
    await expect(eslamCameraInput).toBeAttached();
  });

});
