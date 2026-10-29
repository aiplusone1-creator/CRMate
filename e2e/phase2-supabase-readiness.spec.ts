import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

test.describe('CRMate Phase 2 - Supabase & Serverless Readiness Suite', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Authenticate as Admin user (u5) to verify privileged endpoints
    const authRes = await request.post('/api/auth/session', {
      data: { switchUserId: 'u5' }
    });
    expect(authRes.status()).toBe(200);
    const authData = await authRes.json();
    expect(authData.success).toBe(true);
    authToken = authData.token;
  });

  test('1. Migration schema contains TEXT PRIMARY KEY and RLS across all 12 entities', async () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20261028_000001_compatible_schema.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const schemaSql = fs.readFileSync(migrationPath, 'utf8');

    // Verify TEXT primary key pattern (not UUID)
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS projects');
    expect(schemaSql).toContain('id TEXT PRIMARY KEY');
    expect(schemaSql).toContain('company_id TEXT');
    expect(schemaSql).toContain('primary_contact_id TEXT');

    // Verify all 12 tables exist
    const expectedTables = [
      'profiles', 'companies', 'contacts', 'projects', 'project_members',
      'quotations', 'activities', 'planned_activities', 'sales_targets',
      'approval_requests', 'notifications', 'reminders'
    ];
    for (const table of expectedTables) {
      expect(schemaSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      expect(schemaSql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }

    // Verify non-destructive safety guard (no DROP TABLE)
    expect(schemaSql).not.toContain('DROP TABLE');
    expect(schemaSql).toContain('Safety Incompatibility Guard');
    expect(schemaSql).toContain('RAISE EXCEPTION');

    // Verify dual-identity user mapping and helper functions
    expect(schemaSql).toContain('get_current_profile_id()');
    expect(schemaSql).toContain('get_current_profile_role()');
    expect(schemaSql).toContain('auth_user_id UUID UNIQUE REFERENCES auth.users(id)');
  });

  test('2. Importer validation dry-run executes cleanly with exact entity preservation', async () => {
    const importerScript = path.join(process.cwd(), 'scripts', 'import-to-supabase.js');
    expect(fs.existsSync(importerScript)).toBe(true);

    const output = execSync(`node "${importerScript}" --dry-run`, { encoding: 'utf8' });
    expect(output).toContain('[✓] Profiles to import:            5');
    expect(output).toContain('[✓] Companies to import:           137');
    expect(output).toContain('[✓] Contacts to import:            159');
    expect(output).toContain('[✓] Projects to import:            37');
    expect(output).toContain('[✓] Quotations to import:          11');
    expect(output).toContain('[✓] Logged Activities to import:   485');
    expect(output).toContain('[✓] Planned Activities to import:  582');
    expect(output).toContain('[✓] Reminders to import:           0');
    expect(output).toContain('Validation finished successfully');
  });

  test('3. GET /api/export-excel returns valid Excel stream in memory', async ({ request }) => {
    const res = await request.get('/api/export-excel', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(res.status()).toBe(200);

    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const contentDisposition = res.headers()['content-disposition'] || '';
    expect(contentDisposition).toContain('attachment;');
    expect(contentDisposition).toContain('.xlsx');

    const bodyBuffer = await res.body();
    expect(bodyBuffer.length).toBeGreaterThan(5000);
  });

  test('4. POST /api/sync-excel safely responds without throwing in serverless mode', async ({ request }) => {
    const res = await request.post('/api/sync-excel', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        projects: [
          {
            id: 'p_pr1004',
            pr_number: 'PR1004',
            name: 'Phase 2 Test Project',
            company_id: 'c_tahlia_group',
            pipeline_stage: 'lead',
            opportunity_type: 'in_hand',
            priority: 'medium',
            location: 'Jeddah',
            estimated_value: 100000,
            probability: 50,
            weighted_value: 50000,
            owner_id: 'u1',
            created_at: new Date().toISOString(),
            stage_entered_at: new Date().toISOString()
          }
        ]
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.timestamp).toBeTruthy();
  });
});
