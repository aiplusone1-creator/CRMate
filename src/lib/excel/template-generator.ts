import * as XLSX from 'xlsx';

/**
 * Al-Mespar CRM - Standard / Ideal Excel Workbook Template Generator
 * Generates an official, perfectly formatted Excel workbook that team members can fill out
 * and upload into the CRM with zero validation or mapping errors.
 */

export function generateIdealTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ---------------------------------------------------------------------------
  // 1. Projects Follow UP Sheet
  // ---------------------------------------------------------------------------
  const projectsHeaders = [
    '#PR',
    'Opportunity',
    'Client Name',
    'Client Phone Number',
    'Company Name',
    'Client Email',
    'Project Stage',
    'Project Location',
    'Status',
    'Est. value (SAR)',
    'Action Done',
    'Action Date',
    'Current Follow Up',
    'Current Follow Up Date'
  ];

  const sampleProjects = [
    [
      'PR-1001',
      'فندق الأندلس ريزيدنس - توريد وتركيب محابس ومضخات',
      'م. خالد العتيبي',
      '+966501234567',
      'شركة الإنشاءات الحديثة للمقاولات',
      'khaled@modernconst.sa',
      'In Hand',
      'Jeddah',
      'Send to Client',
      450000,
      'تم إرسال عرض السعر الفني والمالي وننتظر الرد',
      '2026-10-20',
      'متابعة مهندس المشتريات لتأكيد موعد الترسية',
      '2026-10-28'
    ],
    [
      'PR-1002',
      'مشروع مستشفى السلامة التخصصي - نظام التحكم الآلي BMS',
      'م. طارق العمري',
      '+966559876543',
      'مجموعة المباني الكبرى',
      't.omari@almbani.com',
      'Tender',
      'Riyadh',
      'RFQ Processing',
      820000,
      'استلام جدول الكميات BOQ وجاري دراسته وتسعيره',
      '2026-10-22',
      'تسليم العرض المالي قبل موعد إغلاق المناقصة',
      '2026-10-30'
    ]
  ];

  const wsProjects = XLSX.utils.aoa_to_sheet([projectsHeaders, ...sampleProjects]);

  // Set column widths for optimal readability
  wsProjects['!cols'] = [
    { wch: 12 }, // #PR
    { wch: 45 }, // Opportunity
    { wch: 22 }, // Client Name
    { wch: 20 }, // Client Phone
    { wch: 32 }, // Company Name
    { wch: 25 }, // Client Email
    { wch: 16 }, // Project Stage
    { wch: 16 }, // Location
    { wch: 18 }, // Status
    { wch: 18 }, // Est. Value
    { wch: 40 }, // Action Done
    { wch: 14 }, // Action Date
    { wch: 40 }, // Follow Up
    { wch: 14 }  // Follow Up Date
  ];

  XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects Follow UP');

  // ---------------------------------------------------------------------------
  // 2. Hot Leads Sheet
  // ---------------------------------------------------------------------------
  const hotLeadsHeaders = [
    'Name',
    'Phone',
    'Company',
    'Position',
    'Company Based on',
    'Email',
    'Google Map Location',
    'Last Call Date',
    'Notes',
    'Next Follow Up Notes',
    'Next Follow Up Date'
  ];

  const sampleHotLeads = [
    [
      'م. فيصل الغامدي',
      '+966567890123',
      'شركة الرواسي القابضة',
      'Procurement Manager',
      'Jeddah',
      'faisal@alrawasi.sa',
      'https://maps.app.goo.gl/example',
      '2026-10-21',
      'عميل مهتم جداً بمنتجات المحابس والمواصفات المعتمدة لمشاريع جدة',
      'الاتصال لتنسيق زيارة مقر الشركة وتقديم الكتالوجات الرسمية',
      '2026-10-27'
    ]
  ];

  const wsHotLeads = XLSX.utils.aoa_to_sheet([hotLeadsHeaders, ...sampleHotLeads]);
  wsHotLeads['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 30 },
    { wch: 22 },
    { wch: 18 },
    { wch: 25 },
    { wch: 30 },
    { wch: 14 },
    { wch: 45 },
    { wch: 45 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, wsHotLeads, 'Hot Leads');

  // ---------------------------------------------------------------------------
  // 3. Master Report Sheet (Activities)
  // ---------------------------------------------------------------------------
  const activitiesHeaders = [
    'Date',
    'Opportunity',
    'Contact',
    'Type',
    'Visit Type',
    'Project Stage',
    'Project Status',
    'Project Location',
    'Action',
    'Follow Up Date',
    'Follow Up Action'
  ];

  const sampleActivities = [
    [
      '2026-10-24',
      'فندق الأندلس ريزيدنس',
      'م. خالد العتيبي',
      'Call',
      'Follow up',
      'In Hand',
      'Send to Client',
      'Jeddah',
      'تم الاتصال والتأكيد على مطابقة المواصفات الفنية المعتمدة',
      '2026-10-28',
      'اجتماع مباشر بموقع المشروع'
    ]
  ];

  const wsActivities = XLSX.utils.aoa_to_sheet([activitiesHeaders, ...sampleActivities]);
  wsActivities['!cols'] = [
    { wch: 14 },
    { wch: 35 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 45 },
    { wch: 14 },
    { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(wb, wsActivities, 'Master Report');

  // ---------------------------------------------------------------------------
  // 4. Data Validation Guidelines Sheet
  // ---------------------------------------------------------------------------
  const validationData = [
    ['قواعد وإرشادات تعبئة شيت المبيعات المعتمد - Al-Mespar CRM Data Guidelines', '', '', '', ''],
    ['', '', '', '', ''],
    ['حقل نوع الفرصة (Project Stage)', 'حقل حالة المشروع (Status)', 'المدن والمناطق المعتمدة (Location)', 'قنوات التواصل (Activity Type)', 'شروط هامة لمنع التكرار والأخطاء'],
    ['In Hand (مشروع قائم / بين يديك)', 'Gather Info. (جمع معلومات ومتطلبات)', 'Jeddah (جدة)', 'Call (مكالمة هاتفية)', '1. كود المشروع #PR يجب أن يكون فريداً لكل مشروع لمنع تكراره'],
    ['Tender (مناقصة قيد التسعير)', 'RFQ Processing (دراسة وتجهيز كوتيشن)', 'Riyadh (الرياض)', 'F2F Meeting (اجتماع حضوري)', '2. أرقام الهواتف يُفضل أن تبدأ بـ +966 أو 05'],
    ['New Lead (فرصة أو عميل جديد)', 'Pricing (تسعير الـ BOQ)', 'Makkah (مكة المكرمة)', 'Online Meeting (اجتماع أونلاين)', '3. التواريخ بصيغة YYYY-MM-DD أو DD/MM/YYYY'],
    ['Retrofit / Upgrade (تحديث وتطوير)', 'Send to Client (تم تسليم العرض للعميل)', 'Madinah (المدينة المنورة)', 'Visit (زيارة موقع / مكتب)', '4. القيمة التقديرية أرقام فقط بالريال السعودي'],
    ['', 'Technical Submission (اعتماد فني لدى الاستشاري)', 'Dammam (الدمام)', 'Email (مراسلة بريد إلكتروني)', '5. في حال تكرار نفس كود PR يقوم النظام بتحديث المشروع تلقائياً'],
    ['', 'Negotiation (مفاوضات نهائية على السعر)', 'Khobar (الخبر)', '', ''],
    ['', 'Won (تم التعميد الرسمي والفوز بالصفقة)', 'Neom (نيوم)', '', ''],
    ['', 'Lost (تم إغلاق المشروع / خسارة)', 'Tabuk (تبوك)', '', ''],
    ['', 'Hold (مشروع معلق مؤقتاً)', 'Yanbu (ينبع)', '', '']
  ];

  const wsValidation = XLSX.utils.aoa_to_sheet(validationData);
  wsValidation['!cols'] = [
    { wch: 35 },
    { wch: 38 },
    { wch: 28 },
    { wch: 28 },
    { wch: 55 }
  ];

  XLSX.utils.book_append_sheet(wb, wsValidation, 'Data Validation');

  return wb;
}

/**
 * Triggers a direct client-side download of the Ideal Excel Template
 */
export function downloadIdealTemplateFile(): void {
  if (typeof window === 'undefined') return;

  const wb = generateIdealTemplateWorkbook();
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Al-Mespar-CRM-Standard-Template.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
