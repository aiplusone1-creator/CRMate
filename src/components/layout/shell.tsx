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
import { SpeedDialFAB } from '@/components/layout/speed-dial-fab';
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
      <div className="min-h-screen bg-[#EFF3F8] dark:bg-[#141820] flex items-center justify-center font-sans transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-[3px] border-[#8FC2F0] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-urbanist">CRMate Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      {pathname === '/login' ? (
        <div className="min-h-screen bg-[#EFF3F8] dark:bg-[#141820] font-sans transition-colors duration-300">
          {children}
        </div>
      ) : (
        <div className="min-h-screen bg-[#EFF3F8] dark:bg-[#141820] flex font-sans transition-colors duration-300 relative overflow-x-hidden">
          {/* Ambient Lighting Mesh for Authentic Frosted Glass Refraction */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            {/* Top-Right Ambient Cyan/Sky Orb */}
            <div className="absolute -top-[12%] -right-[8%] w-[550px] h-[550px] rounded-full bg-[#8FC2F0]/20 dark:bg-[#8FC2F0]/12 blur-[120px] transform-gpu" />
            {/* Mid-Left Ambient Emerald/Mint Orb */}
            <div className="absolute top-[35%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[#77CE69]/15 dark:bg-[#77CE69]/08 blur-[130px] transform-gpu" />
            {/* Bottom-Right Deep Blue/Indigo Accent Orb */}
            <div className="absolute -bottom-[10%] right-[15%] w-[600px] h-[600px] rounded-full bg-[#8FC2F0]/15 dark:bg-[#8FC2F0]/09 blur-[140px] transform-gpu" />
          </div>

          {/* Fixed Sidebar Icon Rail */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col ltr:pl-20 rtl:pr-20 rtl:pl-0 min-w-0 relative z-10">
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

          {/* Global Speed Dial FAB Button */}
          <SpeedDialFAB />
        </div>
      )}
    </AuthGuard>
  );
}
