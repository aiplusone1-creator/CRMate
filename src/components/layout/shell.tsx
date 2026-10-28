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
import { ModuleGuideDrawer } from '@/components/guide/module-guide-drawer';
import { ChatDrawer } from '@/components/chat/chat-drawer';
import { useCRM } from '@/lib/store/crm-context';
import { AuthGuard } from '@/components/auth/auth-guard';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

  return (
    <AuthGuard>
      {pathname === '/login' ? (
        <div className="min-h-screen bg-[#EFF3F8] dark:bg-[#141820] font-sans transition-colors duration-300">
          {children}
        </div>
      ) : (
        <div className="min-h-screen bg-[#EFF3F8] dark:bg-[#141820] flex font-sans transition-colors duration-300 relative overflow-x-hidden print:min-h-0 print:h-auto print:block print:overflow-visible print:bg-white">
          {/* Ambient Lighting Mesh for Authentic Frosted Glass Refraction */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden" aria-hidden="true">
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
          <div className="flex-1 flex flex-col ltr:pl-16 rtl:pr-16 md:ltr:pl-18 md:rtl:pr-18 rtl:pl-0 min-w-0 relative z-10 transition-colors duration-200 print:block print:!p-0 print:!pr-0 print:!pl-0 print:!m-0 print:overflow-visible">
            <Header />
            <main className="flex-1 p-2 sm:p-2.5 md:p-3.5 print:block print:!p-0 print:!pr-0 print:!pl-0 print:!m-0 print:overflow-visible">
              {children}
            </main>
          </div>

          {/* Global Modals & FABs (Strictly hidden in print) */}
          <div className="print:hidden">
            {/* Global Fast Activity Logger Modal (< 20 sec) */}
            <FastLogModal
              isOpen={fastLogState.isOpen}
              onClose={closeFastLog}
              initialProject={fastLogState.project}
              initialContactId={fastLogState.contactId}
              plannedActivityId={fastLogState.plannedActivityId}
              defaultGoal={fastLogState.defaultGoal}
              initialDate={fastLogState.initialDate}
              initialTime={fastLogState.initialTime}
              defaultChannel={fastLogState.defaultChannel}
              defaultPurpose={fastLogState.defaultPurpose}
              initialTargetMode={fastLogState.initialTargetMode}
              initialCustomProjectName={fastLogState.initialCustomProjectName}
              initialCompanyName={fastLogState.initialCompanyName}
              initialLocationName={fastLogState.initialLocationName}
              initialGoogleMapsUrl={fastLogState.initialGoogleMapsUrl}
              initialPriority={fastLogState.initialPriority}
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

            {/* Interactive Bilingual Module Guide Drawer */}
            <ModuleGuideDrawer />

            {/* Team Chat & Collaborative Work Hub Drawer */}
            <ChatDrawer />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
