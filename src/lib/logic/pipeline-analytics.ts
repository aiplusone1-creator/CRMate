import { Project, PipelineStage, Quotation } from '@/types/crm';

/**
 * Standard B2B Engineering Stage Probabilities for Weighted Forecasting
 */
export const STAGE_PROBABILITIES: Record<PipelineStage, number> = {
  lead: 0.10,                   // 10% Initial discovery
  qualification: 0.15,          // 15% Qualified lead
  rfq_processing: 0.20,         // 20% Request for Quotation received
  pricing: 0.30,                // 30% Estimating & BOQ preparation
  quotation_sent: 0.50,         // 50% Quotation delivered to contractor
  technical_submission: 0.65,   // 65% Technical submittal submitted
  technically_approved: 0.75,   // 75% Technical submittal approved by consultant
  negotiation: 0.85,            // 85% Final commercial negotiation
  won: 1.00,                    // 100% Deal closed won
  lost: 0.00,                   // 0% Deal lost
  hold: 0.10,                   // 10% Deal on hold
};

/**
 * Stage SLA Days before becoming Stale or Critical
 */
export const STAGE_SLA_DAYS: Record<PipelineStage, number> = {
  lead: 14,
  qualification: 10,
  rfq_processing: 7,
  pricing: 10,
  quotation_sent: 14,
  technical_submission: 21,
  technically_approved: 14,
  negotiation: 21,
  won: 9999,
  lost: 9999,
  hold: 60,
};

export interface StageAgingResult {
  daysInStage: number;
  slaDays: number;
  isStale: boolean;     // Exceeded 70% of SLA or up to SLA
  isCritical: boolean;  // Exceeded SLA
  badgeVariant: 'normal' | 'stale' | 'critical';
  labelAr: string;
  labelEn: string;
  badgeClass: string;
}

/**
 * Calculates how many days a project has been in its current stage
 * and evaluates its SLA status.
 */
export function getStageAgingInfo(project: Project): StageAgingResult {
  const isClosed = project.pipeline_stage === 'won' || project.pipeline_stage === 'lost';
  if (isClosed) {
    return {
      daysInStage: 0,
      slaDays: 9999,
      isStale: false,
      isCritical: false,
      badgeVariant: 'normal',
      labelAr: project.pipeline_stage === 'won' ? 'صفقة رابحة' : 'صفقة خاسرة',
      labelEn: project.pipeline_stage === 'won' ? 'Won Deal' : 'Lost Deal',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  // Calculate days in stage
  const rawDate = project.stage_entered_at || project.updated_at || project.created_at;
  const entryTime = new Date(rawDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - entryTime);
  const daysInStage = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const slaDays = STAGE_SLA_DAYS[project.pipeline_stage] || 14;
  const isCritical = daysInStage > slaDays;
  const isStale = !isCritical && daysInStage >= Math.ceil(slaDays * 0.7);

  let badgeVariant: 'normal' | 'stale' | 'critical' = 'normal';
  let badgeClass = 'bg-slate-50 text-slate-600 border-slate-200';

  if (isCritical) {
    badgeVariant = 'critical';
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse';
  } else if (isStale) {
    badgeVariant = 'stale';
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
  }

  const labelAr = `${daysInStage} يوم في المرحلة`;
  const labelEn = `${daysInStage}d in stage`;

  return {
    daysInStage,
    slaDays,
    isStale,
    isCritical,
    badgeVariant,
    labelAr,
    labelEn,
    badgeClass,
  };
}

/**
 * Calculates the representative commercial value for a project
 * (Latest Quotation if available, otherwise Estimated Value)
 */
export function getProjectCommercialValue(project: Project, quotations?: Quotation[]): number {
  if (project.final_won_value && project.final_won_value > 0) {
    return project.final_won_value;
  }

  if (quotations && quotations.length > 0) {
    const projectQuotes = quotations
      .filter(q => q.project_id === project.id && !q.is_archived)
      .sort((a, b) => b.version - a.version);
    if (projectQuotes.length > 0 && projectQuotes[0].amount > 0) {
      return projectQuotes[0].amount;
    }
  }

  return project.estimated_value || 0;
}

export interface PipelineForecastResult {
  totalGrossPipeline: number;
  totalWeightedPipeline: number;
  wonTotalValue: number;
  activeDealsCount: number;
  weightedProbabilityAvg: number;
  criticalAgingCount: number;
  staleAgingCount: number;
}

/**
 * Computes pipeline gross value and realistic weighted forecast
 */
export function calculatePipelineForecast(
  projects: Project[],
  quotations?: Quotation[]
): PipelineForecastResult {
  let totalGrossPipeline = 0;
  let totalWeightedPipeline = 0;
  let wonTotalValue = 0;
  let activeDealsCount = 0;
  let criticalAgingCount = 0;
  let staleAgingCount = 0;

  projects.forEach(p => {
    const commValue = getProjectCommercialValue(p, quotations);
    const prob = STAGE_PROBABILITIES[p.pipeline_stage] ?? 0.1;

    if (p.pipeline_stage === 'won') {
      wonTotalValue += commValue;
    } else if (p.pipeline_stage !== 'lost') {
      activeDealsCount += 1;
      totalGrossPipeline += commValue;
      totalWeightedPipeline += commValue * prob;

      const aging = getStageAgingInfo(p);
      if (aging.isCritical) criticalAgingCount += 1;
      else if (aging.isStale) staleAgingCount += 1;
    }
  });

  const weightedProbabilityAvg = totalGrossPipeline > 0
    ? Math.round((totalWeightedPipeline / totalGrossPipeline) * 100)
    : 0;

  return {
    totalGrossPipeline,
    totalWeightedPipeline: Math.round(totalWeightedPipeline),
    wonTotalValue,
    activeDealsCount,
    weightedProbabilityAvg,
    criticalAgingCount,
    staleAgingCount,
  };
}
