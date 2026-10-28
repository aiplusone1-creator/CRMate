'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  Target, 
  Shield, 
  User, 
  Save, 
  Check, 
  Bell, 
  MapPin, 
  Building2, 
  DollarSign, 
  FileSpreadsheet,
  ArrowRight,
  KeyRound,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Phone,
  Mail,
  CheckCircle2,
  Users,
  Database,
  Briefcase,
  Camera,
  Trash2,
  UserPlus,
  Edit3,
  X
} from 'lucide-react';
import { useCRM } from '@/lib/store/crm-context';
import { UserRole } from '@/types/crm';
import { User as AuthUser } from '@/lib/types/user';
import { formatCurrencySAR } from '@/lib/utils';
import { authRepository } from '@/lib/repo/local/auth';
import { downloadBackupFile, downloadExcelBackupFile, restoreBackupFile, resetToFactoryDefaults } from '@/lib/logic/backup';
import { useLanguage } from '@/lib/i18n/language-context';

function SettingsContent() {
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const { 
    currentUser, 
    currentRole, 
    salesTargets, 
    updateSalesTarget,
    updateUserProfile,
    addTeamMember,
    deleteTeamMember
  } = useCRM();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'profile' | 'targets' | 'team' | 'backup'>('profile');

  // Deep-link tab sync from URL query (e.g. /settings?tab=team)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'team' || tabParam === 'targets' || tabParam === 'backup' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Sales Targets editing state
  const [editedTargets, setEditedTargets] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    salesTargets.forEach(t => {
      map[t.id] = t.target_value;
    });
    return map;
  });
  const [targetSuccess, setTargetSuccess] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.full_name,
    name_ar: '',
    phone: currentUser.phone || '',
    title: currentUser.title || '',
    territory: currentUser.territory || ''
  });
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Change State
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Backup & Restore State
  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Registered Team Users
  const [teamUsers, setTeamUsers] = useState(() => authRepository.getUsers());

  // Strictly hide admin accounts from all non-admin users
  const isCurrentUserAdmin = currentUser.role === 'admin' || currentRole === 'admin';
  const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'sales_manager' || currentRole === 'admin' || currentRole === 'sales_manager';
  const visibleTeamUsers = useMemo(() => {
    return teamUsers.filter(u => u.role !== 'admin' || isCurrentUserAdmin);
  }, [teamUsers, isCurrentUserAdmin]);

  // Team Member Management State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [showAddPwd, setShowAddPwd] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({
    name: '',
    name_ar: '',
    email: '',
    password: '',
    role: 'sales_engineer' as UserRole,
    title: 'Sales Engineer',
    territory: 'Central Region (Riyadh)',
    phone: ''
  });
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');

  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AuthUser | null>(null);
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [editMemberForm, setEditMemberForm] = useState({
    name: '',
    name_ar: '',
    email: '',
    role: 'sales_engineer' as UserRole,
    title: '',
    territory: 'Central Region (Riyadh)',
    phone: '',
    newPassword: ''
  });
  const [editMemberLoading, setEditMemberLoading] = useState(false);
  const [editMemberError, setEditMemberError] = useState('');

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AuthUser | null>(null);
  const [memberSuccessToast, setMemberSuccessToast] = useState<string | null>(null);

  const TERRITORY_PRESETS = [
    { value: 'Central Region (Riyadh)', labelEn: 'Central Region (Riyadh)', labelAr: 'المنطقة الوسطى (الرياض)' },
    { value: 'Eastern Region (Dammam, Khobar)', labelEn: 'Eastern Region (Dammam, Khobar)', labelAr: 'المنطقة الشرقية (الدمام، الخبر)' },
    { value: 'Western Region (Jeddah, Makkah, Medina)', labelEn: 'Western Region (Jeddah, Makkah, Medina)', labelAr: 'المنطقة الغربية (جدة، مكة، المدينة)' },
    { value: 'Kingdom-Wide (KSA)', labelEn: 'Kingdom-Wide (KSA)', labelAr: 'كافة مناطق المملكة' },
    { value: 'Headquarters', labelEn: 'Headquarters', labelAr: 'المقر الرئيسي' },
  ];

  // Refresh user list on mount
  useEffect(() => {
    setTeamUsers(authRepository.getUsers());
    const user = authRepository.getUserById(currentUser.id);
    if (user) {
      setProfileForm({
        name: user.name,
        name_ar: user.name_ar,
        phone: user.phone || currentUser.phone || '',
        title: user.title || currentUser.title || '',
        territory: user.territory || currentUser.territory || ''
      });
    }
  }, [currentUser.id, currentUser.phone, currentUser.territory, currentUser.title]);

  // Keep target state in sync with context
  useEffect(() => {
    const map: Record<string, number> = {};
    salesTargets.forEach(t => {
      map[t.id] = t.target_value;
    });
    setEditedTargets(map);
  }, [salesTargets]);

  const handleTargetChange = (id: string, val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setEditedTargets(prev => ({ ...prev, [id]: num }));
    }
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const [id, val] of Object.entries(editedTargets)) {
      await updateSalesTarget(id, val);
    }
    setTargetSuccess(true);
    setTimeout(() => setTargetSuccess(false), 3500);
  };

  // Compress image client-side to thumbnail JPEG (<30KB Data URL)
  const compressImage = (file: File, maxDim = 256): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly enforce: users can ONLY change their own profile picture
    if (userId !== currentUser.id) {
      console.warn('Unauthorized avatar modification: users can only change their own profile picture');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 256);
      updateUserProfile(userId, { avatar_url: dataUrl });
      setTeamUsers(authRepository.getUsers());
    } catch (err) {
      console.error('Error processing avatar:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = (userId: string) => {
    // Strictly enforce: users can ONLY remove their own profile picture
    if (userId !== currentUser.id) {
      console.warn('Unauthorized avatar removal: users can only remove their own profile picture');
      return;
    }
    updateUserProfile(userId, { avatar_url: '' });
    setTeamUsers(authRepository.getUsers());
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      authRepository.updateProfile(currentUser.id, {
        name: profileForm.name.trim(),
        name_ar: profileForm.name_ar.trim(),
        phone: profileForm.phone.trim(),
        title: profileForm.title.trim(),
        territory: profileForm.territory.trim()
      });
      updateUserProfile(currentUser.id, {
        full_name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        title: profileForm.title.trim(),
        territory: profileForm.territory.trim()
      });
      setTeamUsers(authRepository.getUsers());
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);

    if (!pwdCurrent.trim()) {
      setPwdError(t('currentPasswordRequired'));
      return;
    }
    if (pwdNew.length < 6) {
      setPwdError(t('passwordLengthError'));
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError(t('passwordsDoNotMatch'));
      return;
    }

    setPwdLoading(true);
    try {
      await authRepository.changePassword(currentUser.id, pwdCurrent, pwdNew);
      setPwdSuccess(true);
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (err: any) {
      setPwdError(err.message || t('passwordUpdateFailed'));
    } finally {
      setPwdLoading(false);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = restoreBackupFile(content);
      if (res.success) {
        setBackupNotice({ type: 'success', message: `${res.message}. Refreshing data...` });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBackupNotice({ type: 'error', message: res.message });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetConfirm = () => {
    if (resetConfirmText.trim().toUpperCase() === 'RESET') {
      resetToFactoryDefaults();
      setShowResetConfirm(false);
      window.location.reload();
    }
  };

  const handleOpenEditUser = (user: AuthUser) => {
    setSelectedUserForEdit(user);
    setEditMemberForm({
      name: user.name,
      name_ar: user.name_ar || user.name,
      email: user.email,
      role: user.role,
      title: user.title || '',
      territory: user.territory || 'Central Region (Riyadh)',
      phone: user.phone || '',
      newPassword: ''
    });
    setEditMemberError('');
    setIsEditMemberModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    if (!isManagerOrAdmin) {
      setEditMemberError(isRTL ? 'عفواً، تعديل بيانات الموظفين والمناطق وكلمات المرور محصور للمديرين ومسؤولي النظام فقط.' : 'Editing member data and credentials is restricted to Managers only.');
      return;
    }

    setEditMemberLoading(true);
    setEditMemberError('');

    try {
      const updated = await authRepository.updateUser(selectedUserForEdit.id, {
        name: editMemberForm.name.trim(),
        name_ar: editMemberForm.name_ar.trim() || editMemberForm.name.trim(),
        email: editMemberForm.email.trim().toLowerCase(),
        role: editMemberForm.role,
        title: editMemberForm.title.trim(),
        territory: editMemberForm.territory.trim(),
        phone: editMemberForm.phone.trim(),
        newPassword: editMemberForm.newPassword.trim() || undefined
      });

      updateUserProfile(selectedUserForEdit.id, {
        full_name: updated.name,
        role: updated.role,
        title: updated.title,
        territory: updated.territory,
        phone: updated.phone
      });

      setTeamUsers(authRepository.getUsers());
      setIsEditMemberModalOpen(false);
      setMemberSuccessToast(isRTL ? `تم حفظ التعديلات وتحديث منطقة ${updated.name_ar || updated.name} بنجاح` : `Updated ${updated.name}'s info and territory successfully`);
      setTimeout(() => setMemberSuccessToast(null), 4000);
    } catch (err: any) {
      setEditMemberError(err.message || (isRTL ? 'فشل حفظ التعديلات' : 'Failed to save updates'));
    } finally {
      setEditMemberLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isManagerOrAdmin) {
      setAddMemberError(isRTL ? 'عفواً، إنشاء الحسابات الجديدة محصور للمديرين ومسؤولي النظام فقط.' : 'Creating accounts is restricted to Managers and Administrators.');
      return;
    }

    setAddMemberLoading(true);
    setAddMemberError('');

    if (!addMemberForm.name.trim() || !addMemberForm.email.trim() || !addMemberForm.password.trim()) {
      setAddMemberError(isRTL ? 'يرجى إكمال الاسم والبريد الإلكتروني وكلمة المرور' : 'Please fill required fields');
      setAddMemberLoading(false);
      return;
    }

    if (addMemberForm.password.length < 6) {
      setAddMemberError(isRTL ? 'كلمة المرور يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters');
      setAddMemberLoading(false);
      return;
    }

    try {
      const created = await authRepository.createUser({
        name: addMemberForm.name.trim(),
        name_ar: addMemberForm.name_ar.trim() || addMemberForm.name.trim(),
        email: addMemberForm.email.trim().toLowerCase(),
        password: addMemberForm.password,
        role: addMemberForm.role,
        title: addMemberForm.title.trim() || 'Sales Engineer',
        territory: addMemberForm.territory.trim() || 'Central Region (Riyadh)',
        phone: addMemberForm.phone.trim(),
        avatar_color: '#8FC2F0'
      });

      await addTeamMember({
        id: created.id,
        email: created.email,
        full_name: created.name,
        role: created.role,
        phone: created.phone,
        title: created.title,
        territory: created.territory,
        avatar_initials: (created.name || 'User').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
      });

      setTeamUsers(authRepository.getUsers());
      setIsAddMemberModalOpen(false);
      setAddMemberForm({
        name: '',
        name_ar: '',
        email: '',
        password: '',
        role: 'sales_engineer',
        title: 'Sales Engineer',
        territory: 'Central Region (Riyadh)',
        phone: ''
      });
      setMemberSuccessToast(isRTL ? `تم إنشاء حساب ${created.name_ar || created.name} بنجاح ويمكنه تسجيل الدخول الآن` : `Account for ${created.name} created successfully`);
      setTimeout(() => setMemberSuccessToast(null), 4000);
    } catch (err: any) {
      setAddMemberError(err.message || (isRTL ? 'فشل إنشاء الحساب' : 'Failed to create account'));
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteTeamMember(userId);
      setTeamUsers(authRepository.getUsers());
      setDeleteConfirmUser(null);
      setMemberSuccessToast(isRTL ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully');
      setTimeout(() => setMemberSuccessToast(null), 3500);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200 font-urbanist pb-12">
      {/* Top Header Card */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8FC2F0]/20 text-[#292D32] border border-[#8FC2F0]/30 flex items-center gap-1">
              <SettingsIcon className="w-3 h-3 text-[#292D32]" />
              <span>{isRTL ? 'إدارة بيئة العمل' : 'Workspace Administration'}</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#292D32] dark:text-white tracking-tight">
            {isRTL ? 'إعدادات النظام وإدارة الحسابات' : 'CRM Settings & Configuration'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isRTL 
              ? 'إدارة الملف الشخصي، أمان الحساب، مستهدفات المبيعات، والنسخ الاحتياطي لقاعدة البيانات.' 
              : 'Manage your personal profile, credentials security, team quotas, and database backups.'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-[#292D32] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#8FC2F0]" />
            <span>{isRTL ? 'الملف الشخصي والأمان' : 'Profile & Security'}</span>
          </button>

          <button
            onClick={() => setActiveTab('targets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'targets'
                ? 'bg-white dark:bg-slate-900 text-[#292D32] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#77CE69]" />
            <span>{isRTL ? 'المستهدفات البيعية' : 'Sales Quotas'}</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'team'
                ? 'bg-white dark:bg-slate-900 text-[#292D32] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#8FC2F0]" />
            <span>{isRTL ? 'الفريق والصلاحيات' : 'Team & RBAC'}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-slate-900 text-[#292D32] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#292D32] dark:text-[#8FC2F0]" />
            <span>{isRTL ? 'البيانات والنسخ الاحتياطي' : 'Data & Backups'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in">
          {/* User Identity Banner */}
          <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative group/avatar shrink-0">
                <div suppressHydrationWarning className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#292D32] to-slate-700 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-[#8FC2F0] overflow-hidden">
                  {mounted && currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.avatar_initials || 'EM'
                  )}
                </div>
                <label
                  htmlFor="profile-avatar-input"
                  className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  title={isRTL ? "تغيير الصورة الشخصية" : "Change profile photo"}
                >
                  <Camera className="w-5 h-5 text-[#8FC2F0]" />
                  <span className="text-[10px] font-bold mt-0.5">{isRTL ? "تغيير" : "Change"}</span>
                </label>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload(currentUser.id, e)}
                />
                {currentUser.avatar_url && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAvatar(currentUser.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                    title={isRTL ? "حذف الصورة" : "Remove photo"}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-[#292D32]">{currentUser.full_name}</h2>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#77CE69]/20 text-[#292D32] border border-[#77CE69]/40">
                    Active
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {currentUser.email}
                  </span>
                  <span>&bull;</span>
                  <span className="font-semibold text-slate-700">{currentUser.title || 'Senior Sales Engineer'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#8FC2F0]" />
                    <span>{currentUser.territory || 'Western Region (Jeddah, Makkah, Medina)'}</span>
                  </span>
                  <span>&bull;</span>
                  <label
                    htmlFor="profile-avatar-input"
                    className="text-[11px] font-bold text-[#8FC2F0] hover:text-[#292D32] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{currentUser.avatar_url ? (isRTL ? 'تعديل الصورة الشخصية' : 'Change photo') : (isRTL ? 'تحميل صورة شخصية' : 'Upload photo')}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Clearance</span>
              <span className="text-xs font-black uppercase bg-[#292D32] text-white px-3 py-1 rounded-xl shadow-xs">
                {currentRole.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">User ID: {currentUser.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Edit Profile Information */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30">
                    <User className="w-4 h-4 text-[#292D32]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#292D32]">Profile Information</h3>
                    <p className="text-[11px] text-slate-500">Update your public contact info and title.</p>
                  </div>
                </div>

                {profileSuccess && (
                  <div className="mb-4 p-3 rounded-2xl bg-[#77CE69]/20 text-[#292D32] border border-[#77CE69]/30 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#77CE69]" />
                    <span>{isRTL ? 'تم حفظ معلومات الملف الشخصي بنجاح' : 'Profile updated successfully'}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#292D32] mb-1">{isRTL ? 'الاسم بالإنجليزية' : 'Full Name (English)'}</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292D32] mb-1">{isRTL ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={profileForm.name_ar}
                      onChange={(e) => setProfileForm(p => ({ ...p, name_ar: e.target.value }))}
                      placeholder={isRTL ? 'مثال: إسلام المهندس' : 'e.g. Islam Engineer'}
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#292D32] mb-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="9665..."
                        className="w-full px-3.5 py-2 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#292D32] mb-1">{isRTL ? 'المسمى الوظيفي' : 'Job Title'}</label>
                      <input
                        type="text"
                        value={profileForm.title}
                        onChange={(e) => setProfileForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full px-3.5 py-2 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292D32] mb-1">{isRTL ? 'منطقة المبيعات المخصصة' : 'Assigned Sales Territory'}</label>
                    <input
                      type="text"
                      value={profileForm.territory}
                      onChange={(e) => setProfileForm(p => ({ ...p, territory: e.target.value }))}
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-[#292D32] hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                    >
                      <Save className="w-3.5 h-3.5 text-[#8FC2F0]" />
                      <span>{isRTL ? 'حفظ بيانات الملف الشخصي' : 'Save Profile Details'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Change Password & Security */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-200">
                    <KeyRound className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#292D32]">Security &amp; Password</h3>
                    <p className="text-[11px] text-slate-500">Change your sign-in password safely.</p>
                  </div>
                </div>

                {pwdSuccess && (
                  <div className="mb-4 p-3 rounded-2xl bg-[#77CE69]/20 text-[#292D32] border border-[#77CE69]/30 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#77CE69]" />
                    <span>{isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully'}</span>
                  </div>
                )}

                {pwdError && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#292D32] mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPwdCurrent ? 'text' : 'password'}
                        value={pwdCurrent}
                        onChange={(e) => setPwdCurrent(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2 pr-10 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwdCurrent(!showPwdCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPwdCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292D32] mb-1">New Password (min. 6 characters)</label>
                    <div className="relative">
                      <input
                        type={showPwdNew ? 'text' : 'password'}
                        value={pwdNew}
                        onChange={(e) => setPwdNew(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-3.5 py-2 pr-10 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwdNew(!showPwdNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPwdNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292D32] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2 text-xs font-semibold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Encrypted with SHA-256</span>
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#8FC2F0]" />
                      <span>{pwdLoading ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES TARGETS & QUOTAS */}
      {activeTab === 'targets' && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#77CE69]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#77CE69]/30">
                <Target className="w-5 h-5 text-[#292D32]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#292D32]">Dynamic Sales Targets &amp; Quotas</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Configured targets automatically drive progress bars, leaderboard quotas, and executive KPIs.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-[#292D32] bg-white/70 px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
              September 2026
            </span>
          </div>

          {targetSuccess && (
            <div className="mb-5 p-3 rounded-2xl bg-[#77CE69]/20 text-[#292D32] border border-[#77CE69]/30 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#77CE69]" />
              <span>{isRTL ? 'تم حفظ المستهدفات البيعية بنجاح' : 'Sales targets saved successfully'}</span>
            </div>
          )}

          <form onSubmit={handleSaveTargets} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salesTargets.map(target => {
                const currentVal = editedTargets[target.id] ?? target.target_value;

                const metricLabels: Record<string, { label: string; unit: string; desc: string }> = {
                  calls: { label: 'Monthly Phone Calls', unit: 'Calls', desc: 'Customer follow-up and cold call touches' },
                  f2f_meetings: { label: 'Face-to-Face Meetings', unit: 'Meetings', desc: 'Direct client meetings at client office or headquarters' },
                  hunting_visits: { label: 'Hunting & Site Visits', unit: 'Visits', desc: 'Unscheduled contractor or site reconnaissance visits' },
                  quotations_sent: { label: 'Quotations Delivered', unit: 'Quotations', desc: 'Formal price proposals and technical submittals submitted' },
                  won_value: { label: 'Closed Deal Revenue Value', unit: 'SAR', desc: 'Contract or PO awarded cumulative revenue target' },
                };

                const info = metricLabels[target.target_metric] || {
                  label: target.target_metric.replace('_', ' '),
                  unit: 'Qty',
                  desc: 'Sales performance metric target'
                };

                const isCurrency = target.target_metric === 'won_value';

                return (
                  <div key={target.id} className="glass-card-interactive p-4 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#292D32]">{info.label}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{target.period_type}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{info.desc}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={0}
                          value={currentVal}
                          onChange={(e) => handleTargetChange(target.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm font-bold bg-white/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900"
                        />
                        <span className="text-xs font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                          {info.unit}
                        </span>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 shrink-0">
                        <span>Actual: </span>
                        <strong className="text-slate-800">
                          {isCurrency ? formatCurrencySAR(target.current_actual) : target.current_actual}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Updates persist in localStorage and sync across all dashboards.</span>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#292D32] hover:bg-black text-white rounded-2xl text-xs font-bold shadow-xs transition-all"
              >
                <Save className="w-4 h-4 text-[#77CE69]" />
                <span>Save Sales Targets</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: TEAM ROSTER & RBAC PERMISSIONS */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Action Success Toast */}
          {memberSuccessToast && (
            <div className="p-3.5 rounded-2xl bg-[#77CE69]/20 text-[#292D32] dark:text-emerald-300 border border-[#77CE69]/30 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#77CE69] shrink-0" />
              <span>{memberSuccessToast}</span>
            </div>
          )}

          {/* Team Directory Table */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30 shrink-0">
                  <Users className="w-5 h-5 text-[#292D32] dark:text-[#8FC2F0]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#292D32] dark:text-white">
                    {isRTL ? 'فريق العمل وإدارة الحسابات والمناطق' : 'Company Sales Roster & Team Directory'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {isRTL 
                      ? 'إدارة حسابات المهندسين، تعيين المناطق البيعية، وتحديث الصلاحيات وكلمات المرور.' 
                      : `${visibleTeamUsers.length} official regional sales engineers, estimators, and managers.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full shrink-0">
                  {visibleTeamUsers.length} {isRTL ? 'حسابات نشطة' : 'Active Accounts'}
                </span>

                {/* Only Managers and Admins can create new user accounts */}
                {isManagerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddMemberError('');
                      setIsAddMemberModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#292D32] hover:bg-black dark:bg-[#8FC2F0] dark:hover:bg-white text-white dark:text-[#12161C] rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#8FC2F0] dark:text-[#12161C]" />
                    <span>{isRTL ? 'إضافة عضو جديد' : 'Add Team Member'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTeamUsers.map(user => {
                const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const isCurrent = user.id === currentUser.id;

                return (
                  <div 
                    key={user.id} 
                    className={`p-4 rounded-2xl transition-all border ${
                      isCurrent 
                        ? 'border-[#8FC2F0] bg-[#8FC2F0]/10 shadow-xs' 
                        : 'border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="relative group/teamavatar shrink-0">
                          <div 
                            suppressHydrationWarning
                            className="w-11 h-11 rounded-xl text-white font-black flex items-center justify-center text-xs shadow-xs overflow-hidden"
                            style={{ backgroundColor: user.avatar_color || '#292D32' }}
                          >
                            {mounted && user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>

                          {/* Profile picture upload is strictly restricted to the account owner themselves */}
                          {isCurrent && (
                            <>
                              <label
                                htmlFor={`team-avatar-${user.id}`}
                                className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover/teamavatar:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                title={isRTL ? "تغيير صورتك" : "Change your photo"}
                              >
                                <Camera className="w-4 h-4 text-white" />
                              </label>
                              <input
                                id={`team-avatar-${user.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleAvatarUpload(user.id, e)}
                              />
                            </>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#292D32] dark:text-white">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-black uppercase bg-[#292D32] dark:bg-[#8FC2F0] text-white dark:text-[#12161C] px-1.5 py-0.5 rounded-md">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">{user.name_ar}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {user.id}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{user.title || user.role}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-[#8FC2F0] shrink-0" />
                        <span className="truncate">{user.territory || (isRTL ? 'كافة مناطق المملكة' : 'Kingdom-Wide (KSA)')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Only Managers and Admins can edit employee data, territory, and password */}
                        {isManagerOrAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(user)}
                            className="text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title={isRTL ? 'تعديل البيانات والمنطقة وكلمة المرور (صلاحية إدارية)' : 'Edit Info, Territory & Password (Manager Access)'}
                          >
                            <Edit3 className="w-3 h-3 text-[#8FC2F0]" />
                            <span>{isRTL ? 'تعديل والمنطقة' : 'Edit & Territory'}</span>
                          </button>
                        )}

                        {/* Each user can ONLY change or remove their OWN photo */}
                        {isCurrent && (
                          <>
                            <label
                              htmlFor={`team-avatar-${user.id}`}
                              className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-[#292D32] bg-slate-100/70 dark:bg-slate-800/70 hover:bg-slate-200/90 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center"
                              title={user.avatar_url ? (isRTL ? 'تعديل صورتك' : 'Change Your Photo') : (isRTL ? 'إضافة صورتك' : 'Add Your Photo')}
                            >
                              <Camera className="w-3 h-3 text-[#8FC2F0]" />
                            </label>
                            {user.avatar_url && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAvatar(user.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={isRTL ? "إزالة صورتك" : "Remove your photo"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          user.role === 'admin'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : user.role === 'sales_manager'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] border-[#8FC2F0]/30'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>

                        {isCurrentUserAdmin && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(user)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title={isRTL ? 'حذف الحساب' : 'Delete Account'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Team Member Modal */}
          {isAddMemberModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#15191E] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center font-bold">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#292D32] dark:text-white">
                        {isRTL ? 'إضافة عضو جديد لفريق العمل' : 'Add New Team Member'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {isRTL ? 'إنشاء حساب رسمي جديد وتعيين المنطقة البيعية والصلاحيات' : 'Provision credentials, role, and territory'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {addMemberError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{addMemberError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'الاسم بالإنجليزية *' : 'Full Name (English) *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Omar Khaled"
                        value={addMemberForm.name}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'الاسم بالعربية' : 'Full Name (Arabic)'}
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: عمر خالد"
                        value={addMemberForm.name_ar}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, name_ar: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'البريد الإلكتروني الرسمي *' : 'Corporate Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="name@almespar.com"
                        value={addMemberForm.email}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'كلمة المرور الأولية * (6 خانات+)' : 'Initial Password * (6+ chars)'}
                      </label>
                      <div className="relative">
                        <input
                          type={showAddPwd ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="••••••••"
                          value={addMemberForm.password}
                          onChange={(e) => setAddMemberForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAddPwd(!showAddPwd)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                        >
                          {showAddPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'الدور الوظيفي / الصلاحية' : 'Role & Access Level'}
                      </label>
                      <select
                        value={addMemberForm.role}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      >
                        <option value="sales_engineer">{isRTL ? 'مهندس مبيعات (Sales Engineer)' : 'Sales Engineer'}</option>
                        <option value="sales_manager">{isRTL ? 'مدير مبيعات إقليمي (Sales Manager)' : 'Sales Manager'}</option>
                        <option value="estimator">{isRTL ? 'مهندس تسعير وتكاليف (Estimator)' : 'Lead Estimator'}</option>
                        <option value="viewer">{isRTL ? 'متابع / مشاهد فقط (Viewer)' : 'Viewer'}</option>
                        {isCurrentUserAdmin && <option value="admin">{isRTL ? 'مسؤول نظام (Admin)' : 'Admin'}</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'المسمى الوظيفي' : 'Job Title'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Regional Sales Engineer"
                        value={addMemberForm.title}
                        onChange={(e) => setAddMemberForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Territory Selector */}
                  <div className="p-3 bg-[#8FC2F0]/10 border border-[#8FC2F0]/30 rounded-2xl space-y-2">
                    <label className="block font-bold text-slate-800 dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8FC2F0]" />
                        <span>{isRTL ? 'المنطقة الجغرافية / النطاق البيعي *' : 'Sales Territory / Region *'}</span>
                      </span>
                    </label>
                    <select
                      value={TERRITORY_PRESETS.some(p => p.value === addMemberForm.territory) ? addMemberForm.territory : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setAddMemberForm(prev => ({ ...prev, territory: val }));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                    >
                      {TERRITORY_PRESETS.map(preset => (
                        <option key={preset.value} value={preset.value}>
                          {isRTL ? `${preset.labelAr} (${preset.labelEn})` : `${preset.labelEn} - ${preset.labelAr}`}
                        </option>
                      ))}
                      <option value="custom">{isRTL ? 'منطقة أخرى مخصصة...' : 'Other Custom Territory...'}</option>
                    </select>

                    <input
                      type="text"
                      placeholder={isRTL ? 'أو اكتب اسم المنطقة يدوياً' : 'Or type custom territory name'}
                      value={addMemberForm.territory}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, territory: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      {isRTL ? 'رقم الهاتف / الجوال' : 'Phone Number'}
                    </label>
                    <input
                      type="text"
                      placeholder="+9665xxxxxxxx"
                      value={addMemberForm.phone}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddMemberModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={addMemberLoading}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#292D32] hover:bg-black dark:bg-[#8FC2F0] dark:text-[#12161C] dark:hover:bg-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {addMemberLoading ? (
                        <span>{isRTL ? 'جاري الإنشاء...' : 'Creating...'}</span>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isRTL ? 'إنشاء الحساب' : 'Create Account'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Team Member & Territory Modal */}
          {isEditMemberModalOpen && selectedUserForEdit && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#15191E] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#8FC2F0]/20 text-[#292D32] dark:text-[#8FC2F0] flex items-center justify-center font-bold">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#292D32] dark:text-white">
                        {isRTL ? `تعديل بيانات والمنطقة: ${selectedUserForEdit.name_ar || selectedUserForEdit.name}` : `Edit Profile & Territory: ${selectedUserForEdit.name}`}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {isRTL ? 'تعديل النطاق الجغرافي، الصلاحيات، وتحديث بيانات الموظف' : 'Reassign regional territory and update permissions'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditMemberModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {editMemberError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{editMemberError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'الاسم بالإنجليزية *' : 'Full Name (English) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editMemberForm.name}
                        onChange={(e) => setEditMemberForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'الاسم بالعربية' : 'Full Name (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={editMemberForm.name_ar}
                        onChange={(e) => setEditMemberForm(prev => ({ ...prev, name_ar: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'البريد الإلكتروني' : 'Corporate Email'}
                      </label>
                      <input
                        type="email"
                        required
                        value={editMemberForm.email}
                        onChange={(e) => setEditMemberForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'رقم الهاتف' : 'Phone'}
                      </label>
                      <input
                        type="text"
                        value={editMemberForm.phone}
                        onChange={(e) => setEditMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'الدور والصلاحيات' : 'Role & Permissions'}
                      </label>
                      <select
                        value={editMemberForm.role}
                        onChange={(e) => setEditMemberForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      >
                        <option value="sales_engineer">{isRTL ? 'مهندس مبيعات (Sales Engineer)' : 'Sales Engineer'}</option>
                        <option value="sales_manager">{isRTL ? 'مدير مبيعات إقليمي (Sales Manager)' : 'Sales Manager'}</option>
                        <option value="estimator">{isRTL ? 'مهندس تسعير وتكاليف (Estimator)' : 'Lead Estimator'}</option>
                        <option value="viewer">{isRTL ? 'متابع / مشاهد فقط (Viewer)' : 'Viewer'}</option>
                        {isCurrentUserAdmin && <option value="admin">{isRTL ? 'مسؤول نظام (Admin)' : 'Admin'}</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        {isRTL ? 'المسمى الوظيفي' : 'Job Title'}
                      </label>
                      <input
                        type="text"
                        value={editMemberForm.title}
                        onChange={(e) => setEditMemberForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Territory Selector (Key for switching Central to Eastern) */}
                  <div className="p-3 bg-[#8FC2F0]/10 border border-[#8FC2F0]/30 rounded-2xl space-y-2">
                    <label className="block font-bold text-slate-800 dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#8FC2F0]" />
                        <span>{isRTL ? 'المنطقة الجغرافية المسندة (Territory)' : 'Assigned Sales Territory'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {isRTL ? 'حدد المنطقة لإسناد المشاريع' : 'Select to route projects'}
                      </span>
                    </label>

                    <select
                      value={TERRITORY_PRESETS.some(p => p.value === editMemberForm.territory) ? editMemberForm.territory : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setEditMemberForm(prev => ({ ...prev, territory: val }));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8FC2F0]"
                    >
                      {TERRITORY_PRESETS.map(preset => (
                        <option key={preset.value} value={preset.value}>
                          {isRTL ? `${preset.labelAr} (${preset.labelEn})` : `${preset.labelEn} - ${preset.labelAr}`}
                        </option>
                      ))}
                      <option value="custom">{isRTL ? 'منطقة أخرى مخصصة...' : 'Other Custom Territory...'}</option>
                    </select>

                    <input
                      type="text"
                      placeholder={isRTL ? 'أو اكتب تفاصيل المنطقة (مثال: المنطقة الشرقية - الدمام والخبر)' : 'Custom territory name'}
                      value={editMemberForm.territory}
                      onChange={(e) => setEditMemberForm(prev => ({ ...prev, territory: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Optional Password Reset */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                      <span>{isRTL ? 'تعيين كلمة مرور جديدة (اختياري)' : 'Set New Password (Optional)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{isRTL ? 'اتركها فارغة للإبقاء على الحالية' : 'Leave empty to keep unchanged'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPwd ? 'text' : 'password'}
                        placeholder={isRTL ? 'كلمة مرور جديدة (6 خانات على الأقل)' : 'New password (min 6 chars)'}
                        value={editMemberForm.newPassword}
                        onChange={(e) => setEditMemberForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#8FC2F0] text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPwd(!showEditPwd)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        {showEditPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditMemberModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={editMemberLoading}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#292D32] hover:bg-black dark:bg-[#8FC2F0] dark:text-[#12161C] dark:hover:bg-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {editMemberLoading ? (
                        <span>{isRTL ? 'جاري الحفظ...' : 'Saving...'}</span>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-[#77CE69]" />
                          <span>{isRTL ? 'حفظ التعديلات والمنطقة' : 'Save Changes'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Member Confirmation Modal */}
          {deleteConfirmUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#15191E] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRTL ? `هل أنت متأكد من حذف حساب ${deleteConfirmUser.name_ar || deleteConfirmUser.name}؟` : `Delete account for ${deleteConfirmUser.name}?`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isRTL
                      ? 'سيتم تعطيل الحساب وإزالته من قائمة الفريق. لن يتمكن المستخدم من تسجيل الدخول.'
                      : 'The user account will be removed and will no longer be able to sign in.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteConfirmUser(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(deleteConfirmUser.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    {isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RBAC Permission Matrix */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#292D32] text-white flex items-center justify-center font-bold">
                <Shield className="w-5 h-5 text-[#8FC2F0]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#292D32]">Role-Based Access Control (RBAC) Matrix</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Pre-configured enterprise permissions governing commercial workflows.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 pr-4">Role</th>
                    <th className="py-2.5 px-3">Pipeline Projects</th>
                    <th className="py-2.5 px-3">Sales Activities</th>
                    <th className="py-2.5 px-3">Quotations &amp; BOQ</th>
                    <th className="py-2.5 px-3">Discount Approvals</th>
                    <th className="py-2.5 pl-3">Settings &amp; Quotas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Admin row is strictly hidden from non-admin users */}
                  {isCurrentUserAdmin && (
                    <tr className="bg-purple-50/50">
                      <td className="py-3 pr-4 font-bold text-slate-900 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>Admin</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">Full Access (All)</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">Full Access</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">Full Access</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">Approve / Reject</td>
                      <td className="py-3 pl-3 text-emerald-600 font-bold">Full System Control</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 pr-4 font-bold text-slate-900">Sales Manager</td>
                    <td className="py-3 px-3 text-slate-700">View All / Edit Team</td>
                    <td className="py-3 px-3 text-slate-700">Review All Team</td>
                    <td className="py-3 px-3 text-slate-700">View &amp; Edit All</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">Approve / Reject</td>
                    <td className="py-3 pl-3 text-slate-700">Configure Targets</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-slate-900">Sales Engineer</td>
                    <td className="py-3 px-3 text-slate-700">Manage Assigned</td>
                    <td className="py-3 px-3 text-slate-700">Log &amp; Voice Dictate</td>
                    <td className="py-3 px-3 text-slate-700">Create &amp; Upload</td>
                    <td className="py-3 px-3 text-blue-600">Submit Requests</td>
                    <td className="py-3 pl-3 text-slate-400">View Targets</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-slate-900">Estimator</td>
                    <td className="py-3 px-3 text-slate-700">View Active RFQs</td>
                    <td className="py-3 px-3 text-slate-400">Read Only</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">Manage BOQ &amp; Cost</td>
                    <td className="py-3 px-3 text-slate-400">No Access</td>
                    <td className="py-3 pl-3 text-slate-400">No Access</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-slate-900">Viewer</td>
                    <td className="py-3 px-3 text-slate-400">Read Only</td>
                    <td className="py-3 px-3 text-slate-400">Read Only</td>
                    <td className="py-3 px-3 text-slate-400">Read Only</td>
                    <td className="py-3 px-3 text-slate-400">Read Only</td>
                    <td className="py-3 pl-3 text-slate-400">Read Only</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA MANAGEMENT & BACKUPS */}
      {activeTab === 'backup' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Notification Banner */}
          {backupNotice && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
              backupNotice.type === 'success' 
                ? 'bg-[#77CE69]/20 text-[#292D32] border-[#77CE69]/30' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {backupNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#77CE69] shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span>{backupNotice.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Backup Card */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30">
                    <Download className="w-5 h-5 text-[#292D32]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#292D32]">
                      {isRTL ? 'تحميل النسخ الاحتياطية (Export Backup)' : 'Download Database Backup'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isRTL 
                        ? 'تصدير بيانات المبيعات الحية إما بصيغة إكسيل (Excel) أصلية أو نسخة كاملة (JSON).'
                        : 'Export live pipeline data into authentic Excel (.xlsx) or comprehensive JSON bundle.'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {isRTL 
                    ? 'اختر التنسيق المناسب لك: شيت الإكسيل الحي مطابق لملف الشركة الأساسي بكافة تحديثاته، أو نسخة JSON للتعافي الكامل الشامل.'
                    : 'Choose your preferred format: Live Excel workbook matches your original company sheet with all updates, or JSON bundle for full disaster recovery.'}
                </p>
              </div>

              <div className="pt-6 space-y-2.5">
                {/* Option 1: Live Updated Excel Backup */}
                <button
                  onClick={async () => {
                    setBackupNotice({ 
                      type: 'success', 
                      message: isRTL ? 'جاري تجهيز وتحديث شيت الإكسيل بجميع بيانات ومشاريع السيستم...' : 'Preparing live updated Excel workbook with all CRM updates...' 
                    });
                    const ok = await downloadExcelBackupFile();
                    if (ok) {
                      setBackupNotice({ 
                        type: 'success', 
                        message: isRTL ? 'تم تحميل شيت الإكسيل الحي المحدث بنجاح! متضمناً كافة المشاريع وجهات الاتصال والأنشطة.' : 'Live updated Excel backup downloaded successfully!' 
                      });
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#77CE69] hover:bg-[#68bd5a] text-[#292D32] font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#292D32]" />
                  <span>{isRTL ? 'تحميل شيت إكسيل حي ومحدث (Live Excel .xlsx)' : 'Download Live Updated Excel (.xlsx)'}</span>
                </button>

                {/* Option 2: Full System JSON Backup */}
                <button
                  onClick={() => {
                    downloadBackupFile(currentUser.full_name);
                    setBackupNotice({ 
                      type: 'success', 
                      message: isRTL ? 'تم تنزيل النسخة الاحتياطية التقنية (JSON) بنجاح!' : 'Backup JSON downloaded successfully! Keep this file in a safe location.' 
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#292D32] hover:bg-black text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Download className="w-4 h-4 text-[#8FC2F0]" />
                  <span>{isRTL ? 'تحميل نسخة النظام الكاملة (Full Snapshot .json)' : 'Download Full System Backup (.json)'}</span>
                </button>
              </div>
            </div>

            {/* Restore Backup Card */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#77CE69]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#77CE69]/30">
                    <Upload className="w-5 h-5 text-[#292D32]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#292D32]">Restore Database from Backup</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Restore your workspace state from a previously exported CRMate JSON bundle.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Restoring will safely update and overwrite local pipeline records with the contents of your backup file.
                </p>
              </div>

              <div className="pt-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-[#292D32] border border-slate-300 rounded-2xl text-xs font-bold shadow-xs transition-all"
                >
                  <Upload className="w-4 h-4 text-[#77CE69]" />
                  <span>Select Backup File to Restore</span>
                </button>
              </div>
            </div>
          </div>

          {/* Excel Importer Direct Shortcut */}
          <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8FC2F0]/20 text-[#292D32] flex items-center justify-center font-bold border border-[#8FC2F0]/30 shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-[#292D32]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#292D32]">Excel Pipeline Workbook Importer</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Bulk sync official Excel workbooks (Projects Follow UP, Hot Leads, Won Deals) into your live pipeline.
                </p>
              </div>
            </div>

            <Link
              href="/import"
              className="px-4 py-2.5 rounded-2xl bg-[#292D32] hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Open Excel Importer</span>
              <ArrowRight className="w-4 h-4 text-[#8FC2F0]" />
            </Link>
          </div>

          {/* Danger Zone: Factory Reset */}
          <div className="p-6 rounded-3xl border border-rose-200 bg-rose-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Disaster Recovery &amp; Factory Reset</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Purge all locally cached database modifications and reset CRMate to initial factory data. (Does not delete user credentials).
              </p>
            </div>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              Reset to Factory State
            </button>
          </div>

          {/* Reset Confirmation Modal */}
          {showResetConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Are you absolutely sure?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This action will reset your projects, activities, and quotations to the default initial dataset. 
                    Type <strong className="text-rose-600 font-mono">RESET</strong> below to confirm.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Type RESET"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowResetConfirm(false);
                      setResetConfirmText('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetConfirm}
                    disabled={resetConfirmText.trim().toUpperCase() !== 'RESET'}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-40"
                  >
                    Confirm Factory Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-slate-400">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
