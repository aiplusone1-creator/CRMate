import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencySAR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "SAR 0";
  if (amount >= 1_000_000) {
    return `SAR ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `SAR ${(amount / 1_000).toFixed(1)}K`;
  }
  return `SAR ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1) return `${diffDays} days ago`;
    if (diffDays === -1) return "Tomorrow";
    if (diffDays < -1) return `In ${Math.abs(diffDays)} days`;
    return "Today";
  } catch {
    return dateStr;
  }
}

export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("05") && cleaned.length === 10) {
    return `966${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("5") && cleaned.length === 9) {
    return `966${cleaned}`;
  }
  return cleaned;
}

export function formatDisplayPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("966") && digits.length === 12) {
    return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.startsWith("05") && digits.length === 10) {
    return `0${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.startsWith("5") && digits.length === 9) {
    return `+966 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

import type { Project, ProjectHealth } from "@/types/crm";

export function computeProjectHealth(project: Project): { health: ProjectHealth; daysOverdue: number } {
  if (project.pipeline_stage === 'won' || project.pipeline_stage === 'lost' || project.pipeline_stage === 'hold') {
    return { health: 'neutral', daysOverdue: 0 };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  let daysOverdue = 0;
  if (project.next_follow_up_at) {
    const fDate = new Date(project.next_follow_up_at.split('T')[0]);
    const diff = Math.floor((today.getTime() - fDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) {
      daysOverdue = diff;
      return { health: 'red', daysOverdue };
    }
    if (diff >= -2) {
      return { health: 'yellow', daysOverdue: 0 };
    }
  } else {
    // Missing next follow up
    return { health: 'red', daysOverdue: 0 };
  }

  if (!project.next_action || project.next_action.trim() === '') {
    return { health: 'red', daysOverdue: 0 };
  }

  if (project.last_activity_at) {
    const lDate = new Date(project.last_activity_at.split('T')[0]);
    const inactiveDays = Math.floor((today.getTime() - lDate.getTime()) / (1000 * 60 * 60 * 24));
    if (inactiveDays > 14) return { health: 'red', daysOverdue: 0 };
    if (inactiveDays > 7) return { health: 'yellow', daysOverdue: 0 };
  } else {
    return { health: 'red', daysOverdue: 0 };
  }

  return { health: 'green', daysOverdue: 0 };
}

/**
 * Calculates the Saturday that starts the week for any given date.
 * In the Saudi/Gulf business week, weeks start on Saturday and run through Thursday/Friday.
 * @param referenceDate Base date (defaults to current date)
 * @param weekOffset Number of weeks offset (+1 for next week, -1 for previous week, 0 for this week)
 * @returns Date object representing the Saturday (at midnight) of that week
 */
export function getSaturdayOfWeek(referenceDate: Date = new Date(), weekOffset: number = 0): Date {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysSinceSaturday = (dayOfWeek + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday + (weekOffset * 7));
  return d;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateStr(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}



