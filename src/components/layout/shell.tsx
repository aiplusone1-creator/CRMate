'use client';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { FastLogModal } from '@/components/activities/fast-log-modal';
import { AddProjectModal } from '@/components/modals/add-project-modal';
import { AddContactModal } from '@/components/modals/add-contact-modal';
import { ReminderModal } from '@/components/modals/reminder-modal';
import { RequestApprovalModal } from '@/components/requests/request-approval-modal';
import { RequestDetailModal } from '@/components/requests/request-detail-modal';
import { useCRM } from '@/lib/store/crm-context';
import { AuthGuard } from '@/components/auth/auth-guard';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { 
    fastLogState, 
    closeFastLog,
    isNewProjectModalOpen,
    closeNewProjectModal,
    isNewContactModalOpen,
    closeNewContactModal,
    reminderModalState,
    closeReminder,
    isRequestModalOpen,
    closeRequestModal,
    requestModalProject,
    requestModalQuotationId,
    selectedRequestIdForDetail,
    closeRequestDetail
  } = useCRM();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#EFF3F8] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-500 font-urbanist">CRMate Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      {pathname === '/login' ? (
        <div className="min-h-screen bg-[#EFF3F8] font-sans">{children}</div>
      ) : (
        <div className="min-h-screen bg-[#EFF3F8] flex font-sans">
          {/* Fixed Sidebar Icon Rail */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col pl-20 min-w-0">
            <Header />
            <main className="flex-1 p-6 md:p-8">
              {children}
            </main>
          </div>

          {/* Global Fast Activity Logger Modal (< 20 sec) */}
          <FastLogModal
            isOpen={fastLogState.isOpen}
            onClose={closeFastLog}
            initialProject={fastLogState.project}
            initialContactId={fastLogState.contactId}
            plannedActivityId={fastLogState.plannedActivityId}
            defaultGoal={fastLogState.defaultGoal}
          />

          {/* Global Add Project Modal */}
          <AddProjectModal
            isOpen={isNewProjectModalOpen}
            onClose={closeNewProjectModal}
          />

          {/* Global Add Contact Modal */}
          <AddContactModal
            isOpen={isNewContactModalOpen}
            onClose={closeNewContactModal}
          />

          {/* Global Reminder Modal */}
          <ReminderModal
            isOpen={reminderModalState.isOpen}
            onClose={closeReminder}
            defaultValues={reminderModalState.defaultValues}
          />

          {/* Global Request Approval Modal (< 30s) */}
          <RequestApprovalModal
            isOpen={isRequestModalOpen}
            onClose={closeRequestModal}
            project={requestModalProject}
            initialQuotationId={requestModalQuotationId}
          />

          {/* Global Request Detail Modal */}
          <RequestDetailModal
            isOpen={!!selectedRequestIdForDetail}
            onClose={closeRequestDetail}
            requestId={selectedRequestIdForDetail}
          />
        </div>
      )}
    </AuthGuard>
  );
}
