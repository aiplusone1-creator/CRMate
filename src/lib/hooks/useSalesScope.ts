'use client';

import { useMemo } from 'react';
import { useCRM } from '@/lib/store/crm-context';
import { 
  scopeProjects, 
  scopeActivities, 
  scopePlannedActivities, 
  canUserAccessProjectCockpit 
} from '@/lib/logic/scope';
import { Project, Activity, PlannedActivity, Profile } from '@/types/crm';

/**
 * Centralized Hook for Sales Scoping & Role Capabilities across Al-Mespar CRM.
 * Eliminates redundant role checks and repetitive scoping calculations.
 */
export function useSalesScope() {
  const { 
    currentUser, 
    currentRole, 
    teamMembers, 
    projects, 
    activities, 
    plannedActivities, 
    selectedSalesFilter, 
    setSelectedSalesFilter 
  } = useCRM();

  // Unified Role Flags
  const isManager = 
    currentUser.role === 'sales_manager' || 
    currentUser.role === 'admin' || 
    currentRole === 'sales_manager' || 
    currentRole === 'admin';

  const isSalesRep = 
    currentUser.role === 'sales_engineer' || 
    (currentUser.role as string) === 'sales_rep' || 
    (currentRole as string) === 'sales_rep' || 
    currentRole === 'sales_engineer';

  const isViewer = currentUser.role === 'viewer' || currentRole === 'viewer';
  const isEstimator = currentUser.role === 'estimator' || currentRole === 'estimator';

  // Available Sales Reps / Engineers for scoping & assignment
  const salesReps = useMemo<Profile[]>(() => {
    return teamMembers.filter(m => 
      m.role === 'sales_engineer' || 
      (m.role as string) === 'sales_rep'
    );
  }, [teamMembers]);

  // Centralized Scoped Projects (Active base)
  const scopedProjects = useMemo<Project[]>(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter);
  }, [projects, currentUser, selectedSalesFilter]);

  // Centralized Scoped Archived Projects
  const scopedArchivedProjects = useMemo<Project[]>(() => {
    return scopeProjects(projects, currentUser, selectedSalesFilter, true).filter(p => p.is_archived);
  }, [projects, currentUser, selectedSalesFilter]);

  // Centralized Scoped Completed Activities
  const scopedActivities = useMemo<Activity[]>(() => {
    return scopeActivities(activities, currentUser, selectedSalesFilter);
  }, [activities, currentUser, selectedSalesFilter]);

  // Centralized Scoped Planned Future Activities (Weekly Plan)
  const scopedPlannedActivities = useMemo<PlannedActivity[]>(() => {
    return scopePlannedActivities(plannedActivities, currentUser, selectedSalesFilter);
  }, [plannedActivities, currentUser, selectedSalesFilter]);

  // Helper to check individual project access
  const checkAccess = useMemo(() => {
    return (project: Project | null | undefined): boolean => {
      return canUserAccessProjectCockpit(project, currentUser);
    };
  }, [currentUser]);

  return useMemo(() => ({
    currentUser,
    currentRole,
    isManager,
    isSalesRep,
    isViewer,
    isEstimator,
    salesReps,
    selectedSalesFilter,
    setSelectedSalesFilter,
    scopedProjects,
    scopedArchivedProjects,
    scopedActivities,
    scopedPlannedActivities,
    canAccessProject: checkAccess,
  }), [
    currentUser,
    currentRole,
    isManager,
    isSalesRep,
    isViewer,
    isEstimator,
    salesReps,
    selectedSalesFilter,
    setSelectedSalesFilter,
    scopedProjects,
    scopedArchivedProjects,
    scopedActivities,
    scopedPlannedActivities,
    checkAccess,
  ]);
}
