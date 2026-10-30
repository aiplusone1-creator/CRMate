import { NextResponse } from 'next/server';
import { authenticateRequestAsync } from '@/lib/auth/server-token';
import { createAdminClient } from '@/lib/supabase/server';
import { ProjectMember } from '@/types/crm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  const auth = await authenticateRequestAsync(req);
  if (!auth.success) {
    return auth.response;
  }

  const { user } = auth;
  const sb = createAdminClient();
  if (!sb) {
    return NextResponse.json(
      { error: 'Database service unavailable', code: 'DB_UNAVAILABLE' },
      { status: 503 }
    );
  }

  try {
    const isManagerOrAdmin = 
      user.role === 'admin' || 
      user.role === 'sales_manager' || 
      user.role === 'viewer' || 
      user.role === 'estimator';

    // Build projects query: fetch all team projects so all users have Global Search discovery
    const projectsQuery = sb.from('projects').select('*').order('created_at', { ascending: false });

    const activitiesQuery = isManagerOrAdmin
      ? sb.from('activities').select('*').order('activity_date', { ascending: false })
      : sb.from('activities').select('*').eq('user_id', user.id).order('activity_date', { ascending: false });

    const plannedActivitiesQuery = isManagerOrAdmin
      ? sb.from('planned_activities').select('*').order('scheduled_date', { ascending: true })
      : sb.from('planned_activities').select('*').eq('user_id', user.id).order('scheduled_date', { ascending: true });

    const remindersQuery = isManagerOrAdmin
      ? sb.from('reminders').select('*').order('reminder_date', { ascending: true })
      : sb.from('reminders').select('*').eq('user_id', user.id).order('reminder_date', { ascending: true });

    const vipItemsQuery = isManagerOrAdmin
      ? sb.from('vip_items').select('*').order('created_at', { ascending: false })
      : sb.from('vip_items').select('*').eq('created_by', user.id).order('created_at', { ascending: false });

    const salesTargetsQuery = isManagerOrAdmin
      ? sb.from('sales_targets').select('*')
      : sb.from('sales_targets').select('*').eq('user_id', user.id);

    const approvalRequestsQuery = isManagerOrAdmin
      ? sb.from('approval_requests').select('*').order('created_at', { ascending: false })
      : sb.from('approval_requests').select('*').eq('requested_by', user.id).order('created_at', { ascending: false });

    const notificationsQuery = isManagerOrAdmin
      ? sb.from('notifications').select('*').order('created_at', { ascending: false })
      : sb.from('notifications').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('created_at', { ascending: false });

    const [
      profilesRes,
      companiesRes,
      contactsRes,
      projectsRes,
      membersRes,
      quotationsRes,
      activitiesRes,
      plannedActivitiesRes,
      salesTargetsRes,
      approvalRequestsRes,
      notificationsRes,
      remindersRes,
      vipItemsRes
    ] = await Promise.all([
      sb.from('profiles').select('*').eq('is_active', true).order('id'),
      sb.from('companies').select('*').order('name', { ascending: true }),
      sb.from('contacts').select('*').order('full_name', { ascending: true }),
      projectsQuery,
      sb.from('project_members').select('*'),
      sb.from('quotations').select('*').order('created_at', { ascending: false }),
      activitiesQuery,
      plannedActivitiesQuery,
      salesTargetsQuery,
      approvalRequestsQuery,
      notificationsQuery,
      remindersQuery,
      vipItemsQuery
    ]);

    // Check for critical table read errors
    if (vipItemsRes?.error) {
      console.warn('[CRM Data] Notice while reading vip_items:', vipItemsRes.error.message);
    }

    // Check for critical table read errors
    if (projectsRes.error) {
      console.error('Failed to fetch projects from Supabase:', projectsRes.error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: projectsRes.error.message },
        { status: 500 }
      );
    }

    // Attach project_members to corresponding projects
    const membersByProject = new Map<string, ProjectMember[]>();
    if (membersRes.data) {
      for (const m of membersRes.data) {
        const list = membersByProject.get(m.project_id) || [];
        list.push({
          project_id: m.project_id,
          user_id: m.user_id,
          role: m.role || 'collaborator',
          user_name: m.user_name || '',
          assigned_at: m.assigned_at || new Date().toISOString()
        });
        membersByProject.set(m.project_id, list);
      }
    }

    const rawAllProjects = (projectsRes.data || []).map((p: any) => ({
      ...p,
      members: membersByProject.get(p.id) || []
    }));

    // Scoped projects for pipeline operations:
    // Managers & Admins receive all team projects (113).
    // Sales Engineers receive strictly projects they own or are referred to.
    const projects = isManagerOrAdmin
      ? rawAllProjects
      : rawAllProjects.filter((p: any) => 
          p.owner_id === user.id || 
          p.referred_to_id === user.id
        );

    // Team projects for Global Search discovery:
    // Managers & Admins receive full commercial details across all projects.
    // Sales Engineers receive all team projects, but foreign projects have confidential commercial data
    // (estimated_value, pipeline_stage, internal_notes, next_action) safely sanitized at the server level.
    const teamProjects = isManagerOrAdmin
      ? rawAllProjects
      : rawAllProjects.map((p: any) => {
          const isOwnerOrAssigned = 
            p.owner_id === user.id || 
            p.referred_to_id === user.id || 
            p.members?.some((m: any) => m.user_id === user.id);

          if (isOwnerOrAssigned) return p;

          return {
            ...p,
            estimated_value: 0,
            pipeline_stage: 'stage_locked',
            internal_notes: null,
            next_action: null
          };
        });

    // Scope quotations: managers see all; sales engineers see quotations linked to their authorized projects
    const authorizedProjectIds = new Set(projects.map((p: any) => p.id));
    const quotations = isManagerOrAdmin
      ? (quotationsRes.data || [])
      : (quotationsRes.data || []).filter((q: any) => authorizedProjectIds.has(q.project_id) || q.created_by === user.id);

    const ESLAM_VERIFIED_CONTACT_IDS = new Set([
      ...Array.from({ length: 150 }, (_, i) => `cnt_${i + 1}`),
      'cnt_1790761657263', 'cnt_1790761732883', 'cnt_1790762140890',
      'cnt_1791973982837', 'cnt_1791975659219', 'cnt_1792583260575',
      'cnt_1792583522493', 'cnt_1792583546177'
    ]);

    // Resolve contact creator with verified source evidence
    const contacts = (contactsRes.data || []).map((c: any) => {
      let createdBy = c.created_by;
      if (!createdBy) {
        if (c.id?.startsWith('ct_u4_')) createdBy = 'u4';
        else if (c.id?.startsWith('ct_u0_')) createdBy = 'u0';
        else if (c.id?.startsWith('ct_u2_')) createdBy = 'u2';
        else if (ESLAM_VERIFIED_CONTACT_IDS.has(c.id)) createdBy = 'u1';
        else createdBy = undefined;
      }
      return {
        ...c,
        created_by: createdBy
      };
    });

    const UNVERIFIED_COMPANY_IDS = new Set([
      'c_126', 'c_127', 'c_128', 'c_red_sea_contracting', 'c_13', 'c_tahlia_group'
    ]);
    const companies = (companiesRes.data || []).map((c: any) => ({
      ...c,
      created_by: UNVERIFIED_COMPANY_IDS.has(c.id) ? undefined : (c.created_by || undefined)
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          profiles: profilesRes.data || [],
          companies,
          contacts,
          projects,
          teamProjects,
          quotations,
          activities: activitiesRes.data || [],
          plannedActivities: plannedActivitiesRes.data || [],
          salesTargets: salesTargetsRes.data || [],
          approvalRequests: approvalRequestsRes.data || [],
          notifications: notificationsRes.data || [],
          reminders: remindersRes.data || [],
          vipItems: vipItemsRes?.data || []
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error: any) {
    console.error('CRMate unified data endpoint exception:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching CRM data', details: error?.message },
      { status: 500 }
    );
  }
}
