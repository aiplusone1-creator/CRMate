import { test, expect } from '@playwright/test';

test.describe('CRMate - API Security & Role-Based Authorization Suite', () => {
  let adminToken: string;
  let salesEngineerToken: string;
  let estimatorToken: string;
  let viewerToken: string;

  test.beforeAll(async ({ request }) => {
    // Generate authorized test tokens for each role using the testRole generator
    const adminRes = await request.post('/api/auth/session', {
      data: { testRole: 'admin' }
    });
    expect(adminRes.status()).toBe(200);
    adminToken = (await adminRes.json()).token;

    const seRes = await request.post('/api/auth/session', {
      data: { testRole: 'sales_engineer' }
    });
    expect(seRes.status()).toBe(200);
    salesEngineerToken = (await seRes.json()).token;

    const estRes = await request.post('/api/auth/session', {
      data: { testRole: 'estimator' }
    });
    expect(estRes.status()).toBe(200);
    estimatorToken = (await estRes.json()).token;

    const viewerRes = await request.post('/api/auth/session', {
      data: { testRole: 'viewer' }
    });
    expect(viewerRes.status()).toBe(200);
    viewerToken = (await viewerRes.json()).token;
  });

  // 1. REJECT REQUESTS WITHOUT CREDENTIALS (HTTP 401)
  test.describe('1. Unauthenticated Requests (Missing Credentials)', () => {
    test('GET /api/export-excel without token returns 401 and leaks no spreadsheet data', async ({ request }) => {
      const res = await request.get('/api/export-excel');
      expect(res.status()).toBe(401);

      const contentType = res.headers()['content-type'] || '';
      expect(contentType).not.toContain('openxmlformats');

      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
      expect(body.error).toContain('Unauthorized');
      // Ensure no internal paths or confidential strings leaked
      expect(JSON.stringify(body)).not.toContain('Saudi Projects');
      expect(JSON.stringify(body)).not.toContain('source-data');
    });

    test('POST /api/export-excel without token returns 401', async ({ request }) => {
      const res = await request.post('/api/export-excel', {
        data: { projects: [] }
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    test('GET /api/sync-excel without token returns 401', async ({ request }) => {
      const res = await request.get('/api/sync-excel');
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    test('POST /api/sync-excel without token returns 401 and does not execute sync', async ({ request }) => {
      const res = await request.post('/api/sync-excel', {
        data: { projects: [] }
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    test('GET /api/download-template without token returns 401', async ({ request }) => {
      const res = await request.get('/api/download-template');
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });
  });

  // 2. REJECT FORGED, TAMPERED, OR INVALID CREDENTIALS (HTTP 401)
  test.describe('2. Forged or Tampered Credentials', () => {
    test('rejects arbitrary forged Bearer token with 401', async ({ request }) => {
      const res = await request.get('/api/export-excel', {
        headers: { Authorization: 'Bearer forged.fake.token' }
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    test('rejects tampered signature with 401', async ({ request }) => {
      // Modify last character of a valid token's signature
      const tampered = adminToken.slice(0, -2) + 'XX';
      const res = await request.post('/api/sync-excel', {
        headers: { Authorization: `Bearer ${tampered}` },
        data: { projects: [] }
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    test('rejects mere presence of invalid cookie with 401', async ({ request }) => {
      const res = await request.get('/api/sync-excel', {
        headers: { Cookie: 'crmate_session_token=random-unverifiable-cookie' }
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });
  });

  // 3. REJECT UNAUTHORIZED ROLES (HTTP 403)
  test.describe('3. Role-Based Access Control (RBAC Permissions)', () => {
    test('viewer role cannot export excel (receives 403)', async ({ request }) => {
      const res = await request.get('/api/export-excel', {
        headers: { Authorization: `Bearer ${viewerToken}` }
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe('FORBIDDEN');
    });

    test('viewer role cannot POST to /api/sync-excel (receives 403)', async ({ request }) => {
      const res = await request.post('/api/sync-excel', {
        headers: { Authorization: `Bearer ${viewerToken}` },
        data: { projects: [] }
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe('FORBIDDEN');
    });

    test('estimator role cannot export bulk excel data (receives 403)', async ({ request }) => {
      const res = await request.post('/api/export-excel', {
        headers: { Authorization: `Bearer ${estimatorToken}` },
        data: { projects: [] }
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe('FORBIDDEN');
    });

    test('sales_engineer cannot trigger bulk workbook export (receives 403)', async ({ request }) => {
      const res = await request.get('/api/export-excel', {
        headers: { Authorization: `Bearer ${salesEngineerToken}` }
      });
      expect(res.status()).toBe(403);
      const body = await res.json();
      expect(body.code).toBe('FORBIDDEN');
    });

    test('sales_engineer CAN sync projects pipeline (receives 200)', async ({ request }) => {
      const res = await request.post('/api/sync-excel', {
        headers: { Authorization: `Bearer ${salesEngineerToken}` },
        data: {
          projects: [
            {
              id: 'rbac-test-proj',
              name: 'RBAC Test Project',
              pipeline_stage: 'lead',
              owner_id: 'u1'
            }
          ]
        }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test('viewer CAN download blank standard template (receives 200)', async ({ request }) => {
      const res = await request.get('/api/download-template', {
        headers: { Authorization: `Bearer ${viewerToken}` }
      });
      expect(res.status()).toBe(200);
      const contentType = res.headers()['content-type'] || '';
      expect(contentType).toContain('openxmlformats');
    });
  });

  // 4. AUTHORIZED ROLE PERMISSIONS (HTTP 200)
  test.describe('4. Authorized Access for Admin & Commercial Operations', () => {
    test('admin role can export full live Excel workbook', async ({ request }) => {
      const res = await request.get('/api/export-excel', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status()).toBe(200);
      const contentType = res.headers()['content-type'] || '';
      expect(contentType).toContain('openxmlformats');
      expect(res.headers()['cache-control']).toContain('no-store');
    });

    test('admin role can inspect Excel metadata via GET /api/sync-excel', async ({ request }) => {
      const res = await request.get('/api/sync-excel', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.exists).toBe(true);
      expect(typeof body.projectsCountInExcel).toBe('number');
    });
  });

  // 5. AUTHENTICATION SERVICE ENDPOINTS
  test.describe('5. Authentication Service & Verification Flow', () => {
    test('POST /api/auth/session rejects invalid credentials with 401', async ({ request }) => {
      const res = await request.post('/api/auth/session', {
        data: { email: 'eslam.almohandes@almespar.com', password: 'WrongPassword999' }
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Invalid email or password');
    });

    test('POST /api/auth/session accepts legitimate credentials and returns token', async ({ request }) => {
      const res = await request.post('/api/auth/session', {
        data: { email: 'eslam.almohandes@almespar.com', password: 'Es1234' }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.token).toBeTruthy();
      expect(body.user.role).toBe('sales_engineer');

      // Test verifying this newly issued token on GET /api/auth/session
      const verifyRes = await request.get('/api/auth/session', {
        headers: { Authorization: `Bearer ${body.token}` }
      });
      expect(verifyRes.status()).toBe(200);
      const verifyBody = await verifyRes.json();
      expect(verifyBody.authenticated).toBe(true);
      expect(verifyBody.user.id).toBe('u1');
    });

    test('GET /api/auth/session rejects missing token with 401', async ({ request }) => {
      const res = await request.get('/api/auth/session');
      expect(res.status()).toBe(401);
    });
  });
});
