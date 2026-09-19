export type Language = 'en' | 'ar';

export interface Translations {
  // Brand & Slogan
  appName: string;
  appSubtitle: string;
  appTagline: string;
  companyName: string;
  ksaCloud: string;

  // Navigation
  navDashboard: string;
  navProjects: string;
  navCompanies: string;
  navContacts: string;
  navMyWeek: string;
  navMyDay: string;
  navActivities: string;
  navReports: string;
  navImport: string;
  navSettings: string;

  // Login Page
  signInTitle: string;
  signInSubtitle: string;
  selectAccountPrompt: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMe: string;
  signInButton: string;
  verifyingSession: string;
  shaProtected: string;
  enterpriseRbac: string;
  loginFailed: string;
  sessionExpiredTitle: string;
  sessionExpiredDesc: string;
  invalidEmail: string;
  invalidPassword: string;
  inactiveUser: string;
  generalLoginError: string;

  // Common UI Actions
  searchPlaceholder: string;
  allTeam: string;
  filterByRep: string;
  notifications: string;
  profile: string;
  logout: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  add: string;
  view: string;
  print: string;
  exportBackup: string;
  restoreBackup: string;

  // Cockpit & Dashboard
  quickCreate: string;
  newProject: string;
  newContact: string;
  fastLogActivity: string;
  importExcelSheet: string;
  viewingScope: string;
  salesRepScope: string;
  activeDeals: string;
  pipelineValue: string;
  quotationValue: string;
  wonValue: string;
  overdueDeals: string;
  prospectsAndLeads: string;
  nextAction: string;
  estimatedValue: string;
  urgentActionRequired: string;
  dueSoon: string;
  healthy: string;
  daysLate: string;
  monthlyTarget: string;
  winRate: string;
  dealsCount: string;
  audit: string;
  leaderboardTitle: string;
  leaderboardSubtitle: string;
  voiceDebrief: string;
  dragNotice: string;
  saudiWorkweek: string;
  targetActivityType: string;
  existingProject: string;
  newCustomDeal: string;
  areaHunting: string;
  projectNameLabel: string;
  targetAreaLabel: string;
  googleMapsLink: string;
  whatWasDone: string;
  businessJustification: string;
  managementDecision: string;
  rejectionReason: string;
  reportAuditScope: string;
  consolidatedReport: string;
  teamScope: string;
  companiesTitle: string;
  companiesSubtitle: string;
  addCompany: string;
  allTypes: string;
  allCities: string;
  contactsTitle: string;
  contactsSubtitle: string;
  addContact: string;
  hotLeadsOnly: string;
  currentPasswordRequired: string;
  passwordLengthError: string;
  passwordsDoNotMatch: string;
  passwordUpdateSuccess: string;
  passwordUpdateFailed: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Brand & Slogan
    appName: 'CRMate',
    appSubtitle: 'SALES & PIPELINE CRM',
    appTagline: 'More Deals. Less Effort.',
    companyName: 'Al-Mespar Trading & Contracting Co.',
    ksaCloud: 'Al-Mespar Enterprise Cloud',

    // Navigation
    navDashboard: 'Dashboard',
    navProjects: 'Projects & Pipeline',
    navCompanies: 'Companies & Clients',
    navContacts: 'Contacts & Leads',
    navMyWeek: 'Weekly Plan',
    navMyDay: 'My Day Tasks',
    navActivities: 'Activity Log',
    navReports: 'Executive Reports',
    navImport: 'Data Import Hub',
    navSettings: 'Settings & System',

    // Login Page
    signInTitle: 'Sign In to Workspace',
    signInSubtitle: 'Enter your credentials to access your commercial sales pipeline.',
    selectAccountPrompt: 'Select Account for Instant Access:',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@almespar.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    rememberMe: 'Keep me logged in for 30 days',
    signInButton: 'Sign In to CRMate',
    verifyingSession: 'Verifying Session...',
    shaProtected: 'Secured with SHA-256 Enterprise Encryption',
    enterpriseRbac: 'Enterprise RBAC Active',
    loginFailed: 'Sign In Failed',
    sessionExpiredTitle: 'Session Expired',
    sessionExpiredDesc: 'Your session has expired. Please sign in again to continue.',
    invalidEmail: 'Email is not registered in the system.',
    invalidPassword: 'Incorrect password. Please try again.',
    inactiveUser: 'This account has been deactivated. Please contact administration.',
    generalLoginError: 'Login failed. Please check your connection and try again.',

    // Common UI Actions
    searchPlaceholder: 'Search projects, companies, contacts... (Ctrl+K)',
    allTeam: 'All Sales Team',
    filterByRep: 'Filter Sales Rep',
    notifications: 'Notifications',
    profile: 'User Profile',
    logout: 'Sign Out',
    save: 'Save Changes',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add New',
    view: 'View Details',
    print: 'Print Document',
    exportBackup: 'Download Backup',
    restoreBackup: 'Restore Backup',

    // Cockpit & Dashboard
    quickCreate: 'Quick Create',
    newProject: 'New Project',
    newContact: 'New Contact',
    fastLogActivity: 'Fast Log Activity',
    importExcelSheet: 'Import Excel Sheet',
    viewingScope: 'Viewing',
    salesRepScope: 'Sales Rep Scope',
    activeDeals: 'Active Deals',
    pipelineValue: 'Pipeline Value',
    quotationValue: 'Quotation Value',
    wonValue: 'Won Value',
    overdueDeals: 'Overdue Deals',
    prospectsAndLeads: 'Prospects & Leads',
    nextAction: 'Next Action',
    estimatedValue: 'Estimated Value',
    urgentActionRequired: 'Urgent action required',
    dueSoon: 'Due Soon',
    healthy: 'Healthy',
    daysLate: 'd late',
    monthlyTarget: 'Monthly Target',
    winRate: 'Win Rate',
    dealsCount: 'Deals',
    audit: 'Audit',
    leaderboardTitle: 'Sales Team Leaderboard & Quotas',
    leaderboardSubtitle: 'Track rep performance, monthly quotas, and conversion rates',
    voiceDebrief: 'Voice Daily Debrief',
    dragNotice: 'Drag & drop any activity between days to reschedule',
    saudiWorkweek: 'Saudi Workweek (Sat – Thu)',
    targetActivityType: 'Target Activity Type',
    existingProject: 'Existing Project',
    newCustomDeal: 'New / Custom Deal',
    areaHunting: 'Area / Field Hunting',
    projectNameLabel: 'Project Name',
    targetAreaLabel: 'Target Area / Industrial Zone',
    googleMapsLink: 'Google Maps Location Link',
    whatWasDone: 'Activity Details & Summary',
    businessJustification: 'Business Justification / Reason',
    managementDecision: 'Management Decision Panel',
    rejectionReason: 'Rejection Reason',
    reportAuditScope: 'Report Audit Scope',
    consolidatedReport: 'All Sales Engineers Consolidated Report',
    teamScope: 'Team Scope',
    companiesTitle: 'Companies & Accounts',
    companiesSubtitle: 'Shared organization directory for Al Mespar Western Region',
    addCompany: 'Add Company',
    allTypes: 'All Types',
    allCities: 'All Cities',
    contactsTitle: 'Contacts & Decision Makers',
    contactsSubtitle: 'Key clients, consultants, and procurement managers',
    addContact: 'Add Contact',
    hotLeadsOnly: 'Hot Leads Only',
    currentPasswordRequired: 'Please enter current password',
    passwordLengthError: 'Minimum 6 characters required',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordUpdateSuccess: 'Password updated successfully',
    passwordUpdateFailed: 'Failed to update password'
  },
  ar: {
    // Brand & Slogan
    appName: 'CRMate',
    appSubtitle: 'نظام إدارة مبيعات المشاريع',
    appTagline: 'صفقات أكثر، بجهد أقل.',
    companyName: 'شركة المسفار للتجارة والمقاولات',
    ksaCloud: 'سحابة المسفار المؤسسية',

    // Navigation
    navDashboard: 'لوحة المؤشرات',
    navProjects: 'المشاريع والفرص',
    navCompanies: 'الشركات والعملاء',
    navContacts: 'جهات الاتصال',
    navMyWeek: 'خطة الأسبوع',
    navMyDay: 'مهام اليوم',
    navActivities: 'سجل الأنشطة',
    navReports: 'التقارير التحليلية',
    navImport: 'استيراد البيانات',
    navSettings: 'الإعدادات والنظام',

    // Login Page
    signInTitle: 'تسجيل الدخول للنظام',
    signInSubtitle: 'أدخل بيانات حسابك المعتمدة للوصول إلى خط المبيعات والمشاريع.',
    selectAccountPrompt: 'اختر حسابك للدخول المباشر:',
    emailLabel: 'البريد الإلكتروني الوظيفي',
    emailPlaceholder: 'name@almespar.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    rememberMe: 'تذكر تسجيل دخولي لمدة 30 يوماً',
    signInButton: 'دخول مساحة العمل',
    verifyingSession: 'جاري التحقق من الحساب...',
    shaProtected: 'اتصال مشفر وآمن عبر تشفير SHA-256 المؤسسي',
    enterpriseRbac: 'صلاحيات RBAC مفعلة',
    loginFailed: 'فشل تسجيل الدخول',
    sessionExpiredTitle: 'انتهت الجلسة',
    sessionExpiredDesc: 'انتهت صلاحية جلستك، يرجى تسجيل الدخول مجدداً للمتابعة.',
    invalidEmail: 'البريد الإلكتروني غير مسجل في النظام.',
    invalidPassword: 'كلمة المرور غير صحيحة، يرجى المحاولة مجدداً.',
    inactiveUser: 'هذا الحساب معطل، يرجى التواصل مع الإدارة.',
    generalLoginError: 'تعذر تسجيل الدخول، يرجى التحقق من الاتصال والمحاولة مجدداً.',

    // Common UI Actions
    searchPlaceholder: 'بحث في المشاريع، الشركات، جهات الاتصال... (Ctrl+K)',
    allTeam: 'كافة أعضاء الفريق',
    filterByRep: 'تصفية حسب المهندس',
    notifications: 'التنبيهات والإشعارات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    add: 'إضافة جديد',
    view: 'عرض التفاصيل',
    print: 'طباعة المستند',
    exportBackup: 'تنزيل نسخة احتياطية',
    restoreBackup: 'استعادة نسخة احتياطية',

    // Cockpit & Dashboard
    quickCreate: 'إنشاء سريع',
    newProject: 'مشروع جديد',
    newContact: 'جهة اتصال جديدة',
    fastLogActivity: 'تسجيل سريع لنشاط',
    importExcelSheet: 'استيراد ملف إكسيل',
    viewingScope: 'العرض',
    salesRepScope: 'نطاق المبيعات',
    activeDeals: 'الصفقات النشطة',
    pipelineValue: 'قيمة خط المبيعات',
    quotationValue: 'قيمة عروض الأسعار',
    wonValue: 'الصفقات الرابحة',
    overdueDeals: 'متابعات متأخرة',
    prospectsAndLeads: 'العملاء المحتملون',
    nextAction: 'الإجراء القادم',
    estimatedValue: 'القيمة التقديرية',
    urgentActionRequired: 'يتطلب إجراء عاجل',
    dueSoon: 'يستحق قريباً',
    healthy: 'نشط ومستقر',
    daysLate: 'يوم تأخير',
    monthlyTarget: 'المستهدف الشهري',
    winRate: 'نسبة الإغلاق',
    dealsCount: 'المشاريع',
    audit: 'تدقيق',
    leaderboardTitle: 'لوحة أداء فريق المبيعات والمستهدفات',
    leaderboardSubtitle: 'متابعة أداء المناديب والمستهدفات الشهرية ونسب الإغلاق',
    voiceDebrief: 'تسجيل صوتي لليوم',
    dragNotice: 'اسحب وأفلت أي نشاط بين الأيام لإعادة جدولته',
    saudiWorkweek: 'أسبوع العمل السعودي (السبت - الخميس)',
    targetActivityType: 'نوع النشاط المستهدف',
    existingProject: 'مشروع مسجل',
    newCustomDeal: 'مشروع جديد أو مخصص',
    areaHunting: 'استكشاف ميداني للمنطقة',
    projectNameLabel: 'اسم المشروع',
    targetAreaLabel: 'المنطقة أو القطاع المستهدف',
    googleMapsLink: 'رابط موقع خرائط جوجل',
    whatWasDone: 'تفاصيل وما تم إنجازه',
    businessJustification: 'مبررات وأسباب الطلب',
    managementDecision: 'لوحة قرار الإدارة',
    rejectionReason: 'سبب الرفض',
    reportAuditScope: 'نطاق تدقيق التقرير',
    consolidatedReport: 'التقرير المجمع لكافة مهندسي المبيعات',
    teamScope: 'نطاق الفريق',
    companiesTitle: 'دليل الشركات والعملاء',
    companiesSubtitle: 'الدليل الموحد لعملاء وشركات المنطقة الغربية',
    addCompany: 'إضافة شركة',
    allTypes: 'كافة التصنيفات',
    allCities: 'كافة المدن',
    contactsTitle: 'جهات الاتصال وصناع القرار',
    contactsSubtitle: 'العملاء والاستشاريون ومديرو المشتريات',
    addContact: 'إضافة جهة اتصال',
    hotLeadsOnly: 'العملاء ذوو الأولوية العالية فقط',
    currentPasswordRequired: 'يرجى إدخال كلمة المرور الحالية',
    passwordLengthError: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
    passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين',
    passwordUpdateSuccess: 'تم تحديث كلمة المرور بنجاح',
    passwordUpdateFailed: 'تعذر تحديث كلمة المرور'
  }
};
