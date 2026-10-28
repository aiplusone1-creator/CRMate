import { ChatConversation, ChatMessage, ChatProjectCard, ChatPlanTaskCard, UserRole } from '@/types/crm';

export const INITIAL_CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'chan_west',
    type: 'channel',
    name: 'Western Region Projects',
    name_ar: 'مشاريع المنطقة الغربية',
    description: 'قناة التنسيق والصفقات الميدانية لمشاريع جدة ومكة والمدينة والساحل الغربي',
    participant_ids: ['u1', 'u2', 'u3', 'u4', 'u5'],
    last_message: 'تم اعتماد عينات صمامات التحكم لمشروع برج التحلية',
    last_message_at: '2026-10-24T12:00:00Z',
    last_sender_name: 'Eslam Al-Mohandes',
    created_at: '2026-01-01T08:00:00Z',
    created_by: 'u3'
  },
  {
    id: 'chan_pricing',
    type: 'channel',
    name: 'Pricing & Submittals',
    name_ar: 'التسعير والاعتمادات الفنية',
    description: 'مراجعة عروض الأسعار وجداول الكميات والتنسيق مع مهندسي التسعير',
    participant_ids: ['u1', 'u3', 'u4', 'u5'],
    last_message: 'عرض سعر بترفلاي فالف كاوست V1 تم تسليمه بنجاح',
    last_message_at: '2026-10-24T10:30:00Z',
    last_sender_name: 'Abdurahman Al-Kaffas',
    created_at: '2026-01-01T08:00:00Z',
    created_by: 'u3'
  },
  {
    id: 'dm_u1_u3',
    type: 'direct',
    participant_ids: ['u1', 'u3'],
    last_message: 'بخصوص زيارة مستشفى السلامة المجدولة، يفضل نأجلها للأسبوع الجاي',
    last_message_at: '2026-10-24T14:15:00Z',
    last_sender_name: 'Abdurahman Al-Kaffas',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dm_u1_u2',
    type: 'direct',
    participant_ids: ['u1', 'u2'],
    last_message: 'ممكن تشاركني تفاصيل مشروع مستشفى السلامة للاطلاع؟',
    last_message_at: '2026-10-23T16:00:00Z',
    last_sender_name: 'Abdelrahman Mohamed',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dm_u1_u4',
    type: 'direct',
    participant_ids: ['u1', 'u4'],
    last_message: 'تمت مراجعة التسعير المبدئي',
    last_message_at: '2026-10-24T11:00:00Z',
    last_sender_name: 'Karim Abdelazeez',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dm_u2_u3',
    type: 'direct',
    participant_ids: ['u2', 'u3'],
    last_message: 'يرجى مراجعة الخطة الميدانية للأسبوع القادم',
    last_message_at: '2026-10-24T09:00:00Z',
    last_sender_name: 'Abdurahman Al-Kaffas',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dm_u3_u4',
    type: 'direct',
    participant_ids: ['u3', 'u4'],
    last_message: 'مطلوب إعداد جدول كميات فالفات كاوست',
    last_message_at: '2026-10-24T10:00:00Z',
    last_sender_name: 'Abdurahman Al-Kaffas',
    created_at: '2026-01-01T08:00:00Z'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  // Channel: Western Region
  {
    id: 'msg_w_01',
    conversation_id: 'chan_west',
    sender_id: 'u3',
    sender_name: 'Abdurahman Al-Kaffas',
    sender_role: 'sales_manager',
    content: 'السلام عليكم يا شباب، التركيز الأسبوع ده على حسم مشاريع الربع الرابع وتثبيت التواريخ في جدول الإغلاق.',
    created_at: '2026-10-24T09:00:00Z',
    read_by: ['u1', 'u2', 'u3', 'u4', 'u5']
  },
  {
    id: 'msg_w_02',
    conversation_id: 'chan_west',
    sender_id: 'u1',
    sender_name: 'Eslam Al-Mohandes',
    sender_role: 'sales_engineer',
    content: 'وعليكم السلام م. عبد الرحمن، تم تثبيت مواعيد إغلاق مشاريع In Hand بالكامل في مسار الـ Quarters وجاهز للمتابعة.',
    created_at: '2026-10-24T09:15:00Z',
    read_by: ['u1', 'u3']
  },
  {
    id: 'msg_w_03',
    conversation_id: 'chan_west',
    sender_id: 'u1',
    sender_name: 'Eslam Al-Mohandes',
    sender_role: 'sales_engineer',
    content: 'تم اعتماد عينات صمامات التحكم لمشروع برج التحلية مع المكتب الاستشاري وبانتظار أمر الشراء الرسمي.',
    project_card: {
      project_id: 'p_tahlia_business_park',
      pr_number: 'PR-2026-0018',
      name: 'Al Tahlia Business Park',
      company_name: 'Al Tahlia Commercial Development',
      estimated_value: 5000000,
      pipeline_stage: 'negotiation',
      opportunity_type: 'in_hand',
      closing_date: '2026-11-15',
      owner_name: 'Eslam Mohandes'
    },
    created_at: '2026-10-24T12:00:00Z',
    read_by: ['u1']
  },

  // DM: Abdurahman Al-Kaffas (Manager) & Eslam (u1)
  {
    id: 'msg_dm_01',
    conversation_id: 'dm_u1_u3',
    sender_id: 'u3',
    sender_name: 'Abdurahman Al-Kaffas',
    sender_role: 'sales_manager',
    content: 'أهلاً يا إسلام، ما شاء الله أداء ممتاز في جدول إغلاق صفقات Q4، الـ 18 مشروع وضعهم يبشّر بالخير.',
    created_at: '2026-10-24T13:45:00Z',
    read_by: ['u1', 'u3']
  },
  {
    id: 'msg_dm_02',
    conversation_id: 'dm_u1_u3',
    sender_id: 'u1',
    sender_name: 'Eslam Al-Mohandes',
    sender_role: 'sales_engineer',
    content: 'أهلاً م. عبد الرحمن، تسلم يا رب، شغالين حالياً على حسم صفقة تيسر وصفقة برج التحلية لضمان إغلاقهم في نوفمبر إن شاء الله.',
    created_at: '2026-10-24T14:00:00Z',
    read_by: ['u1', 'u3']
  },
  {
    id: 'msg_dm_03',
    conversation_id: 'dm_u1_u3',
    sender_id: 'u3',
    sender_name: 'Abdurahman Al-Kaffas',
    sender_role: 'sales_manager',
    content: 'بخصوص زيارة مستشفى السلامة المجدولة، يفضل نأجلها للأسبوع الجاي ونركز على حسم صفقة تيسر أولاً، أرسلت لك كارت البلان هنا للتعليق.',
    plan_task_card: {
      task_id: 'plan_task_alsalama',
      title: 'متابعة عرض سعر مستشفى السلامة والاجتماع مع المشتريات',
      client_name: 'Alsalama Hospital',
      project_id: 'p_alsalama',
      planned_date: '2026-10-28',
      channel: 'visit',
      assigned_to_id: 'u1',
      assigned_to_name: 'Eslam Al-Mohandes',
      assigned_by_id: 'u3',
      assigned_by_name: 'Abdurahman Al-Kaffas',
      manager_comment: 'يرجى تأجيل هذه الزيارة للأسبوع القادم للتركيز على حسم صفقة تيسر مع الإدارة التنفيذية.',
      status: 'pending'
    },
    created_at: '2026-10-24T14:15:00Z',
    read_by: ['u3'] // unread for u1!
  },

  // DM: Abdelrahman Mohamed & Eslam (u1)
  {
    id: 'msg_dm2_01',
    conversation_id: 'dm_u1_u2',
    sender_id: 'u2',
    sender_name: 'Abdelrahman Mohamed',
    sender_role: 'sales_engineer',
    content: 'مرحباً م. إسلام، ممكن تشاركني تفاصيل مشروع مستشفى السلامة للاطلاع؟ عندي عميل مشابه في الرياض وعاوز استرشد بأسعار ومواصفات المشروع.',
    created_at: '2026-10-23T16:00:00Z',
    read_by: ['u2'] // unread for u1
  }
];

export function getStoredConversations(): ChatConversation[] {
  if (typeof window === 'undefined') return INITIAL_CHAT_CONVERSATIONS;
  try {
    const raw = localStorage.getItem('crmate_chat_conversations');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load chat conversations', err);
  }
  return INITIAL_CHAT_CONVERSATIONS;
}

export function saveStoredConversations(conversations: ChatConversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('crmate_chat_conversations', JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save chat conversations', err);
  }
}

export function getStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_CHAT_MESSAGES;
  try {
    const raw = localStorage.getItem('crmate_chat_messages');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load chat messages', err);
  }
  return INITIAL_CHAT_MESSAGES;
}

export function saveStoredMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('crmate_chat_messages', JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save chat messages', err);
  }
}

export function formatChatTime(dateStr: string, isRTL: boolean): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const timeStr = d.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) return timeStr;

    const dateFormatted = d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
    return `${dateFormatted} - ${timeStr}`;
  } catch {
    return dateStr;
  }
}
