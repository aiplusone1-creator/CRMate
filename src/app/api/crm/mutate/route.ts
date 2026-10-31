import { NextResponse } from 'next/server';
import { authenticateRequestAsync } from '@/lib/auth/server-token';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type AllowedEntity =
  | 'projects'
  | 'companies'
  | 'contacts'
  | 'activities'
  | 'planned_activities'
  | 'quotations'
  | 'reminders'
  | 'approval_requests'
  | 'sales_targets'
  | 'profiles'
  | 'vip_items'
  | 'notifications';

type AllowedAction = 'insert' | 'update' | 'delete' | 'archive' | 'restore';

/**
 * Calculates the next authoritative sequential PR number across all projects in the database.
 * Scans all records (including archived) to identify the absolute maximum numeric PR value.
 */
async function getNextGlobalPrNumber(sb: any): Promise<string> {
  let maxNum = 1000;
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await sb
      .from('projects')
      .select('pr_number')
      .range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) break;

    for (const row of data) {
      const match = (row.pr_number || '').match(/^PR(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return `PR${maxNum + 1}`;
}

export async function POST(req: Request) {
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
    const body = await req.json();
    const { entity, action, id, data } = body as {
      entity: AllowedEntity;
      action: AllowedAction;
      id?: string;
      data?: any;
    };

    if (!entity || !action) {
      return NextResponse.json(
        { error: 'Entity and action are required parameters', code: 'INVALID_PARAMETERS' },
        { status: 400 }
      );
    }

    const isManagerOrAdmin = user.role === 'admin' || user.role === 'sales_manager';
    const isSalesEngineer = user.role === 'sales_engineer';
    const isEstimator = user.role === 'estimator';

    // -------------------------------------------------------------
    // 1. PROJECTS
    // -------------------------------------------------------------
    if (entity === 'projects') {
      if (action === 'insert') {
        if (!isManagerOrAdmin && !isSalesEngineer) {
          return NextResponse.json({ error: 'Permission denied to create projects', code: 'FORBIDDEN' }, { status: 403 });
        }

        const { calculated_health, days_overdue, members, weighted_value: _omitWv, pr_number: _incomingPr, ...payload } = data || {};
        if (!payload.name) {
          return NextResponse.json({ error: 'Project name is required', code: 'VALIDATION_FAILED' }, { status: 400 });
        }

        const projectId = payload.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const basePayload = {
          opportunity_type: 'tender',
          pipeline_stage: 'lead',
          priority: 'medium',
          location: 'Riyadh',
          estimated_value: 0,
          probability: 50,
          collected_amount: 0,
          collected_percentage: 0,
          collection_status: 'pending',
          card_color: 'default',
          base_card_color: 'default',
          is_archived: false,
          ...payload,
          id: projectId,
          owner_id: payload.owner_id || user.id,
          created_at: payload.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Concurrency-proof authoritative PR number generation with retry loop
        let inserted: any = null;
        let lastError: any = null;
        const maxRetries = 5;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const nextPr = await getNextGlobalPrNumber(sb);
          const insertPayload = {
            ...basePayload,
            pr_number: nextPr
          };

          const { data: res, error: insertError } = await sb
            .from('projects')
            .insert(insertPayload)
            .select()
            .single();

          if (!insertError && res) {
            inserted = res;
            break;
          }

          lastError = insertError;
          const isPrConflict = insertError?.code === '23505' || 
            insertError?.message?.toLowerCase().includes('pr_number') ||
            insertError?.message?.toLowerCase().includes('projects_pr_number_key');

          if (isPrConflict && attempt < maxRetries - 1) {
            // Jittered backoff to avoid concurrent lockstep collisions
            await new Promise(r => setTimeout(r, 40 * (attempt + 1) + Math.random() * 25));
            continue;
          }

          break;
        }

        if (!inserted) {
          console.error('Project insert error after retries:', lastError);
          return NextResponse.json({ error: lastError?.message || 'Failed to insert project', code: 'INSERT_FAILED' }, { status: 500 });
        }

        // Handle members if provided
        if (members && Array.isArray(members) && members.length > 0) {
          const memberRows = members.map((m: any) => ({
            project_id: projectId,
            user_id: m.user_id,
            role: m.role || 'collaborator',
            user_name: m.user_name || ''
          }));
          await sb.from('project_members').upsert(memberRows, { onConflict: 'project_id,user_id' });
        }

        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        if (!targetId) {
          return NextResponse.json({ error: 'Project ID is required for update', code: 'ID_REQUIRED' }, { status: 400 });
        }

        // Permission check: admin/manager can update any; sales engineers can update owned/assigned/member projects
        if (!isManagerOrAdmin) {
          const { data: existing } = await sb
            .from('projects')
            .select('owner_id, referred_to_id')
            .eq('id', targetId)
            .maybeSingle();

          if (!existing) {
            return NextResponse.json({ error: 'Project not found', code: 'NOT_FOUND' }, { status: 404 });
          }

          const isOwner = existing.owner_id === user.id;
          const isReferred = existing.referred_to_id === user.id;

          let isMember = false;
          if (!isOwner && !isReferred) {
            const { data: mem } = await sb
              .from('project_members')
              .select('user_id')
              .eq('project_id', targetId)
              .eq('user_id', user.id)
              .maybeSingle();
            isMember = Boolean(mem);
          }

          if (!isOwner && !isReferred && !isMember) {
            return NextResponse.json({ error: 'Permission denied to update this project', code: 'FORBIDDEN' }, { status: 403 });
          }
        }

        // Critical safety rule: pr_number can NEVER be altered via project update
        // Also omit weighted_value as it is a generated stored column in PostgreSQL
        const { calculated_health, days_overdue, members, id: _omitId, pr_number: _omitPr, weighted_value: _omitWv, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();

        const { data: updated, error: updateError } = await sb
          .from('projects')
          .update(payload)
          .eq('id', targetId)
          .select()
          .single();

        if (updateError) {
          console.error('Project update error:', updateError);
          return NextResponse.json({ error: updateError.message, code: 'UPDATE_FAILED' }, { status: 500 });
        }

        if (members && Array.isArray(members)) {
          await sb.from('project_members').delete().eq('project_id', targetId);
          if (members.length > 0) {
            const memberRows = members.map((m: any) => ({
              project_id: targetId,
              user_id: m.user_id,
              role: m.role || 'collaborator',
              user_name: m.user_name || ''
            }));
            await sb.from('project_members').insert(memberRows);
          }
        }

        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        if (!isManagerOrAdmin) {
          return NextResponse.json({ error: 'Only administrators or sales managers can delete projects', code: 'FORBIDDEN' }, { status: 403 });
        }

        const targetId = id || data?.id;
        const { error: delError } = await sb.from('projects').delete().eq('id', targetId);
        if (delError) {
          return NextResponse.json({ error: delError.message, code: 'DELETE_FAILED' }, { status: 500 });
        }
        return NextResponse.json({ success: true, id: targetId });
      }

      if (action === 'archive' || action === 'restore') {
        const targetId = id || data?.id;
        const isArchiving = action === 'archive';
        const archivePayload: any = {
          is_archived: isArchiving,
          archived_at: isArchiving ? new Date().toISOString() : null,
          archived_by: isArchiving ? user.id : null,
          archived_by_name: isArchiving ? user.name || user.email : null,
          archive_reason: isArchiving ? data?.archive_reason || 'Archived' : null,
          updated_at: new Date().toISOString()
        };

        const { data: archived, error: archError } = await sb
          .from('projects')
          .update(archivePayload)
          .eq('id', targetId)
          .select()
          .single();

        if (archError) {
          return NextResponse.json({ error: archError.message, code: 'ARCHIVE_FAILED' }, { status: 500 });
        }
        return NextResponse.json({ success: true, data: archived });
      }
    }

    // -------------------------------------------------------------
    // 2. COMPANIES
    // -------------------------------------------------------------
    if (entity === 'companies') {
      if (action === 'insert') {
        if (!isManagerOrAdmin && !isSalesEngineer) {
          return NextResponse.json({ error: 'Permission denied', code: 'FORBIDDEN' }, { status: 403 });
        }
        const compId = data?.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        // Security requirement: Server-enforce created_by to authenticated user. Client cannot forge creator.
        const { created_by: _omitIncomingCb, ...compData } = data || {};
        const compPayload = {
          ...compData,
          id: compId,
          created_by: user.id,
          created_at: data?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { data: inserted, error: insErr } = await sb.from('companies').insert(compPayload).select().single();
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        // Never allow altering the original created_by attribution on update
        const { id: _omit, created_by: _omitCb, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();
        const { data: updated, error: updErr } = await sb.from('companies').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        if (!isManagerOrAdmin) {
          return NextResponse.json({ error: 'Only managers or admins can delete companies', code: 'FORBIDDEN' }, { status: 403 });
        }
        const targetId = id || data?.id;
        const { error: delErr } = await sb.from('companies').delete().eq('id', targetId);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ success: true, id: targetId });
      }
    }

    // -------------------------------------------------------------
    // 3. CONTACTS
    // -------------------------------------------------------------
    if (entity === 'contacts') {
      if (action === 'insert') {
        if (!isManagerOrAdmin && !isSalesEngineer) {
          return NextResponse.json({ error: 'Permission denied', code: 'FORBIDDEN' }, { status: 403 });
        }
        const contactId = data?.id || `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        // Security requirement: Server-enforce created_by to authenticated user. Client cannot forge creator.
        const { created_by: _omitIncomingCb, ...contData } = data || {};
        const contactPayload: any = {
          ...contData,
          id: contactId,
          owner_id: data?.owner_id || user.id,
          created_by: user.id,
          created_at: data?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        let { data: inserted, error: insErr } = await sb.from('contacts').insert(contactPayload).select().single();
        if (insErr && insErr.message?.includes("'created_by' column")) {
          // Graceful fallback if database schema migration is pending execution in Supabase Dashboard
          const { created_by: _omitDb, ...fallbackPayload } = contactPayload;
          const fallbackRes = await sb.from('contacts').insert(fallbackPayload).select().single();
          if (fallbackRes.error) return NextResponse.json({ error: fallbackRes.error.message }, { status: 500 });
          inserted = { ...fallbackRes.data, created_by: user.id };
        } else if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        // Never allow altering the original created_by attribution on update
        const { id: _omit, created_by: _omitCb, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();
        const { data: updated, error: updErr } = await sb.from('contacts').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        if (!isManagerOrAdmin) {
          return NextResponse.json({ error: 'Only managers or admins can delete contacts', code: 'FORBIDDEN' }, { status: 403 });
        }
        const targetId = id || data?.id;
        const { error: delErr } = await sb.from('contacts').delete().eq('id', targetId);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ success: true, id: targetId });
      }
    }

    // -------------------------------------------------------------
    // 4. ACTIVITIES
    // -------------------------------------------------------------
    if (entity === 'activities') {
      if (action === 'insert') {
        const actId = data?.id || `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const actPayload = {
          ...data,
          id: actId,
          user_id: isManagerOrAdmin && data?.user_id ? data.user_id : user.id,
          user_name: data?.user_name || user.name || user.email,
          created_at: data?.created_at || new Date().toISOString()
        };
        const { data: inserted, error: insErr } = await sb.from('activities').insert(actPayload).select().single();
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        if (!isManagerOrAdmin) {
          const { data: existing } = await sb.from('activities').select('user_id').eq('id', targetId).maybeSingle();
          if (existing && existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Cannot edit another user’s activity', code: 'FORBIDDEN' }, { status: 403 });
          }
        }
        const { id: _omit, ...payload } = data || {};
        const { data: updated, error: updErr } = await sb.from('activities').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        const targetId = id || data?.id;
        if (!isManagerOrAdmin) {
          const { data: existing } = await sb.from('activities').select('user_id').eq('id', targetId).maybeSingle();
          if (existing && existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Cannot delete another user’s activity', code: 'FORBIDDEN' }, { status: 403 });
          }
        }
        const { error: delErr } = await sb.from('activities').delete().eq('id', targetId);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ success: true, id: targetId });
      }
    }

    // -------------------------------------------------------------
    // 5. PLANNED ACTIVITIES
    // -------------------------------------------------------------
    if (entity === 'planned_activities') {
      if (action === 'insert') {
        const planId = data?.id || `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const planPayload = {
          ...data,
          id: planId,
          user_id: isManagerOrAdmin && data?.user_id ? data.user_id : user.id,
          user_name: data?.user_name || user.name || user.email,
          status: data?.status || 'planned',
          created_at: data?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { data: inserted, error: insErr } = await sb.from('planned_activities').insert(planPayload).select().single();
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        if (!isManagerOrAdmin) {
          const { data: existing } = await sb.from('planned_activities').select('user_id').eq('id', targetId).maybeSingle();
          if (existing && existing.user_id && existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Cannot edit another user’s planned activity', code: 'FORBIDDEN' }, { status: 403 });
          }
        }
        const { id: _omit, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();
        const { data: updated, error: updErr } = await sb.from('planned_activities').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        const targetId = id || data?.id;
        if (!isManagerOrAdmin) {
          const { data: existing } = await sb.from('planned_activities').select('user_id').eq('id', targetId).maybeSingle();
          if (existing && existing.user_id && existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Cannot delete another user’s plan', code: 'FORBIDDEN' }, { status: 403 });
          }
        }
        const { error: delErr } = await sb.from('planned_activities').delete().eq('id', targetId);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ success: true, id: targetId });
      }
    }

    // -------------------------------------------------------------
    // 6. QUOTATIONS
    // -------------------------------------------------------------
    if (entity === 'quotations') {
      if (action === 'insert') {
        if (!isManagerOrAdmin && !isSalesEngineer && !isEstimator) {
          return NextResponse.json({ error: 'Permission denied', code: 'FORBIDDEN' }, { status: 403 });
        }
        const qId = data?.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const qPayload = {
          ...data,
          id: qId,
          created_by: data?.created_by || user.name || user.email,
          created_at: data?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { data: inserted, error: insErr } = await sb.from('quotations').insert(qPayload).select().single();
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        const { id: _omit, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();
        const { data: updated, error: updErr } = await sb.from('quotations').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        if (!isManagerOrAdmin) {
          return NextResponse.json({ error: 'Only managers or admins can delete quotations', code: 'FORBIDDEN' }, { status: 403 });
        }
        const targetId = id || data?.id;
        const { error: delErr } = await sb.from('quotations').delete().eq('id', targetId);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ success: true, id: targetId });
      }
    }

    // -------------------------------------------------------------
    // 7. REMINDERS
    // -------------------------------------------------------------
    if (entity === 'reminders') {
      if (action === 'insert') {
        const rId = data?.id || `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const rPayload = {
          ...data,
          id: rId,
          user_id: data?.user_id || user.id,
          created_at: data?.created_at || new Date().toISOString()
        };
        const { data: inserted, error: insErr } = await sb.from('reminders').insert(rPayload).select().single();
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        const { id: _omit, ...payload } = data || {};
        const { data: updated, error: updErr } = await sb.from('reminders').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        const targetId = id || data?.id;
        const { error: delErr } = await sb.from('reminders').delete().eq('id', targetId);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        return NextResponse.json({ success: true, id: targetId });
      }
    }

    // -------------------------------------------------------------
    // 8. APPROVAL REQUESTS
    // -------------------------------------------------------------
    if (entity === 'approval_requests') {
      if (action === 'insert') {
        const reqId = data?.id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const reqPayload = {
          ...data,
          id: reqId,
          requested_by: user.id,
          requester_name: data?.requester_name || user.name || user.email,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { data: inserted, error: insErr } = await sb.from('approval_requests').insert(reqPayload).select().single();
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        if (!isManagerOrAdmin) {
          return NextResponse.json({ error: 'Only managers or admins can review requests', code: 'FORBIDDEN' }, { status: 403 });
        }
        const targetId = id || data?.id;
        const { id: _omit, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();
        const { data: updated, error: updErr } = await sb.from('approval_requests').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }
    }

    // -------------------------------------------------------------
    // 9. SALES TARGETS
    // -------------------------------------------------------------
    if (entity === 'sales_targets') {
      if (action === 'update') {
        if (!isManagerOrAdmin) {
          return NextResponse.json({ error: 'Only managers or admins can update sales targets', code: 'FORBIDDEN' }, { status: 403 });
        }
        const targetId = id || data?.id;
        const { id: _omit, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();
        const { data: updated, error: updErr } = await sb.from('sales_targets').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }
    }

    // -------------------------------------------------------------
    // 10. PROFILES
    // -------------------------------------------------------------
    if (entity === 'profiles') {
      if (action === 'update') {
        const targetId = id || data?.id;
        if (user.role !== 'admin' && user.id !== targetId) {
          return NextResponse.json({ error: 'Permission denied to update profile', code: 'FORBIDDEN' }, { status: 403 });
        }
        const { id: _omit, auth_user_id: _omitAuth, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();
        const { data: updated, error: updErr } = await sb.from('profiles').update(payload).eq('id', targetId).select().single();
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
        return NextResponse.json({ success: true, data: updated });
      }
    }

    // -------------------------------------------------------------
    // 11. VIP ITEMS (Strictly Isolated from Sales Pipeline)
    // -------------------------------------------------------------
    if (entity === 'vip_items') {
      if (action === 'insert') {
        const { title, category } = data || {};
        if (!title || !title.trim()) {
          return NextResponse.json({ error: 'Title is required for VIP item', code: 'VALIDATION_FAILED' }, { status: 400 });
        }
        if (!category || (category !== 'revisit_project' && category !== 'vip_call')) {
          return NextResponse.json({ error: 'Valid category (revisit_project or vip_call) is required', code: 'VALIDATION_FAILED' }, { status: 400 });
        }

        // Generate ID preserving standard prefix
        const vipId = data?.id || `vip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const vipPayload = {
          ...data,
          id: vipId,
          // Stamp created_by from authenticated server-side user token (Anti-spoofing)
          created_by: isManagerOrAdmin && data?.created_by ? data.created_by : user.id,
          status: data?.status || 'pending',
          priority: data?.priority || 'normal',
          created_at: data?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: inserted, error: insErr } = await sb.from('vip_items').insert(vipPayload).select().single();
        if (insErr) {
          console.error('[CRM Mutate] Failed to insert vip_item:', insErr);
          return NextResponse.json({ error: insErr.message || 'Failed to save VIP item to remote database' }, { status: 500 });
        }
        return NextResponse.json({ success: true, data: inserted });
      }

      if (action === 'update') {
        const targetId = id || data?.id;
        if (!targetId) {
          return NextResponse.json({ error: 'ID is required for update', code: 'VALIDATION_FAILED' }, { status: 400 });
        }

        if (!isManagerOrAdmin) {
          const { data: existing } = await sb.from('vip_items').select('created_by').eq('id', targetId).maybeSingle();
          if (existing && existing.created_by !== user.id) {
            return NextResponse.json({ error: 'Cannot edit another user’s VIP item', code: 'FORBIDDEN' }, { status: 403 });
          }
        }

        // Prevent client from spoofing or tampering with created_by
        const { id: _omit, created_by: _omitCreatedBy, ...payload } = data || {};
        payload.updated_at = new Date().toISOString();

        const { data: updated, error: updErr } = await sb.from('vip_items').update(payload).eq('id', targetId).select().single();
        if (updErr) {
          console.error('[CRM Mutate] Failed to update vip_item:', updErr);
          return NextResponse.json({ error: updErr.message || 'Failed to update VIP item on remote database' }, { status: 500 });
        }
        return NextResponse.json({ success: true, data: updated });
      }

      if (action === 'delete') {
        const targetId = id || data?.id;
        if (!targetId) {
          return NextResponse.json({ error: 'ID is required for delete', code: 'VALIDATION_FAILED' }, { status: 400 });
        }

        if (!isManagerOrAdmin) {
          const { data: existing } = await sb.from('vip_items').select('created_by').eq('id', targetId).maybeSingle();
          if (existing && existing.created_by !== user.id) {
            return NextResponse.json({ error: 'Cannot delete another user’s VIP item', code: 'FORBIDDEN' }, { status: 403 });
          }
        }

        // SAFEGUARD: Deleting a VIP item ONLY deletes from vip_items. NEVER touches projects, contacts, or companies.
        const { error: delErr } = await sb.from('vip_items').delete().eq('id', targetId);
        if (delErr) {
          console.error('[CRM Mutate] Failed to delete vip_item:', delErr);
          return NextResponse.json({ error: delErr.message || 'Failed to delete VIP item from remote database' }, { status: 500 });
        }
        return NextResponse.json({ success: true, id: targetId });
      }
    }

    // -------------------------------------------------------------
    // 12. NOTIFICATIONS
    // -------------------------------------------------------------
    if (entity === 'notifications') {
      if (action === 'update') {
        const isMarkAll = id === 'mark_all_read' || id === 'all';
        if (isMarkAll) {
          const ids = Array.isArray(data?.ids) ? data.ids : [];
          if (ids.length > 0) {
            const { error: batchErr } = await sb
              .from('notifications')
              .update({ is_read: true })
              .in('id', ids);

            if (batchErr) {
              console.error('[CRM Mutate] Failed to mark notifications as read by IDs:', batchErr);
              return NextResponse.json({ error: 'Failed to update notifications', details: batchErr.message }, { status: 500 });
            }
          } else {
            let q = sb.from('notifications').update({ is_read: true });
            if (!isManagerOrAdmin) {
              q = q.or(`user_id.eq.${user.id},user_id.is.null`);
            }
            const { error: allErr } = await q;
            if (allErr) {
              console.error('[CRM Mutate] Failed to mark all notifications as read:', allErr);
              return NextResponse.json({ error: 'Failed to update notifications', details: allErr.message }, { status: 500 });
            }
          }

          return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        if (!id) {
          return NextResponse.json({ error: 'Notification ID required', code: 'MISSING_ID' }, { status: 400 });
        }

        const { data: updatedNotif, error: notifErr } = await sb
          .from('notifications')
          .update({ is_read: data?.is_read ?? true })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (notifErr) {
          console.error('[CRM Mutate] Failed to mark notification as read:', notifErr);
          return NextResponse.json({ error: 'Failed to update notification', details: notifErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: updatedNotif });
      }

      if (action === 'delete') {
        if (!id) {
          return NextResponse.json({ error: 'Notification ID required', code: 'MISSING_ID' }, { status: 400 });
        }
        const { error: delErr } = await sb.from('notifications').delete().eq('id', id);
        if (delErr) {
          return NextResponse.json({ error: 'Failed to delete notification', details: delErr.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: `Unsupported entity/action: ${entity}/${action}`, code: 'UNSUPPORTED' }, { status: 400 });
  } catch (err: any) {
    console.error('CRMate mutation exception:', err);
    return NextResponse.json({ error: 'Internal server error in mutation', details: err?.message }, { status: 500 });
  }
}
