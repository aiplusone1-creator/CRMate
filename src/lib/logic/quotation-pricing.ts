/**
 * CRMate Quotation Pricing & Versioning Calculations
 * Accurate decimal and financial arithmetic for quotation revisions,
 * discount analysis, and price trajectories.
 */

export interface PriceDifference {
  amount: number; // positive = increased, negative = reduced
  percentage: number; // e.g. -5.97
  formattedAmount: string; // e.g. "-SAR 230,000" or "+SAR 50,000"
  formattedPercentage: string; // e.g. "-5.97%" or "+1.25%"
  isReduction: boolean;
}

export interface ReductionSummary {
  originalAmount: number;
  currentAmount: number;
  totalReduction: number;
  reductionPercentage: number;
  formattedReduction: string;
  formattedPercentage: string;
  revisionsCount: number;
  initialDate?: string;
  latestDate?: string;
  daysActive: number;
}

export interface QuotationCalculationInput {
  subtotal: number;
  discountType?: 'fixed' | 'percentage';
  discountAmount?: number;
  discountPercentage?: number;
  taxRate?: number; // 0.15 for 15% VAT
  applyTax?: boolean;
}

export interface QuotationCalculationResult {
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Cleanly formats a currency amount in compact notation (SAR 4.25M, SAR 350K, SAR 15,000).
 */
export function formatCompactSAR(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'SAR 0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const millions = (abs / 1_000_000).toFixed(2).replace(/\.00$/, '');
    return `${sign}SAR ${millions}M`;
  }
  if (abs >= 10_000) {
    const thousands = (abs / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}SAR ${thousands}K`;
  }
  return `${sign}SAR ${Math.round(abs).toLocaleString('en-US')}`;
}

/**
 * Cleanly formats percentage with exactly 2 decimal places max, avoiding floating point weirdness.
 */
export function formatPercentage(pct: number): string {
  if (isNaN(pct)) return '0%';
  const rounded = Math.round(pct * 100) / 100;
  return `${rounded.toFixed(2).replace(/\.00$/, '')}%`;
}

/**
 * Calculates step difference between a current version and a previous version.
 */
export function calculateDifference(currentAmount: number, previousAmount: number): PriceDifference {
  const amount = Math.round((currentAmount - previousAmount) * 100) / 100;
  let percentage = 0;
  if (previousAmount > 0) {
    percentage = Math.round(((currentAmount - previousAmount) / previousAmount) * 10000) / 100;
  }

  const isReduction = amount < 0;
  const absAmt = Math.abs(amount);
  const formattedAmount = `${amount < 0 ? '-' : amount > 0 ? '+' : ''}SAR ${absAmt.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const formattedPercentage = `${percentage > 0 ? '+' : ''}${percentage.toFixed(2).replace(/\.00$/, '')}%`;

  return {
    amount,
    percentage,
    formattedAmount,
    formattedPercentage,
    isReduction
  };
}

/**
 * Calculates total cumulative reduction from original baseline V1 to the latest revision.
 */
export function calculateReductionSummary(
  quotations: { amount: number; quotation_date?: string; sent_date?: string; created_at?: string }[]
): ReductionSummary {
  if (!quotations || quotations.length === 0) {
    return {
      originalAmount: 0,
      currentAmount: 0,
      totalReduction: 0,
      reductionPercentage: 0,
      formattedReduction: 'SAR 0',
      formattedPercentage: '0%',
      revisionsCount: 0,
      daysActive: 0
    };
  }

  // Sort ascending by version or date
  const sorted = [...quotations];
  const original = sorted[0].amount || 0;
  const current = sorted[sorted.length - 1].amount || 0;

  const totalReduction = Math.max(0, Math.round((original - current) * 100) / 100);
  let reductionPercentage = 0;
  if (original > 0) {
    reductionPercentage = Math.round(((original - current) / original) * 10000) / 100;
    if (reductionPercentage < 0) reductionPercentage = 0;
  }

  const initialDate = sorted[0].quotation_date || sorted[0].sent_date || sorted[0].created_at;
  const latestDate = sorted[sorted.length - 1].quotation_date || sorted[sorted.length - 1].sent_date || sorted[sorted.length - 1].created_at;

  let daysActive = 0;
  if (initialDate && latestDate) {
    const d1 = new Date(initialDate).getTime();
    const d2 = new Date(latestDate).getTime();
    const diffTime = Math.abs(d2 - d1);
    daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    originalAmount: original,
    currentAmount: current,
    totalReduction,
    reductionPercentage,
    formattedReduction: `SAR ${totalReduction.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
    formattedPercentage: `${reductionPercentage.toFixed(2).replace(/\.00$/, '')}%`,
    revisionsCount: quotations.length,
    initialDate,
    latestDate,
    daysActive
  };
}

/**
 * Calculates comprehensive subtotal, discount, tax, and final amount.
 */
export function calculateQuotationTotals(input: QuotationCalculationInput): QuotationCalculationResult {
  const subtotal = Math.max(0, Math.round((input.subtotal || 0) * 100) / 100);
  let discountAmount = 0;
  let discountPercentage = 0;

  if (input.discountType === 'percentage' || (input.discountPercentage !== undefined && input.discountPercentage > 0)) {
    discountPercentage = Math.min(100, Math.max(0, input.discountPercentage || 0));
    discountAmount = Math.round((subtotal * (discountPercentage / 100)) * 100) / 100;
  } else if (input.discountAmount !== undefined && input.discountAmount > 0) {
    discountAmount = Math.min(subtotal, Math.max(0, input.discountAmount));
    discountPercentage = subtotal > 0 ? Math.round((discountAmount / subtotal) * 10000) / 100 : 0;
  }

  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const taxRate = input.applyTax ? (input.taxRate !== undefined ? input.taxRate : 0.15) : 0;
  const taxAmount = Math.round((taxableAmount * taxRate) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal,
    discountAmount,
    discountPercentage,
    taxableAmount,
    taxAmount,
    totalAmount
  };
}

/**
 * Common Revision Reason options in English & Arabic.
 */
export interface RevisionReasonOption {
  id: string;
  labelEn: string;
  labelAr: string;
}

export const REVISION_REASONS: RevisionReasonOption[] = [
  { id: 'customer_discount', labelEn: 'Customer requested commercial discount', labelAr: 'طلب العميل تخفيض تجاري' },
  { id: 'scope_reduced', labelEn: 'Scope reduction / items descoped', labelAr: 'تقليص نطاق التوريد / استبعاد بنود' },
  { id: 'scope_expanded', labelEn: 'Scope addition / expanded BOQ', labelAr: 'إضافة نطاق توريد جديد / توسيع جدول الكميات' },
  { id: 'boq_updated', labelEn: 'BOQ updated from contractor', labelAr: 'تحديث جدول الكميات من المقاول' },
  { id: 'consultant_comments', labelEn: 'Consultant comments & technical spec review', labelAr: 'ملاحظات الاستشاري ومراجعة المواصفات' },
  { id: 'competitor_pricing', labelEn: 'Competitive market pricing pressure', labelAr: 'مواءمة الأسعار مع المنافسين بالسوق' },
  { id: 'management_discount', labelEn: 'Management special pricing approval', labelAr: 'موافقة الإدارة على خصم تجاري خاص' },
  { id: 'payment_terms_revised', labelEn: 'Payment terms renegotiated', labelAr: 'تعديل وتحديث شروط الدفع والتحصيل' },
  { id: 'other', labelEn: 'Other specific commercial justification', labelAr: 'موجب تجاري آخر' },
];

/**
 * Commercial presets for fast quotation input.
 */
export const PAYMENT_TERMS_PRESETS = [
  { id: '10_90', label: '10% Advance, 90% against delivery' },
  { id: 'credit_30', label: '30 Days Net Credit from delivery' },
  { id: 'credit_60', label: '60 Days Net Credit from delivery' },
  { id: 'advance_100', label: '100% Advance against PI' },
  { id: '50_50', label: '50% Advance, 50% against delivery' },
  { id: 'milestone', label: 'Progressive milestone billing as per submittals' },
];

export const DELIVERY_TERMS_PRESETS = [
  { id: 'ex_works', label: 'Ex-Works Al Mespar Warehouse (Jeddah)' },
  { id: 'ddp_site', label: 'DDP Delivered to Job Site with Offloading' },
  { id: 'lead_2_4', label: '2-4 Weeks from Official Purchase Order' },
  { id: 'lead_4_6', label: '4-6 Weeks from Official Purchase Order' },
  { id: 'lead_8_10', label: '8-10 Weeks for Imported Factory Packages' },
  { id: 'immediate', label: 'Ex-Stock Immediate Delivery' },
];

export const WARRANTY_PRESETS = [
  { id: '1_year', label: '1 Year Standard Manufacturer Warranty' },
  { id: '2_years', label: '2 Years Comprehensive Warranty' },
  { id: '5_years', label: '5 Years Manufacturer Warranty on Valve Bodies' },
  { id: '18_months', label: '18 Months from Delivery or 12 Months from Commissioning' },
];
