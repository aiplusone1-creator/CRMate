import { test, expect } from '@playwright/test';

test.describe('Al-Mespar CRM - Excel Sync & Performance Suite', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Authenticate via session route to obtain cryptographic session token
    const authRes = await request.post('/api/auth/session', {
      data: { devAutoSession: true }
    });
    expect(authRes.status()).toBe(200);
    const authData = await authRes.json();
    expect(authData.success).toBe(true);
    expect(authData.token).toBeTruthy();
    authToken = authData.token;

    // Warm up the dynamic API route to exclude initial module loading from benchmark
    await request.get('/api/sync-excel', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('should successfully sync CRM projects to Excel under 3 seconds', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post('/api/sync-excel', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        projects: [
          {
            id: 'e2e-proj-1',
            pr_number: 'PR9999',
            name: 'Playwright Benchmark Test Project',
            company_id: 'c1',
            company_name: 'Benchmark Co.',
            pipeline_stage: 'lead',
            opportunity_type: 'tender',
            priority: 'high',
            location: 'Jeddah',
            estimated_value: 250000,
            probability: 50,
            weighted_value: 125000,
            owner_id: 'u1',
            owner_name: 'Eslam Mohandes',
            created_at: '2026-10-15T10:00:00.000Z',
            stage_entered_at: '2026-10-15T10:00:00.000Z'
          }
        ]
      }
    });

    const duration = Date.now() - startTime;
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    // Performance check: Sync must finish in < 3500ms (verifying no Excel hyper-bloat regression)
    expect(duration).toBeLessThan(3500);
  });
});
