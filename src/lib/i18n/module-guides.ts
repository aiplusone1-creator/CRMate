export interface GuideSection {
  id: string;
  icon?: string;
  title: string;
  description: string;
  tip?: string;
}

export interface GuideStep {
  stepNumber: number;
  title: string;
  action: string;
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface ModuleGuideContent {
  id: string;
  title: string;
  badge: string;
  summary: string;
  purpose: string;
  targetRoles: string[];
  keySections: GuideSection[];
  dailyWorkflow: GuideStep[];
  faqs: GuideFAQ[];
}

export const MODULE_GUIDES_AR: Record<string, ModuleGuideContent> = {
  dashboard: {
    id: 'dashboard',
    title: 'لوحة المؤشرات والقيادة التنفيذية (Dashboard)',
    badge: 'شركة المسبار العالمي للمقاولات • دليل البداية',
    summary: 'قمرة القيادة اليومية لمتابعة الإنجاز التجاري، والصفقات ذات الأولوية، والمؤشرات المالية المباشرة لمنطقة الغربية.',
    purpose: 'تمكين مهندس المبيعات والمدير من الاطلاع الفوري على صحة خط المبيعات (Pipeline)، وتحديد ما يجب إنجازه اليوم، ومتابعة تحقيق المستهدف الشهري دون تشتت.',
    targetRoles: ['مهندس مبيعات (Sales Engineer)', 'مدير المبيعات (Sales Manager)', 'الإدارة العليا والآدمن (Executive / Admin)'],
    keySections: [
      {
        id: 'what_to_do_today',
        icon: 'Calendar',
        title: 'كارت إجراءات اليوم (What To Do Today - Priorities)',
        description: 'يعرض أهم المهام والمتابعات ذات الأولوية لليوم. الكارت قابل للتمرير (Scroll) لعرض الإجراءات المتبقية، كما يمكنك تغيير حجمه وترتيبه ليتناسب مع أسلوب عملك.',
        tip: 'احرص على ألا ينتهي يومك دون معالجة المهام الحرجة وتحديث حالتها لتجنب تأخر الصفقات.'
      },
      {
        id: 'commercial_kpis',
        icon: 'TrendingUp',
        title: 'مؤشرات الأداء الرئيسية (KPIs)',
        description: 'تشمل إجمالي الصفقات الجارية، القيمة الموزونة المتوقعة، وعدد الزيارات المنفذة، ونسبة الإنجاز من التارجت الشهري للشركة.',
        tip: 'يمكن للمدير تصفية المؤشرات لمندوب محدد أو استعراض أداء الفريق كاملاً من زر نطاق المندوب أعلى الصفحة.'
      },
      {
        id: 'pipeline_distribution',
        icon: 'BarChart3',
        title: 'توزيع خط المبيعات ومسار الصفقات',
        description: 'رسم بياني يوضح أين تتركز مشاريع الشركة حالياً (Lead, RFQ, Pricing, Quotation Sent, Negotiation, Won).',
        tip: 'التركيز على تحريك المشاريع من مرحلة التسعير إلى الإرسال ثم التفاوض هو مفتاح زيادة التحصيل المالي.'
      },
      {
        id: 'dashboard_reorder',
        icon: 'GripVertical',
        title: 'تخصيص وترتيب كروت اللوحة (Customization & Reorder)',
        description: 'يمكنك الضغط على زر "إعادة الترتيب" لسحب وإفلات الكروت وتغيير أحجامها بما يناسب شاشتك، ويقوم النظام بحفظ تفضيلاتك تلقائياً مع ملء الفراغات (Autofill).',
        tip: 'ضع كارت أولويات اليوم والـ Pipeline في أعلى الشاشة للوصول السريع كل صباح.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'مراجعة أولويات الصباح',
        action: 'افتح كارت "إجراءات اليوم" وراجع مواعيد الزيارات والتذكيرات المستحقة اليوم لمشاريع المسبار.'
      },
      {
        stepNumber: 2,
        title: 'فحص تنبيهات التأخير (SLA Alerts)',
        action: 'تأكد من عدم وجود مشاريع باللون الأحمر تتطلب تدخلاً سريعاً قبل نهاية اليوم.'
      },
      {
        stepNumber: 3,
        title: 'تسجيل أي نشاط طارئ',
        action: 'استخدم زر التسجيل السريع (+ Fast Log) من الشريط العلوي لأي اتصال أو اجتماع جديد.'
      }
    ],
    faqs: [
      {
        question: 'كيف أحفظ الترتيب الجديد لكروت لوحة التحكم؟',
        answer: 'بمجرد تعديل حجم أي كارت أو نقله أثناء تفعيل وضع إعادة الترتيب، يقوم النظام بحفظ الشكل النهائي في متصفحك تلقائياً.'
      },
      {
        question: 'هل يرى الموظف الجديد مشاريع زملائه في اللوحة؟',
        answer: 'إذا كان دورك "مهندس مبيعات"، ستشاهد فقط مشاريعك وتارجتك الخاص. أما المدير والآدمن فيمكنهم التبديل لعرض أي مهندس أو كامل الفريق.'
      }
    ]
  },

  projects: {
    id: 'projects',
    title: 'مسار المشاريع والصفقات (Projects & Deals Pipeline)',
    badge: 'شركة المسبار العالمي للمقاولات • خط المبيعات',
    summary: 'إدارة دورة حياة مشاريع التوريدات والمقاولات من استلام كراسة الشروط (RFQ) وحتى توقيع العقد والترسية (Won).',
    purpose: 'ضمان متابعة كل صفقة بدقة وفق المدد المعيارية (SLA)، ومنع ضياع أي فرصة، والتمييز الواضح بين مشاريع المناقصات (Tender) ومشاريع العقود المباشرة (In Hand).',
    targetRoles: ['مهندسو المبيعات', 'مدير المبيعات', 'مهندسو التسعير والعقود'],
    keySections: [
      {
        id: 'kanban_board',
        icon: 'Kanban',
        title: 'لوحة الكانبان التفاعلية (Kanban Pipeline)',
        description: 'أعمدة مرئية تمثل مراحل المشروع (Lead, RFQ Processing, Pricing, Quotation Sent, Negotiation, Won, Lost). يمكنك سحب وإفلات أي مشروع لنقله فورياً لمرحلة جديدة.',
        tip: 'عند سحب مشروع إلى مرحلة "Lost" ستفتح نافذة لتوثيق سبب الخسارة، وعند سحبه إلى "Won" يحتفل النظام بالنجاح!'
      },
      {
        id: 'tender_vs_inhand',
        icon: 'Tag',
        title: 'شارة التمييز بين Tender و In Hand',
        description: 'تظهر أسفل كل كارت في الكانبان والجدول شارة ملونة: الأخضر لمشاريع "In Hand" (المشاريع التي تمت ترسيتها وتوريدها)، والبنفسجي لمشاريع "Tender" (المناقصات قيد الدراسة والتسعير).',
        tip: 'يمكنك الضغط مباشرة على الشارة أسفل الكارت للتبديل الفوري بين Tender و In Hand دون الحاجة لفتح شاشة التعديل!'
      },
      {
        id: 'weighted_forecast',
        icon: 'Sparkles',
        title: 'التوقع المالي الموزون (Weighted Forecast)',
        description: 'يحسب المبيعات الواقعية المتوقعة بضرب القيمة التقديرية لكل مشروع في نسبة احتمالية نجاح مرحلته (مثلاً: مرحلة التفاوض احتمالية نجاحها 80%، بينما الـ RFQ 25%).',
        tip: 'يعتمد مجلس الإدارة على هذا الرقم لمعرفة التدفقات النقدية المتوقعة خلال الربع الحالي.'
      },
      {
        id: 'stage_aging_sla',
        icon: 'Clock',
        title: 'حدود بقاء المشروع في المرحلة (Stage Aging SLA)',
        description: 'لكل مرحلة حد أقصى من الأيام (مثلاً مرحلة التسعير لا يجب أن تتجاوز 7 أيام). إذا اقترب المشروع يظهر تنبيه أصفر، وإذا تأخر يتحول إلى أحمر (Critical Aging).',
        tip: 'المشاريع الحمراء تتطلب اتصالاً فورياً بالمقاول أو الاستشاري لمعرفة أسباب التعطيل.'
      },
      {
        id: 'archive_tab',
        icon: 'Archive',
        title: 'تبويب الأرشيف (Archive Tab & Multi-Role Alerts)',
        description: 'قسم آمن يضم الصفقات التي تم مسحها بواسطة مهندسي المبيعات. لا يتم حذف المشروع نهائياً بل يُحفظ مع توثيق السبب وإرسال إشعار فوري للمدير والآدمن والمشاهد، مع إمكانية استعادته بضغطة زر.',
        tip: 'إذا أردت إلغاء مشروع لا تقلق، استخدم زر المسح وسينتقل بأمان للأرشيف مع إشعار الإدارة.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'فحص عمود التسعير وإرسال العروض',
        action: 'تأكد من إرسال العروض المسعرة في وقتها ونقل البطاقات إلى "Quotation Sent".'
      },
      {
        stepNumber: 2,
        title: 'تحديث حالة المشروع وتاريخ المتابعة',
        action: 'تأكد أن كل مشروع يحتوي على تاريخ متابعة قادم (Next Follow-up Date).'
      },
      {
        stepNumber: 3,
        title: 'مراجعة تصنيف Tender / In Hand',
        action: 'إذا تم تأكيد أمر الشراء لمناقصة، اضغط على الشارة أسفل الكارت لتحويلها إلى In Hand.'
      }
    ],
    faqs: [
      {
        question: 'هل مسح المشروع يحذفه من قاعدة البيانات؟',
        answer: 'لا نهائياً! في نظام شركة المسبار يتم نقله للأرشيف فقط ويصل إشعار للإدارة بالاسم والسبب، ويمكن استعادته في أي لحظة.'
      },
      {
        question: 'كيف أغير طريقة العرض من كانبان إلى جدول؟',
        answer: 'من شريط التبديل أعلى يسار الصفحة، اضغط على زر "جدول" (Table) أو "الأرشيف" (Archive).'
      }
    ]
  },

  project_detail: {
    id: 'project_detail',
    title: 'قمرة قيادة المشروع (Project Cockpit)',
    badge: 'شركة المسبار العالمي للمقاولات • الملف الشامل',
    summary: 'الملف الرقمي المتكامل للمشروع، ويشمل مراجعات عروض الأسعار، طلبات الاعتماد، التذكيرات، وسجل الأنشطة.',
    purpose: 'إدارة تفاصيل المشروع بدقة وتنسيق العمل بين مهندس المبيعات والمكتب الفني وقسم التسعير والإدارة العليا.',
    targetRoles: ['مهندس المشروع', 'مدير المبيعات', 'مهندس التسعير'],
    keySections: [
      {
        id: 'quotation_manager',
        icon: 'FileText',
        title: 'إدارة عروض الأسعار والمراجعات (Quotation Management)',
        description: 'رفع ومتابعة عروض الأسعار بإصدارات مرقمة (V1, V2, V3). يتيح النظام تعديل السعر، مسح العروض المرفوعة بالخطأ، وحساب الضرائب والخصومات، وتوليد مطبوعات رسمية.',
        tip: 'عند تقديم تخفيض جديد للعميل، استخدم خيار "إنشاء مراجعة جديدة" بدلاً من التعديل المباشر لحفظ تاريخ الأسعار.'
      },
      {
        id: 'approval_requests',
        icon: 'ShieldCheck',
        title: 'نظام طلبات الاعتماد (Approval Requests)',
        description: 'إرسال طلب رسمي للإدارة للحصول على اعتماد خصم إضافي (Discount Request) أو مراجعة فنية للمواصفات، مع وصول إشعار فوري لمدير المبيعات.',
        tip: 'اذكر سبب الخصم بوضوح (مثل: ضغط من المقاول لمنافسة مورد محلي) لسرعة اعتماد المدير.'
      },
      {
        id: 'reminders_system',
        icon: 'Bell',
        title: 'تذكيرات المشروع المجدولة',
        description: 'جدولة تذكيرات لمتابعة الاستشاري أو المقاول مع تحديد درجة الأهمية، وتظهر تلقائياً في جرس التنبيهات العلوي.',
        tip: 'ضع تذكيرات محددة بالساعة للمواعيد النهائية لتسليم العروض الفنية.'
      },
      {
        id: 'delete_archive_button',
        icon: 'Trash2',
        title: 'زر مسح ونقل المشروع للأرشيف',
        description: 'ينقل المشروع بأمان للأرشيف مع توثيق السبب وإرسال تنبيه للإدارة، وإذا كان المشروع في الأرشيف يظهر شريط أصفر مع زر استعادة للمسار النشط.',
        tip: 'يمكنك كتابة سبب مخصص أو اختيار أسباب سريعة مثل "ألغى العميل المشروع".'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'التحقق من مرحلة المشروع الحالية',
        action: 'اضغط على شريط المراحل العلوي لنقل المشروع للمرحلة التالية بعد إنجاز متطلباتها.'
      },
      {
        stepNumber: 2,
        title: 'تسجيل مستجدات التواصل',
        action: 'سجل أي اتصال أو اجتماع في سجل الأنشطة المرتبط بالمشروع مع تحديد الإجراء القادم.'
      },
      {
        stepNumber: 3,
        title: 'إرسال عروض الأسعار عبر واتساب',
        action: 'استخدم زر واتساب الذكي لإرسال رسالة رسمية جاهزة للعميل باللغة العربية أو الإنجليزية.'
      }
    ],
    faqs: [
      {
        question: 'كيف أطبع عرض السعر الرسمي بشعار المسبار؟',
        answer: 'من قسم Quotations اضغط على أيقونة الطابعة بجوار العرض لتوليد صفحة رسمية معتمدة جاهزة للطباعة أو التصدير كـ PDF.'
      }
    ]
  },

  my_week: {
    id: 'my_week',
    title: 'خطة الأسبوع والزيارات الميدانية (My Week Plan)',
    badge: 'شركة المسبار العالمي للمقاولات • التخطيط الاستباقي',
    summary: 'أداة التخطيط الاستباقي الأسبوعي لمهندسي المبيعات لجدولة الزيارات الميدانية للمشاريع والمقاولين في منطقة الغربية.',
    purpose: 'تحويل العمل البيعي من رد فعل عشوائي إلى خطة عمل أسبوعية واضحة ومدروسة جغرافياً ومرتبطة بأهداف الشركة.',
    targetRoles: ['مهندسو المبيعات الميدانيين', 'مدير المبيعات للمتابعة والاعتماد'],
    keySections: [
      {
        id: 'weekly_calendar',
        icon: 'CalendarDays',
        title: 'جدول الأيام الخمسة (Sunday - Thursday)',
        description: 'أعمدة منظمة من الأحد إلى الخميس لجدولة الزيارات، مع توزيع أهداف كل يوم، والشركات والمشاريع المستهدفة.',
        tip: 'قم بجدولة زيارات المشاريع المتقاربة جغرافياً (مثل مشاريع جدة أو مكة) في نفس اليوم لتوفير وقت التنقل.'
      },
      {
        id: 'target_visit_kpi',
        icon: 'Target',
        title: 'مستهدف الزيارات الأسبوعي',
        description: 'شريط تتبع يوضح عدد الزيارات المخططة مقارنة بالمستهدف المطلوب من إدارة شركة المسبار (مثلاً 15 زيارة أسبوعياً).',
        tip: 'احرص على اكتمال خطتك الأسبوعية يوم الخميس بحد أقصى للأسبوع القادم.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'تخطيط الأسبوع مساء كل خميس',
        action: 'أضف الزيارات المتوقعة لكل يوم من الأحد إلى الخميس واربط كل زيارة بالمشروع أو المقاول.'
      },
      {
        stepNumber: 2,
        title: 'تحويل الزيارات المخططة إلى منجزة',
        action: 'عند إتمام الزيارة، اضغط على الزيارة لتحويلها فورياً إلى نشاط مكتمل مع تسجيل مخرجات الاجتماع.'
      }
    ],
    faqs: [
      {
        question: 'هل يرى المدير خطتي الأسبوعية؟',
        answer: 'نعم، يمكن لمدير المبيعات متابعة خطط جميع المهندسين واعتمادها ومقارنة المخطط بالمنفذ الفعلي.'
      }
    ]
  },

  my_day: {
    id: 'my_day',
    title: 'مهام اليوم وقمرة التنفيذ الميداني (My Day Cockpit)',
    badge: 'شركة المسبار العالمي للمقاولات • التنفيذ اليومي',
    summary: 'واجهة مركزة وسريعة للمهندس أثناء تواجده الميداني للتركيز التام على مهام اليوم دون تشتت.',
    purpose: 'تمكين المهندس من إنجاز زياراته، والوصول السريع لبيانات العميل وأرقام التواصل، والتوثيق خلال أقل من 20 ثانية.',
    targetRoles: ['مهندس المبيعات'],
    keySections: [
      {
        id: 'today_agenda',
        icon: 'Sun',
        title: 'جدول مواعيد اليوم المرتب زمنياً',
        description: 'قائمة بالمواعيد والزيارات المقررة اليوم، مع أزرار سريعة للاتصال والمراسلة وفتح موقع المشروع على Google Maps.',
        tip: 'اضغط على زر الخريطة للانتقال المباشر للموقع دون الحاجة لإعادة كتابة العنوان.'
      },
      {
        id: 'instant_logging',
        icon: 'CheckCircle2',
        title: 'التوثيق الفوري بنقرة واحدة (Fast Log)',
        description: 'بمجرد انتهاء الاجتماع، اضغط علامة الصح وسجل النتيجة (مهتم، طلب تسعير، متابعة لاحقة) في ثوانٍ.',
        tip: 'التوثيق الفوري يمنع نسيان التفاصيل الفنية الهامة ويوثق جهدك أمام الإدارة فورياً.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'بدء اليوم بمراجعة المسار',
        action: 'افتح My Day في الصباح وتأكد من مواعيد ومواقع العملاء الذين ستزورهم اليوم.'
      },
      {
        stepNumber: 2,
        title: 'التوثيق بعد كل زيارة مباشرة',
        action: 'لا تنتظر حتى نهاية اليوم؛ سجل مخرجات الزيارة فور الخروج من مكتب العميل.'
      }
    ],
    faqs: [
      {
        question: 'ماذا يحدث إذا لم أتمكن من إتمام زيارة اليوم؟',
        answer: 'يمكنك تأجيلها أو إعادة جدولتها ليوم غد بضغطة زر واحدة.'
      }
    ]
  },

  activities: {
    id: 'activities',
    title: 'سجل الأنشطة والمتابعات (Activity Audit Log)',
    badge: 'شركة المسبار العالمي للمقاولات • السجل الميداني',
    summary: 'السجل التاريخي الشامل لكافة الزيارات، الاتصالات، الاجتماعات، والمراسلات التي تمت مع عملاء ومشاريع المسبار.',
    purpose: 'بناء ذاكرة مؤسسية لا تضيع، وتوثيق جهود مهندسي المبيعات، ومتابعة مخرجات الزيارات وقرارات العملاء.',
    targetRoles: ['مهندسو المبيعات', 'مدير المبيعات', 'الإدارة العليا'],
    keySections: [
      {
        id: 'activity_filters',
        icon: 'Filter',
        title: 'الفلترة المتقدمة للأنشطة',
        description: 'تصفية الأنشطة حسب المهندس، أو نوع النشاط (زيارة موقع، اجتماع مكتبي، مكالمة)، أو حسب المشروع والشركة.',
        tip: 'استخدم الفلترة لاستعراض تاريخ علاقة المسبار مع مقاول معين قبل الذهاب لاجتماع هام.'
      },
      {
        id: 'outcomes_tracking',
        icon: 'CheckSquare',
        title: 'مخرجات الأنشطة ومتابعاتها',
        description: 'تسجيل نتيجة كل لقاء والإجراء القادم المطلوب لضمان استمرار متابعة الصفقة.',
        tip: 'الأنشطة التي تنتهي بـ "طلب عرض سعر RFQ" يجب ربطها فورياً بالمشروع المعني.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'مراجعة الأنشطة الأسبوعية',
        action: 'يتأكد المدير والمهندس من تحقيق معدل الاتصالات والزيارات المستهدف أسبوعياً.'
      }
    ],
    faqs: [
      {
        question: 'هل يمكن تعديل نشاط تم تسجيله بالخطأ؟',
        answer: 'نعم، يمكنك الضغط على أيقونة التعديل لتحديث الملاحظات أو مخرجات الاجتماع.'
      }
    ]
  },

  companies_contacts: {
    id: 'companies_contacts',
    title: 'دليل الشركات وجهات الاتصال (Companies & Contacts Directory)',
    badge: 'شركة المسبار العالمي للمقاولات • إدارة العلاقات',
    summary: 'دليل الشركات الشامل (مقاولون رئيسيون، مقاولو كهروميكانيك MEP، استشاريون، ومطورون) وجهات الاتصال الفنية والتجارية.',
    purpose: 'تنظيم قاعدة بيانات عملاء المسبار، وتحديد صناع القرار، والربط التلقائي بين الشركات ومشاريعها وعروض أسعارها.',
    targetRoles: ['مهندسو المبيعات', 'مسؤولو التسويق والعلاقات'],
    keySections: [
      {
        id: 'company_profile',
        icon: 'Building2',
        title: 'ملف الشركة والمشاريع المرتبطة',
        description: 'يعرض تصنيف الشركة، موقعها، الهاتف، وكافة المشاريع الجارية مع شركة المسبار العالمي للمقاولات في مكان واحد.',
        tip: 'قبل زيارة أي مقاول، افتح ملف شركته للاطلاع على كل المشاريع السابقة وقيمتها.'
      },
      {
        id: 'hot_leads',
        icon: 'Flame',
        title: 'جهات الاتصال الساخنة (Hot Leads)',
        description: 'تمييز صناع القرار والمهندسين النشطين حالياً في مشاريع كبرى لمتابعتهم بأولوية قصوى.',
        tip: 'استخدم زر واتساب المباشر من كارت جهة الاتصال لبدء محادثة رسمية فورية.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'إضافة جهات الاتصال الجديدة',
        action: 'عند استلام بطاقة عمل (Business Card) من استشاري أو مدير مشروع، سجل بياناته فورياً في النظام.'
      }
    ],
    faqs: [
      {
        question: 'هل تتكرر جهات الاتصال إذا ربطتها بأكثر من مشروع؟',
        answer: 'لا، جهة الاتصال يتم حفظها مرة واحدة وربطها بالشركة أو المشاريع بكل سهولة.'
      }
    ]
  },

  reports: {
    id: 'reports',
    title: 'التقارير التحليلية التنفيذية (Executive Reports & Analytics)',
    badge: 'شركة المسبار العالمي للمقاولات • التقارير الاستراتيجية',
    summary: 'تحليلات الأداء الشاملة لشركة المسبار: قياس تحقيق التارجت، سرعة إغلاق الصفقات، وتحليل أداء مهندسي المبيعات.',
    purpose: 'تزويد الإدارة العليا ببيانات دقيقة لاتخاذ قرارات استراتيجية مبنية على الأرقام الحقيقية للسوق والمشاريع.',
    targetRoles: ['مدير المبيعات', 'المدير العام والآدمن', 'المشرفون'],
    keySections: [
      {
        id: 'target_vs_actual',
        icon: 'BarChart2',
        title: 'المستهدف مقابل المحقق (Target vs Actual)',
        description: 'مقارنة دقيقة بين المستهدف المالي الشهري والسنوي وما تم إغلاقه وتحصيله فعلياً من صفقات.',
        tip: 'يساعد هذا التقرير في تقييم أداء كل مهندس مبيعات ومكافآت الإنجاز.'
      },
      {
        id: 'pipeline_velocity',
        icon: 'Zap',
        title: 'سرعة وكفاءة خط المبيعات (Pipeline Velocity)',
        description: 'يقيس متوسط عدد الأيام التي يستغرقها المشروع للانتقال من مرحلة RFQ إلى الفوز بالعقد (Won).',
        tip: 'كلما قلت مدة المرحلة، زادت سرعة دوران رأس المال وتحصيل مستحقات التوريد.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'المراجعة الشهرية والربع سنوية',
        action: 'تصدير التقارير ومناقشتها في الاجتماع التجاري الدوري لإدارة شركة المسبار.'
      }
    ],
    faqs: [
      {
        question: 'هل يمكن طباعة التقارير أو تصديرها كـ Excel؟',
        answer: 'نعم، يدعم النظام استخراج البيانات وتصدير مؤشرات الأداء وجداول الصفقات.'
      }
    ]
  }
};

export const MODULE_GUIDES_EN: Record<string, ModuleGuideContent> = {
  dashboard: {
    id: 'dashboard',
    title: 'Executive Dashboard & Cockpit',
    badge: 'Al-Mespar Global Contracting • Onboarding Guide',
    summary: 'Daily commercial cockpit for tracking sales execution, priority actions, and live financial KPIs for Western Region projects.',
    purpose: 'Enables sales engineers and managers to instantly assess pipeline health, execute daily priorities, and hit monthly corporate targets without distraction.',
    targetRoles: ['Sales Engineer', 'Sales Manager', 'Executive Admin'],
    keySections: [
      {
        id: 'what_to_do_today',
        icon: 'Calendar',
        title: 'What To Do Today Card (Priority Actions)',
        description: 'Displays prioritized appointments, scheduled follow-ups, and urgent project actions for today. Features an internal scroll to view all items and can be resized and repositioned.',
        tip: 'Never conclude your workday with critical overdue actions remaining; keeping this clear prevents deal slippage.'
      },
      {
        id: 'commercial_kpis',
        icon: 'TrendingUp',
        title: 'Commercial Executive KPIs',
        description: 'Shows live gross pipeline, weighted sales forecast, logged visits count, and target achievement percentage.',
        tip: 'Managers can filter KPIs by specific sales engineer or inspect total team performance using the scope pill at the top.'
      },
      {
        id: 'pipeline_distribution',
        icon: 'BarChart3',
        title: 'Pipeline Distribution & Stages Flow',
        description: 'Visual distribution chart showing where deals are currently concentrated across pipeline stages.',
        tip: 'Focus on advancing deals from pricing into quotation sent and negotiation to drive immediate cashflow.'
      },
      {
        id: 'dashboard_reorder',
        icon: 'GripVertical',
        title: 'Dashboard Customization & Layout Autofill',
        description: 'Click the "Reorder" button to drag and drop cards or resize them. The system automatically saves your layout and autofills blank spaces.',
        tip: 'Position priority actions and the pipeline ribbon at the very top for rapid morning access.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Inspect Morning Priorities',
        action: 'Open What To Do Today and check scheduled site meetings and due reminders.'
      },
      {
        stepNumber: 2,
        title: 'Review Stage SLA Aging Alerts',
        action: 'Identify red-flagged deals requiring prompt consultant or contractor interventions.'
      },
      {
        stepNumber: 3,
        title: 'Log Ad-Hoc Commercial Activities',
        action: 'Use the top header Fast Log button (+ Fast Log) to record phone calls and client discussions in under 20s.'
      }
    ],
    faqs: [
      {
        question: 'How does the dashboard save my customized layout?',
        answer: 'Once you adjust any card position or size in reorder mode, changes persist automatically in your browser storage.'
      },
      {
        question: 'Do new sales engineers see other colleagues deals on their dashboard?',
        answer: 'Sales engineers strictly view their assigned deals and targets. Managers and Admins can toggle scopes anytime.'
      }
    ]
  },

  projects: {
    id: 'projects',
    title: 'Projects & Commercial Deals Pipeline',
    badge: 'Al-Mespar Global Contracting • Deals Pipeline',
    summary: 'Full lifecycle management of contracting and supply deals from RFQ receipt through quotation submittal and contract award (Won).',
    purpose: 'Enforces rigorous stage SLA aging limits, safeguards revenue forecasting, and maintains clear distinction between Tender packages and In Hand contracts.',
    targetRoles: ['Sales Engineers', 'Commercial Sales Manager', 'Estimation Engineers'],
    keySections: [
      {
        id: 'kanban_board',
        icon: 'Kanban',
        title: 'Interactive Kanban Pipeline Board',
        description: 'Visual columns representing lifecycle stages (Lead, RFQ Processing, Pricing, Quotation Sent, Negotiation, Won, Lost). Drag and drop cards to update stages in real time.',
        tip: 'Dropping a card onto "Lost" prompts a mandatory loss reason, while dropping onto "Won" triggers corporate fanfare!'
      },
      {
        id: 'tender_vs_inhand',
        icon: 'Tag',
        title: 'Tender vs In Hand Deal Badges',
        description: 'Color-coded badge at the bottom of each deal card: Emerald for "In Hand" (awarded/direct order packages) and Indigo for "Tender" (active bidding competitions).',
        tip: 'Click directly on the badge at the bottom of any card to instantly toggle between Tender and In Hand!'
      },
      {
        id: 'weighted_forecast',
        icon: 'Sparkles',
        title: 'Weighted Commercial Forecast',
        description: 'Calculates realistic cash flow by multiplying baseline estimated values by each stage probability factor (e.g. Negotiation = 80%, RFQ = 25%).',
        tip: 'Al-Mespar executive leadership relies on this figure to plan procurement credit and supplier allocations.'
      },
      {
        id: 'stage_aging_sla',
        icon: 'Clock',
        title: 'Stage Aging SLA & Bottleneck Alerts',
        description: 'Each stage has an allowable timeframe (e.g. Pricing SLA is 7 days). Deals approaching the threshold turn yellow; overdue deals turn critical red.',
        tip: 'Red deals demand immediate contractor follow-up to unblock approvals or clarify tender specs.'
      },
      {
        id: 'archive_tab',
        icon: 'Archive',
        title: 'Archive Tab & Multi-Role Safety Alerts',
        description: 'Dedicated soft-delete repository. When a sales engineer deletes a project, it is safely moved here with reasons logged and instant alerts sent to Manager, Admin, and Viewer.',
        tip: 'Deals in the archive can be restored to active pipeline with a single click at any time.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Audit Pricing & Quotation Sent Columns',
        action: 'Ensure newly priced estimates are promptly dispatched to contractors and cards moved to Quotation Sent.'
      },
      {
        stepNumber: 2,
        title: 'Verify Next Follow-up Dates',
        action: 'Guarantee every active deal card has a future follow-up date and next action clearly recorded.'
      },
      {
        stepNumber: 3,
        title: 'Update Tender / In Hand Status',
        action: 'Once a tender submittal converts into an awarded package, toggle the badge to In Hand.'
      }
    ],
    faqs: [
      {
        question: 'Does deleting a project permanently destroy data?',
        answer: 'Never! In Al-Mespar CRM, projects are moved to the Archive tab, management is notified, and projects remain restorable.'
      },
      {
        question: 'How do I toggle between Kanban, Table, and Archive views?',
        answer: 'Use the view mode switcher pills at the top right of the projects module (Kanban | Table | Archive).'
      }
    ]
  },

  project_detail: {
    id: 'project_detail',
    title: 'Project Cockpit & Detailed Dossier',
    badge: 'Al-Mespar Global Contracting • Deal Dossier',
    summary: 'The 360-degree digital workspace for an individual deal, encompassing quotation versioning, approval requests, reminders, and client comms.',
    purpose: 'Coordinates precision execution between sales engineers, technical estimators, and senior management.',
    targetRoles: ['Project Sales Engineer', 'Commercial Manager', 'Lead Estimator'],
    keySections: [
      {
        id: 'quotation_manager',
        icon: 'FileText',
        title: 'Quotation Management & Version History',
        description: 'Upload and track commercial quotations with clean auto-incrementing versions (V1, V2, V3). Allows price editing, deleting erroneous drafts, tax calculations, and official printable sheets.',
        tip: 'Always create a new revision when offering revised discounts to preserve client price history.'
      },
      {
        id: 'approval_requests',
        icon: 'ShieldCheck',
        title: 'Approval Requests System',
        description: 'Request formal manager sign-off for extra commercial discounts or non-standard technical submittals with instant notifications delivered to management.',
        tip: 'Clearly state commercial rationale (e.g. contractor counter-offer) to expedite managerial approval.'
      },
      {
        id: 'reminders_system',
        icon: 'Bell',
        title: 'Scheduled Project Reminders',
        description: 'Set reminders for consultant submittals or contractor tender submissions with urgency indicators linked to the header notifications bell.',
        tip: 'Set explicit reminder times for tender closing deadlines to prevent submission delays.'
      },
      {
        id: 'delete_archive_button',
        icon: 'Trash2',
        title: 'Delete & Archive Action',
        description: 'Safely relocates project to archive with reasons logged and alerts sent. If viewed while archived, an archive alert banner with restore button is shown.',
        tip: 'Select quick reasons such as "Client Cancelled Project" or enter custom remarks.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Advance Pipeline Milestones',
        action: 'Click the stage progress ribbon to move the project forward as milestones are achieved.'
      },
      {
        stepNumber: 2,
        title: 'Log Commercial Engagements',
        action: 'Record phone and face-to-face feedback in the project activity stream with follow-up targets.'
      },
      {
        stepNumber: 3,
        title: 'Dispatch WhatsApp Commercial Follow-ups',
        action: 'Use the WhatsApp button to send polished, pre-formatted follow-ups in Arabic or English.'
      }
    ],
    faqs: [
      {
        question: 'How do I generate an official printable quote with Al-Mespar corporate seal?',
        answer: 'In the Quotation Management section, click the printer icon next to any quotation to open the print-ready sheet.'
      }
    ]
  },

  my_week: {
    id: 'my_week',
    title: 'Weekly Visit Planner & Territory Routing',
    badge: 'Al-Mespar Global Contracting • Proactive Planning',
    summary: 'Proactive weekly scheduling system for field sales engineers to organize client meetings and jobsite inspections across Western Region territories.',
    purpose: 'Transforms commercial sales from ad-hoc reaction into structured, route-optimized weekly execution tied to corporate revenue quotas.',
    targetRoles: ['Field Sales Engineers', 'Sales Manager'],
    keySections: [
      {
        id: 'weekly_calendar',
        icon: 'CalendarDays',
        title: 'Sunday to Thursday Workweek Grid',
        description: 'Structured day columns to schedule customer meetings, consultant presentations, and contractor office visits.',
        tip: 'Group geographically proximate visits (e.g. Jeddah North vs Makkah) on the same day to minimize transit times.'
      },
      {
        id: 'target_visit_kpi',
        icon: 'Target',
        title: 'Weekly Target Visits Meter',
        description: 'Live progress bar comparing planned and completed client meetings against Al-Mespar weekly standards (e.g. 15 visits/week).',
        tip: 'Complete and lock your weekly plan every Thursday afternoon for the upcoming week.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Plan Weekly Route Every Thursday',
        action: 'Add scheduled customer meetings for each day from Sunday to Thursday, linked to specific project records.'
      },
      {
        stepNumber: 2,
        title: 'Complete Planned Activities Post-Meeting',
        action: 'Click any scheduled visit card to complete it, logging meeting outcomes and next actions.'
      }
    ],
    faqs: [
      {
        question: 'Does the manager review my weekly schedule?',
        answer: 'Yes, sales leadership reviews planned versus executed visits to provide commercial support and coaching.'
      }
    ]
  },

  my_day: {
    id: 'my_day',
    title: 'Daily Field Cockpit (My Day)',
    badge: 'Al-Mespar Global Contracting • Daily Execution',
    summary: 'Streamlined mobile-friendly daily agenda for sales engineers on the road to focus strictly on today encounters without interface noise.',
    purpose: 'Empowers engineers to navigate directly to jobsites, initiate calls with one tap, and log visit results in under 20 seconds.',
    targetRoles: ['Sales Engineers on the Road'],
    keySections: [
      {
        id: 'today_agenda',
        icon: 'Sun',
        title: 'Chronological Day Schedule',
        description: 'Ordered appointments with direct call, WhatsApp, and Google Maps location routing buttons.',
        tip: 'Tap the Maps icon to open GPS navigation directly to the client facility or project site.'
      },
      {
        id: 'instant_logging',
        icon: 'CheckCircle2',
        title: 'One-Tap Fast Activity Logging',
        description: 'Complete meetings immediately after leaving the site and capture outcomes (Quotation Requested, Follow-up, etc.) in seconds.',
        tip: 'Immediate logging prevents missing crucial engineering specs and validates daily effort to leadership.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Launch My Day at 8:00 AM',
        action: 'Review scheduled meetings, key contact numbers, and site locations.'
      },
      {
        stepNumber: 2,
        title: 'Log Outcomes Immediately Post-Meeting',
        action: 'Do not postpone logging until end-of-day; record client feedback before driving to your next stop.'
      }
    ],
    faqs: [
      {
        question: 'What if a client reschedules today meeting?',
        answer: 'Easily reschedule or shift the visit to tomorrow with one click from the action menu.'
      }
    ]
  },

  activities: {
    id: 'activities',
    title: 'Activities Audit Log & Interaction History',
    badge: 'Al-Mespar Global Contracting • Audit Trail',
    summary: 'Comprehensive chronological audit trail of all customer visits, technical meetings, calls, and email submissions.',
    purpose: 'Builds permanent institutional memory for Al-Mespar client accounts and provides transparent proof of customer engagement.',
    targetRoles: ['Sales Engineers', 'Commercial Sales Manager', 'Executive Leadership'],
    keySections: [
      {
        id: 'activity_filters',
        icon: 'Filter',
        title: 'Multi-Dimension Activity Filters',
        description: 'Filter interactions by engineer, channel (site visit, office meeting, phone call), company, or linked deal.',
        tip: 'Review historical contractor interactions before attending high-stakes pricing negotiations.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Weekly Activity Review',
        action: 'Inspect activity logs to ensure all key contractor engagements have clearly defined follow-up actions.'
      }
    ],
    faqs: [
      {
        question: 'Can I edit an activity logged with incorrect information?',
        answer: 'Yes, click the edit icon on any activity record to update notes or outcome details.'
      }
    ]
  },

  companies_contacts: {
    id: 'companies_contacts',
    title: 'Companies & Key Decision Makers Directory',
    badge: 'Al-Mespar Global Contracting • Account Directory',
    summary: 'Centralized directory of contracting firms, MEP contractors, consultants, and developers, alongside verified contact persons.',
    purpose: 'Maintains verified organizational records and maps stakeholders to active project opportunities and historical quotes.',
    targetRoles: ['Sales Engineers', 'Commercial Department'],
    keySections: [
      {
        id: 'company_profile',
        icon: 'Building2',
        title: 'Company Profile & Linked Projects',
        description: 'Displays organization details, geographic location, linked contacts, and all historical Al-Mespar tenders in one hub.',
        tip: 'Review past award history and payment terms before submitting quotations to new contractors.'
      },
      {
        id: 'hot_leads',
        icon: 'Flame',
        title: 'Hot Leads & Priority Contacts',
        description: 'Flags active decision-makers currently evaluating major tender packages for prioritized outreach.',
        tip: 'Use the integrated WhatsApp button for direct, polite commercial introductions.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Record Fresh Business Cards',
        action: 'Whenever you receive a business card from a consultant or contractor, enter their profile immediately.'
      }
    ],
    faqs: [
      {
        question: 'Are contacts duplicated if linked across multiple projects?',
        answer: 'No, contacts are maintained once under their company and seamlessly referenced across multiple projects.'
      }
    ]
  },

  reports: {
    id: 'reports',
    title: 'Executive Commercial Reports & Sales Intelligence',
    badge: 'Al-Mespar Global Contracting • Intelligence Reports',
    summary: 'Executive analytics measuring target achievement, commercial pipeline velocity, and sales engineer closing ratios.',
    purpose: 'Furnishes executive leadership with empirical data to steer commercial strategy, commission bonuses, and supplier commitments.',
    targetRoles: ['Sales Manager', 'Executive General Manager', 'Board of Directors'],
    keySections: [
      {
        id: 'target_vs_actual',
        icon: 'BarChart2',
        title: 'Target Quota vs Actual Won Revenue',
        description: 'Calculates performance ratios comparing monthly targets against actual won commercial value.',
        tip: 'Used in monthly executive reviews to calibrate regional territory quotas.'
      },
      {
        id: 'pipeline_velocity',
        icon: 'Zap',
        title: 'Pipeline Cycle Velocity',
        description: 'Measures average calendar days elapsed from RFQ logging to commercial award sign-off.',
        tip: 'Shorter cycle times indicate healthy contractor relationships and responsive technical submittals.'
      }
    ],
    dailyWorkflow: [
      {
        stepNumber: 1,
        title: 'Monthly Performance Review',
        action: 'Export analytics to present at Al-Mespar monthly commercial strategy meeting.'
      }
    ],
    faqs: [
      {
        question: 'Can reports be exported to Excel or printed?',
        answer: 'Yes, tables and KPI reports support direct printing and spreadsheet downloads.'
      }
    ]
  }
};

/**
 * Helper to get the correct guide content based on pathname and language
 */
export function getModuleGuideByPath(pathname: string, language: 'ar' | 'en' = 'ar'): ModuleGuideContent {
  const dict = language === 'ar' ? MODULE_GUIDES_AR : MODULE_GUIDES_EN;

  if (!pathname || pathname === '/') {
    return dict['dashboard'];
  }

  if (pathname.startsWith('/projects/') && pathname !== '/projects') {
    return dict['project_detail'];
  }

  if (pathname.startsWith('/projects')) {
    return dict['projects'];
  }

  if (pathname.startsWith('/my-week')) {
    return dict['my_week'];
  }

  if (pathname.startsWith('/my-day')) {
    return dict['my_day'];
  }

  if (pathname.startsWith('/activities')) {
    return dict['activities'];
  }

  if (pathname.startsWith('/companies') || pathname.startsWith('/contacts')) {
    return dict['companies_contacts'];
  }

  if (pathname.startsWith('/reports')) {
    return dict['reports'];
  }

  // Fallback to dashboard
  return dict['dashboard'];
}
