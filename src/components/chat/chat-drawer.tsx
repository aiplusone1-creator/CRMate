'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  X, 
  Send, 
  AtSign, 
  Hash, 
  Calendar, 
  Building2, 
  UserPlus, 
  ExternalLink, 
  Clock, 
  Check, 
  CheckCircle2, 
  Search, 
  Plus, 
  MessagesSquare, 
  MessageSquare, 
  Briefcase, 
  Shield, 
  Sparkles, 
  Target, 
  CalendarClock, 
  User, 
  ChevronDown, 
  AlertCircle,
  FileText,
  DollarSign,
  Share2
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { usePresence } from '@/lib/realtime/presence-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { formatChatTime } from '@/lib/logic/chat';
import { ChatConversation, ChatMessage, ChatProjectCard, ChatPlanTaskCard, ActivityChannel, VisitPurpose } from '@/types/crm';

export function ChatDrawer() {
  const router = useRouter();
  const { isRTL, t } = useLanguage();
  const { isUserOnline } = usePresence();
  const {
    currentUser,
    teamMembers,
    projects,
    plannedActivities,
    conversations,
    messages,
    isChatDrawerOpen,
    activeConversationId,
    closeChat,
    setActiveConversationId,
    sendMessage,
    markConversationRead,
    createChannel,
    getOrCreateDM,
    grantProjectAccessFromChat,
    reschedulePlanTaskFromChat,
    acknowledgePlanTaskFromChat,
    assignTaskFromChatToPlan,
    draftProjectCard,
    setDraftProjectCard
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'all' | 'channels' | 'direct'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [attachedProject, setAttachedProject] = useState<ChatProjectCard | null>(null);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  
  // Popovers & Dialogs
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);

  // New Channel Form state
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelNameAr, setNewChannelNameAr] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelMembers, setNewChannelMembers] = useState<string[]>([]);

  // Task Assignment state (Manager to Rep)
  const [assignTitle, setAssignTitle] = useState('');
  const [assignClient, setAssignClient] = useState('');
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignDate, setAssignDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [assignChannel, setAssignChannel] = useState<ActivityChannel>('visit');
  const [assignPurpose, setAssignPurpose] = useState<VisitPurpose>('technical_clarification');
  const [assignNotes, setAssignNotes] = useState('');

  // Project search query in picker
  const [projectSearch, setProjectSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync project attached from external share action ("مشاركة بالشات")
  useEffect(() => {
    if (draftProjectCard) {
      setAttachedProject(draftProjectCard);
      setDraftProjectCard(null);
    }
  }, [draftProjectCard, setDraftProjectCard]);

  // Active conversation object (null when in "Compose / Select Recipient" mode)
  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find(c => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Mark conversation read when switched
  useEffect(() => {
    if (isChatDrawerOpen && activeConversation?.id) {
      markConversationRead(activeConversation.id);
    }
  }, [isChatDrawerOpen, activeConversation?.id, markConversationRead]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isChatDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConversationId, isChatDrawerOpen]);

  if (!isChatDrawerOpen) return null;

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    // Current user must be a participant
    if (!c.participant_ids.includes(currentUser.id)) return false;

    if (activeTab === 'channels' && c.type !== 'channel') return false;
    if (activeTab === 'direct' && c.type !== 'direct') return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    if (c.type === 'channel') {
      return (c.name && c.name.toLowerCase().includes(q)) || (c.name_ar && c.name_ar.includes(q));
    } else {
      // Find other participant
      const otherId = c.participant_ids.find(id => id !== currentUser.id);
      const otherUser = teamMembers.find(t => t.id === otherId);
      return otherUser ? otherUser.full_name.toLowerCase().includes(q) : false;
    }
  });

  // Active conversation messages
  const currentMessages = messages.filter(m => m.conversation_id === activeConversation?.id);

  // Resolve DM participant name and details
  const getDMInfo = (conv?: ChatConversation | null) => {
    if (!conv) {
      return {
        userId: '',
        name: isRTL ? 'محادثة خاصة' : 'Direct Message',
        role: 'member',
        territory: '',
        initials: 'DM'
      };
    }
    const otherId = conv.participant_ids.find(id => id !== currentUser.id) || conv.participant_ids[0];
    const user = teamMembers.find(t => t.id === otherId);
    return {
      userId: otherId,
      name: user ? user.full_name : 'زميل العمل',
      role: user ? user.role : 'member',
      territory: user?.territory || '',
      initials: user?.avatar_initials || 'ME'
    };
  };

  // Get unread count for a conversation
  const getConvUnreadCount = (convId: string) => {
    return messages.filter(
      m => m.conversation_id === convId &&
           m.sender_id !== currentUser.id &&
           (!m.read_by || !m.read_by.includes(currentUser.id))
    ).length;
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return `${Number(val || 0).toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}`;
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedProject) return;
    if (!activeConversation) return;

    await sendMessage({
      conversationId: activeConversation.id,
      content: inputText.trim(),
      mentions: selectedMentions,
      projectCard: attachedProject || undefined
    });

    setInputText('');
    setAttachedProject(null);
    setSelectedMentions([]);
    setIsMentionPickerOpen(false);
    setIsProjectPickerOpen(false);
  };

  // Attach a project to composer
  const handleSelectProject = (proj: typeof projects[0]) => {
    setAttachedProject({
      project_id: proj.id,
      pr_number: proj.pr_number,
      name: proj.name,
      company_name: proj.company_name,
      estimated_value: proj.estimated_value,
      pipeline_stage: proj.pipeline_stage,
      opportunity_type: proj.opportunity_type,
      closing_date: proj.closing_date,
      owner_id: proj.owner_id,
      owner_name: proj.owner_name
    });
    setIsProjectPickerOpen(false);
  };

  // Insert mention into input
  const handleInsertMention = (member: typeof teamMembers[0]) => {
    setInputText(prev => `${prev} @${member.full_name} `);
    if (!selectedMentions.includes(member.id)) {
      setSelectedMentions(prev => [...prev, member.id]);
    }
    setIsMentionPickerOpen(false);
    inputRef.current?.focus();
  };

  // Handle Create Channel Submit
  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelNameAr.trim()) return;

    const newChan = await createChannel(
      newChannelName.trim() || newChannelNameAr.trim(),
      newChannelNameAr.trim(),
      newChannelDesc.trim(),
      newChannelMembers
    );

    setActiveConversationId(newChan.id);
    setIsNewChannelModalOpen(false);
    setNewChannelName('');
    setNewChannelNameAr('');
    setNewChannelDesc('');
    setNewChannelMembers([]);
  };

  // Handle Manager Task Assignment
  const handleAssignTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;

    // Determine target user
    let targetUserId = '';
    if (activeConversation?.type === 'direct') {
      targetUserId = activeConversation.participant_ids.find(id => id !== currentUser.id) || '';
    } else {
      // In channel or unassigned, assign to Abdelrahman or Eslam
      targetUserId = teamMembers.find(t => t.role === 'sales_engineer')?.id || 'u2';
    }

    if (!targetUserId) return;

    const selectedProj = projects.find(p => p.id === assignProjectId);

    await assignTaskFromChatToPlan({
      targetUserId,
      title: assignTitle.trim(),
      clientName: assignClient.trim() || selectedProj?.company_name,
      projectId: assignProjectId || undefined,
      plannedDate: assignDate,
      channel: assignChannel,
      purpose: assignPurpose,
      notes: assignNotes.trim()
    });

    setIsAssignTaskModalOpen(false);
    setAssignTitle('');
    setAssignClient('');
    setAssignProjectId('');
    setAssignNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl h-[88vh] max-h-[780px] bg-white dark:bg-[#1A1F26] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/10 flex overflow-hidden relative"
        data-testid="chat-drawer-container"
      >
        {/* ══════════════════════════════════════════════════════
            LEFT SIDEBAR: Conversation Channels & Direct Messages
            ══════════════════════════════════════════════════════ */}
        <div className="w-72 sm:w-80 border-e border-slate-200 dark:border-white/10 flex flex-col bg-slate-50/70 dark:bg-[#141820]/70 select-none">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <MessagesSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isRTL ? 'المحادثات والتنسيق' : 'Team Collaboration'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUser.full_name}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsNewChannelModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-colors"
              title={isRTL ? 'إنشاء قناة جديدة' : 'New Channel'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute top-2.5 start-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={isRTL ? 'بحث في المحادثات أو الزملاء...' : 'Search channels or team...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs ps-8 pe-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2328] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Tabs: All / Channels / DMs */}
          <div className="flex px-2.5 gap-1 pb-2 border-b border-slate-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 text-[11px] py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex-1 text-[11px] py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'channels'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              {isRTL ? 'القنوات' : 'Channels'}
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 text-[11px] py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'direct'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              {isRTL ? 'الخاص' : 'Direct'}
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.map(conv => {
              const isSelected = activeConversation?.id === conv.id;
              const unread = getConvUnreadCount(conv.id);

              if (conv.type === 'channel') {
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-start p-2 rounded-xl transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Hash className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs truncate font-medium">
                          {isRTL ? (conv.name_ar || conv.name) : (conv.name || conv.name_ar)}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {conv.last_message || (isRTL ? 'لا توجد رسائل حديثة' : 'No messages')}
                        </p>
                      </div>
                    </div>

                    {unread > 0 && (
                      <span className="ms-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-600 text-white font-bold shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              } else {
                const dmInfo = getDMInfo(conv);
                const isOnline = isUserOnline(dmInfo.userId);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-start p-2 rounded-xl transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {dmInfo.initials}
                        </div>
                        <span 
                          className={`absolute bottom-0 end-0 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#1E2328] transition-colors duration-200 ${
                            isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                          }`}
                          title={isOnline ? (isRTL ? 'متصل الآن' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
                        />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs truncate font-medium text-slate-900 dark:text-white">
                            {dmInfo.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {conv.last_message || (isRTL ? 'بدء محادثة جديدة...' : 'Start conversation...')}
                        </p>
                      </div>
                    </div>

                    {unread > 0 && (
                      <span className="ms-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-600 text-white font-bold shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              }
            })}
          </div>

          {/* Quick Direct Message Start with Any Team Member */}
          <div className="p-2 border-t border-slate-200 dark:border-white/10">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-1">
              {isRTL ? 'الزملاء في الفريق' : 'Team Members'}
            </p>
            <div className="flex gap-1 overflow-x-auto py-1">
              {teamMembers.filter(t => t.id !== currentUser.id).map(m => {
                const isOnline = isUserOnline(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      const dm = getOrCreateDM(m.id);
                      setActiveConversationId(dm.id);
                    }}
                    className="flex flex-col items-center p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors shrink-0"
                    title={`${m.full_name} (${isOnline ? (isRTL ? 'متصل الآن' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')})`}
                  >
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center">
                        {m.avatar_initials}
                      </div>
                      <span
                        className={`absolute bottom-0 end-0 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#1E2328] transition-colors duration-200 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 max-w-[48px] truncate">
                      {m.full_name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT PANE: Active Chat Thread & Composition Area
            ══════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1F26] min-w-0">
          {/* Active Conversation Top Bar */}
          <div className="p-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-[#1E2328]/50">
            {activeConversation ? (() => {
              const activeDmInfo = activeConversation.type === 'direct' ? getDMInfo(activeConversation) : null;
              const isActiveDmOnline = activeDmInfo ? isUserOnline(activeDmInfo.userId) : false;

              return (
                <div className="flex items-center gap-3 min-w-0">
                  {activeConversation.type === 'channel' ? (
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Hash className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        {activeDmInfo?.initials}
                      </div>
                      <span
                        className={`absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#1E2328] transition-colors duration-200 ${
                          isActiveDmOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        title={isActiveDmOnline ? (isRTL ? 'متصل الآن' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
                      />
                    </div>
                  )}

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {activeConversation.type === 'channel'
                          ? (isRTL ? (activeConversation.name_ar || activeConversation.name) : (activeConversation.name || activeConversation.name_ar))
                          : activeDmInfo?.name}
                      </h3>
                      {activeConversation.type === 'direct' && activeDmInfo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {activeDmInfo.territory || activeDmInfo.role}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {activeConversation.type === 'channel' ? (
                        activeConversation.description || (isRTL ? 'قناة التنسيق الرسمية' : 'Official coordination channel')
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActiveDmOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span className={isActiveDmOnline ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                            {isActiveDmOnline ? (isRTL ? 'متصل الآن' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>{isRTL ? 'محادثة خاصة' : 'Direct Chat'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {isRTL ? 'مشاركة كارت مشروع (اختر المستلم)' : 'Share Project Card (Select Recipient)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {isRTL ? 'حدد الزميل أو القناة لإرسال كارت المشروع' : 'Choose a colleague or channel to send the project card'}
                  </p>
                </div>
              </div>
            )}

            {/* Top Bar Actions */}
            <div className="flex items-center gap-1.5">
              {/* Manager Assign Task Quick Action */}
              {(currentUser.role === 'sales_manager' || currentUser.role === 'admin') && activeConversation && (
                <button
                  onClick={() => setIsAssignTaskModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  title={isRTL ? 'تكليف بمهمة في خطة المهندس الميدانية' : 'Assign task to rep plan'}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isRTL ? 'تكليف بمهمة' : 'Assign Task'}
                  </span>
                </button>
              )}

              <button
                onClick={closeChat}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                title={isRTL ? 'إغلاق المحادثة' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area OR Recipient Selector Screen */}
          {!activeConversation ? (
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col items-center justify-center text-center animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-sm border border-blue-200 dark:border-blue-900/50">
                <Briefcase className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {isRTL ? 'إلى من تود إرسال كارت هذا المشروع؟' : 'Who would you like to share this project with?'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                {isRTL 
                  ? 'اختر الزميل أو القناة، وسيتم فتح المحادثة فوراً مع إبقاء كارت المشروع مرفقاً بالأسفل لكتابة ملاحظاتك قبل الضغط على إرسال.' 
                  : 'Select a colleague or channel to open the conversation with the project card ready to send.'}
              </p>

              {/* Quick Select Grid */}
              <div className="w-full max-w-md space-y-4 text-start">
                {/* Team Members */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                    {isRTL ? '👥 الزملاء في الفريق' : 'Team Members'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {teamMembers.filter(m => m.id !== currentUser.id).map(m => {
                      const isOnline = isUserOnline(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            const dm = getOrCreateDM(m.id);
                            setActiveConversationId(dm.id);
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 flex items-center gap-2.5 transition-all cursor-pointer group text-start bg-slate-50/50 dark:bg-white/5"
                        >
                          <div className="relative shrink-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {m.avatar_initials}
                            </div>
                            <span
                              className={`absolute bottom-0 end-0 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#1E2328] transition-colors duration-200 ${
                                isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {m.full_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className={isOnline ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                                {isOnline ? (isRTL ? 'متصل' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-slate-400 truncate">
                                {m.territory || m.role}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Channels */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                    {isRTL ? '📢 القنوات العامة' : 'Channels'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {conversations.filter(c => c.type === 'channel').map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveConversationId(c.id)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 flex items-center gap-2 transition-all cursor-pointer group text-start bg-slate-50/50 dark:bg-white/5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                          <Hash className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {isRTL ? (c.name_ar || c.name) : (c.name || c.name_ar)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessagesSquare className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  {isRTL ? 'لا توجد رسائل سابقة في هذه المحادثة' : 'No previous messages'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  {isRTL 
                    ? 'ابدأ بكتابة رسالة أو مشاركة كارت مشروع أو إرسال توجيهات بخصوص الخطة الميدانية'
                    : 'Start by typing a message, sharing a project card, or assigning weekly plan tasks.'}
                </p>
              </div>
            ) : (
              currentMessages.map(msg => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* Sender Info (Only if not me or in channels) */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          {msg.sender_name}
                        </span>
                        <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                          {msg.sender_role}
                        </span>
                      </div>
                    )}

                    {/* Message Body Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-sm text-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-slate-100 dark:bg-[#1E2328] text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/5 rounded-bl-xs'
                      }`}
                    >
                      {/* Text content with @mentions highlighting */}
                      {msg.content && (
                        <p className="leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content.split(' ').map((word, idx) => {
                            if (word.startsWith('@')) {
                              return (
                                <span
                                  key={idx}
                                  className={`inline-block font-bold px-1 rounded mx-0.5 ${
                                    isMe
                                      ? 'bg-white/20 text-white'
                                      : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                  }`}
                                >
                                  {word}{' '}
                                </span>
                              );
                            }
                            return word + ' ';
                          })}
                        </p>
                      )}

                      {/* ══════════════════════════════════════════════
                          EMBEDDED PROJECT CARD (Live & Interactive)
                          ══════════════════════════════════════════════ */}
                      {msg.project_card && (
                        <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-[#141820] border border-blue-200 dark:border-blue-900/50 shadow-md text-slate-900 dark:text-white text-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {msg.project_card.name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">
                              {msg.project_card.pr_number}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                            <div>
                              <span className="text-slate-400 block">{isRTL ? 'العميل' : 'Client'}:</span>
                              <span className="font-semibold">{msg.project_card.company_name || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">{isRTL ? 'القيمة' : 'Value'}:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(msg.project_card.estimated_value)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">{isRTL ? 'المرحلة' : 'Stage'}:</span>
                              <span className="font-medium text-amber-600 dark:text-amber-400 uppercase">
                                {msg.project_card.pipeline_stage}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">{isRTL ? 'تاريخ الإغلاق' : 'Closing'}:</span>
                              <span className="font-medium">{msg.project_card.closing_date || '—'}</span>
                            </div>
                          </div>

                          {/* Project Actions: Smart Access Granting & Cockpit Navigation */}
                          {(() => {
                            const cardProj = projects.find(p => p.id === msg.project_card!.project_id);
                            const projOwnerId = cardProj?.owner_id || msg.project_card!.owner_id;
                            const projMembers = cardProj?.members || [];
                            const isMeOwner = projOwnerId === currentUser.id;
                            const isMeMember = projMembers.some(m => m.user_id === currentUser.id);

                            const otherUserId = activeConversation?.type === 'direct'
                              ? activeConversation.participant_ids.find(id => id !== currentUser.id)
                              : null;
                            const otherUser = otherUserId ? teamMembers.find(t => t.id === otherUserId) : null;
                            const isOtherOwner = otherUserId ? projOwnerId === otherUserId : false;
                            const isOtherMember = otherUserId ? projMembers.some(m => m.user_id === otherUserId) : false;

                            return (
                              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                                {activeConversation?.type === 'direct' && otherUser ? (
                                  // Direct Message logic:
                                  (isMeOwner || currentUser.role === 'sales_manager' || currentUser.role === 'admin') ? (
                                    (isOtherOwner || isOtherMember) ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{isRTL ? `${otherUser.full_name.split(' ')[0]} عضو مصرح له بالمشروع` : `${otherUser.full_name.split(' ')[0]} has access`}</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          await grantProjectAccessFromChat({
                                            messageId: msg.id,
                                            projectId: msg.project_card!.project_id,
                                            targetUserId: otherUser.id,
                                            targetUserName: otherUser.full_name
                                          });
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[10px] transition-colors shadow-sm cursor-pointer"
                                      >
                                        <UserPlus className="w-3 h-3" />
                                        <span>{isRTL ? `+ منح صلاحية لـ ${otherUser.full_name.split(' ')[0]}` : `+ Grant Access to ${otherUser.full_name.split(' ')[0]}`}</span>
                                      </button>
                                    )
                                  ) : (
                                    isMeMember ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{isRTL ? 'أنت عضو مصرح لك في المشروع' : 'You are an authorized member'}</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          await grantProjectAccessFromChat({
                                            messageId: msg.id,
                                            projectId: msg.project_card!.project_id,
                                            targetUserId: currentUser.id,
                                            targetUserName: currentUser.full_name
                                          });
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] transition-colors shadow-sm cursor-pointer"
                                      >
                                        <UserPlus className="w-3 h-3" />
                                        <span>{isRTL ? '+ قبول الصلاحية والانضمام كـ Member' : '+ Accept & Join as Member'}</span>
                                      </button>
                                    )
                                  )
                                ) : (
                                  // Channel logic:
                                  isMeOwner ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold text-[10px] border border-purple-200 dark:border-purple-800">
                                      <Shield className="w-3 h-3" />
                                      <span>{isRTL ? 'أنت مالك هذا المشروع' : 'You own this project'}</span>
                                    </span>
                                  ) : isMeMember ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{isRTL ? 'أنت عضو مصرح لك في المشروع' : 'You are a project member'}</span>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        await grantProjectAccessFromChat({
                                          messageId: msg.id,
                                          projectId: msg.project_card!.project_id,
                                          targetUserId: currentUser.id,
                                          targetUserName: currentUser.full_name
                                        });
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[10px] transition-colors shadow-sm cursor-pointer"
                                    >
                                      <UserPlus className="w-3 h-3" />
                                      <span>{isRTL ? 'الانضمام كـ Member للمشروع' : 'Join as Project Member'}</span>
                                    </button>
                                  )
                                )}

                                <Link
                                  href={`/projects/${msg.project_card!.project_id}`}
                                  onClick={closeChat}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-medium text-[10px] transition-colors cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{isRTL ? 'فتح قمرة المشروع' : 'Open Cockpit'}</span>
                                </Link>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* ══════════════════════════════════════════════
                          EMBEDDED WEEKLY PLAN TASK CARD (Collaboration)
                          ══════════════════════════════════════════════ */}
                      {msg.plan_task_card && (
                        <div className="mt-2.5 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 shadow-md text-slate-900 dark:text-white text-xs">
                          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {isRTL ? 'مهمة في الخطة الميدانية' : 'Weekly Plan Task'}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                msg.plan_task_card.status === 'rescheduled'
                                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                                  : msg.plan_task_card.status === 'acknowledged'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                              }`}
                            >
                              {msg.plan_task_card.status === 'rescheduled'
                                ? (isRTL ? 'تم التأجيل 📅' : 'Rescheduled')
                                : msg.plan_task_card.status === 'acknowledged'
                                ? (isRTL ? 'تم الاطلاع ✓' : 'Acknowledged')
                                : (isRTL ? 'قيد المراجعة' : 'Pending')}
                            </span>
                          </div>

                          <div className="space-y-1 mb-2">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {msg.plan_task_card.title}
                            </p>
                            {msg.plan_task_card.client_name && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                🏢 {msg.plan_task_card.client_name}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                              <span>📅 {msg.plan_task_card.planned_date}</span>
                              <span>👤 {msg.plan_task_card.assigned_to_name}</span>
                            </div>
                          </div>

                          {/* Manager Comment Block */}
                          {msg.plan_task_card.manager_comment && (
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-[#141820]/80 border-s-2 border-amber-500 mb-2.5 text-[11px] text-slate-700 dark:text-slate-200 italic">
                              "{msg.plan_task_card.manager_comment}"
                            </div>
                          )}

                          {/* Actions: Reschedule to next week & Acknowledge */}
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-amber-200 dark:border-amber-900/40">
                            {msg.plan_task_card.status !== 'rescheduled' && (
                              <button
                                onClick={() => reschedulePlanTaskFromChat({
                                  messageId: msg.id,
                                  taskId: msg.plan_task_card!.task_id,
                                  daysToAdd: 7
                                })}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-[10px] transition-colors shadow-sm"
                              >
                                <CalendarClock className="w-3 h-3" />
                                <span>{isRTL ? 'تأجيل للأسبوع القادم (+7 أيام)' : 'Reschedule to Next Week (+7d)'}</span>
                              </button>
                            )}

                            {msg.plan_task_card.status === 'pending' && (
                              <button
                                onClick={() => acknowledgePlanTaskFromChat({
                                  messageId: msg.id,
                                  taskId: msg.plan_task_card!.task_id
                                })}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>{isRTL ? 'تم التأكيد ✓' : 'Acknowledge ✓'}</span>
                              </button>
                            )}

                            <Link
                              href="/my-week"
                              onClick={closeChat}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white text-slate-700 dark:text-slate-300 font-medium text-[10px] transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{isRTL ? 'عرض في خطتي الأسبوعية' : 'View in My Week'}</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
                      {formatChatTime(msg.created_at, isRTL)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

          {/* ══════════════════════════════════════════════════════
              ATTACHMENT PREVIEWS (Project Card ready to send)
              ══════════════════════════════════════════════════════ */}
          {attachedProject && (
            <div className="mx-3.5 mb-1 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 dark:text-white">
                  {attachedProject.name} ({attachedProject.pr_number})
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {formatCurrency(attachedProject.estimated_value)}
                </span>
              </div>
              <button
                onClick={() => setAttachedProject(null)}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              COMPOSITION AREA: Input, Mentions, Projects & Send
              ══════════════════════════════════════════════════════ */}
          <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#1E2328]/40 relative">
            {/* Popover: Mention Team Member */}
            {isMentionPickerOpen && (
              <div className="absolute bottom-16 start-3 w-64 bg-white dark:bg-[#1A1F26] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 p-1.5 z-20 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                  {isRTL ? 'الإشارة لزميل في الفريق' : 'Mention Team Member'}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {teamMembers.map(member => {
                    const isOnline = isUserOnline(member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => handleInsertMention(member)}
                        className="w-full text-start p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 text-xs transition-colors"
                      >
                        <div className="relative shrink-0">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                            {member.avatar_initials}
                          </div>
                          <span
                            className={`absolute bottom-0 end-0 w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-[#1E2328] transition-colors duration-200 ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                          />
                        </div>
                        <div className="truncate min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {member.full_name}
                            </p>
                            <span className={`text-[9px] font-medium ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                              • {isOnline ? (isRTL ? 'متصل' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {member.territory || member.role}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Popover: Project Picker */}
            {isProjectPickerOpen && (
              <div className="absolute bottom-16 start-12 w-80 bg-white dark:bg-[#1A1F26] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 p-2 z-20 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-white/5">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isRTL ? 'إدراج كارت مشروع في المحادثة' : 'Attach Project Card'}</span>
                  </div>
                  <button
                    onClick={() => setIsProjectPickerOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={isRTL ? 'ابحث عن اسم المشروع أو PR...' : 'Search project or PR#...'}
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141820] border border-slate-200 dark:border-white/10 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {projects
                    .filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.pr_number.toLowerCase().includes(projectSearch.toLowerCase()))
                    .slice(0, 10)
                    .map(proj => (
                      <button
                        key={proj.id}
                        onClick={() => handleSelectProject(proj)}
                        className="w-full text-start p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {proj.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {proj.pr_number}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                          <span>{proj.company_name || '—'}</span>
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(proj.estimated_value)}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Active Recipient Indicator when Project is attached */}
            {attachedProject && activeConversation && (
              <div className="mb-2 px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between text-[11px] text-slate-500 animate-in fade-in">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{isRTL ? 'المستلم المحدد:' : 'Recipient:'}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold truncate">
                    {activeConversation.type === 'channel'
                      ? (isRTL ? (activeConversation.name_ar || activeConversation.name) : (activeConversation.name || activeConversation.name_ar))
                      : getDMInfo(activeConversation).name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveConversationId(null)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer shrink-0"
                >
                  {isRTL ? 'تغيير المستلم' : 'Change Recipient'}
                </button>
              </div>
            )}

            {/* Input Row */}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              {/* Quick Actions Buttons */}
              <div className="flex items-center gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setIsMentionPickerOpen(!isMentionPickerOpen)}
                  className={`p-2 rounded-xl transition-colors ${
                    isMentionPickerOpen
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 dark:text-slate-400'
                  }`}
                  title={isRTL ? 'إشارة إلى زميل (@)' : 'Mention colleague (@)'}
                >
                  <AtSign className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsProjectPickerOpen(!isProjectPickerOpen)}
                  className={`p-2 rounded-xl transition-colors ${
                    isProjectPickerOpen || attachedProject
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 dark:text-slate-400'
                  }`}
                  title={isRTL ? 'مشاركة كارت مشروع (#)' : 'Attach Project Card (#)'}
                >
                  <Hash className="w-4 h-4" />
                </button>
              </div>

              {/* Text Input */}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    !activeConversation
                      ? (isRTL ? 'حدد الزميل أو القناة أعلاه لإرسال الرسالة...' : 'Select recipient above to type and send...')
                      : (isRTL
                          ? 'اكتب رسالتك هنا... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)'
                          : 'Type a message... (Press Enter to send, Shift+Enter for new line)')
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141820] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-24"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !attachedProject) || !activeConversation}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                title={
                  !activeConversation 
                    ? (isRTL ? 'يرجى اختيار المستلم أولاً' : 'Please select recipient first') 
                    : (isRTL ? 'إرسال' : 'Send')
                }
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            MODAL 1: Create New Channel
            ══════════════════════════════════════════════════════ */}
        {isNewChannelModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-[#1A1F26] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Hash className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isRTL ? 'إنشاء قناة جديدة' : 'Create New Channel'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsNewChannelModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateChannelSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'اسم القناة بالعربية *' : 'Channel Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مشاريع القطاع الصحي"
                    value={newChannelNameAr}
                    onChange={e => setNewChannelNameAr(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'اسم القناة بالإنجليزية (اختياري)' : 'Channel Name (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Healthcare Projects"
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الوصف' : 'Description'}
                  </label>
                  <input
                    type="text"
                    placeholder="تنسيق عروض الأسعار والاعتمادات لمستشفيات المنطقة"
                    value={newChannelDesc}
                    onChange={e => setNewChannelDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الأعضاء المشاركون' : 'Channel Members'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10">
                    {teamMembers.map(m => {
                      const isChecked = newChannelMembers.includes(m.id) || m.id === currentUser.id;
                      return (
                        <label
                          key={m.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={m.id === currentUser.id}
                            onChange={e => {
                              if (e.target.checked) {
                                setNewChannelMembers(prev => [...prev, m.id]);
                              } else {
                                setNewChannelMembers(prev => prev.filter(id => id !== m.id));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{m.full_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsNewChannelModalOpen(false)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {isRTL ? 'إنشاء القناة' : 'Create Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            MODAL 2: Manager Direct Task Assignment into Weekly Plan
            ══════════════════════════════════════════════════════ */}
        {isAssignTaskModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-[#1A1F26] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isRTL ? 'تكليف مباشر في خطة المهندس الميدانية' : 'Direct Field Task Assignment'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {activeConversation?.type === 'direct'
                        ? (isRTL ? `المكلف: ${getDMInfo(activeConversation).name}` : `Assignee: ${getDMInfo(activeConversation).name}`)
                        : (isRTL ? 'تكليف مهندس مبيعات' : 'Assign Sales Rep')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssignTaskModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssignTaskSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'عنوان التكليف / الهدف الرئيسي *' : 'Task Title / Primary Goal *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مقابلة الاستشاري لمراجعة عينات المحابس والاعتماد"
                    value={assignTitle}
                    onChange={e => setAssignTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isRTL ? 'تاريخ التنفيذ المجدول *' : 'Scheduled Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={assignDate}
                      onChange={e => setAssignDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isRTL ? 'قناة النشاط' : 'Channel'}
                    </label>
                    <select
                      value={assignChannel}
                      onChange={e => setAssignChannel(e.target.value as ActivityChannel)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                    >
                      <option value="visit">{isRTL ? 'زيارة ميدانية' : 'Field Visit'}</option>
                      <option value="call">{isRTL ? 'اتصال هاتفي' : 'Phone Call'}</option>
                      <option value="meeting">{isRTL ? 'اجتماع رسمي' : 'Official Meeting'}</option>
                      <option value="email">{isRTL ? 'بريد إلكتروني' : 'Email'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isRTL ? 'المشروع المرتبط' : 'Linked Project'}
                    </label>
                    <select
                      value={assignProjectId}
                      onChange={e => setAssignProjectId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                    >
                      <option value="">{isRTL ? '-- اختر مشروع (اختياري) --' : '-- Select Project --'}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.pr_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isRTL ? 'اسم العميل / الجهة' : 'Client / Company Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شركة دار الأركان"
                      value={assignClient}
                      onChange={e => setAssignClient(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'ملاحظات وتوجيهات الإدارة' : 'Manager Directives & Notes'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="يرجى التركيز على سرعة الحصول على الاعتماد وتوضيح فترات التوريد."
                    value={assignNotes}
                    onChange={e => setAssignNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#141820] border border-slate-200 dark:border-white/10 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAssignTaskModalOpen(false)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'إدراج التكليف في الخطة وإرسال البطاقة' : 'Assign to Plan & Send Card'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
