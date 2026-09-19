import { 
  Project, 
  Contact, 
  Company, 
  ActivityChannel, 
  ActivityOutcome, 
  VisitPurpose,
  Profile 
} from '@/types/crm';

export interface ParsedActivityDraft {
  id: string;
  project_id?: string;
  project_name?: string;
  company_id?: string;
  company_name?: string;
  contact_id?: string;
  contact_name?: string;
  channel: ActivityChannel;
  visit_purpose: VisitPurpose;
  outcome: ActivityOutcome;
  notes: string;
  activity_date: string;
  matched_keyword?: string;
  confidence?: number;
}

interface ParserContext {
  projects: Project[];
  contacts: Contact[];
  companies: Company[];
  defaultDate: string;
  currentUser?: Profile;
}

/**
 * Normalize Arabic text for reliable string and keyword matching
 * (Removes diacritics, unifies alef, taa marbuta, etc.)
 */
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel/harakat
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[ـ]/g, '') // Tatweel
    .trim();
}

/**
 * Split a continuous daily narrative into individual activity segment sentences
 */
function splitNarrationIntoSegments(rawText: string): string[] {
  if (!rawText.trim()) return [];

  // Punctuation and transition splits
  // Common Arabic transitional words between consecutive activities:
  // "وبعدين", "وبعدها", "ثم", "بعد كده", "وفي العصر", "بعد الظهر", "واخر اليوم", "كمان", "وايضاً", "بالاضافة", "وفي الصباح"
  const transitionRegex = /(?:[\.\n\r;،؛\?!]+|\s+(?:وبعدين|وبعدها|ثم|بعد\s+كده|وفي\s+العصر|بعد\s+الظهر|واخر\s+اليوم|كمان|وايضا|وايضاً|بالاضافة|وفي\s+الصباح|وقبل\s+نهاية\s+الدوام|بعدين)\s+)/gi;

  const rawSegments = rawText.split(transitionRegex);

  // Filter out tiny or whitespace-only segments
  const validSegments = rawSegments
    .map(s => s.trim())
    .filter(s => s.length > 5);

  return validSegments.length > 0 ? validSegments : [rawText.trim()];
}

/**
 * Infer activity channel from spoken Arabic keywords
 */
function inferChannel(text: string): ActivityChannel {
  const norm = normalizeArabic(text);

  // Call keywords
  if (
    norm.includes('كلمت') || 
    norm.includes('اتصلت') || 
    norm.includes('تليفون') || 
    norm.includes('مكالمه') || 
    norm.includes('اتصال') || 
    norm.includes('تواصلت تلفونيا') ||
    norm.includes('هاتف') ||
    norm.includes('call')
  ) {
    return 'call';
  }

  // F2F Meeting keywords
  if (
    norm.includes('اجتماع') || 
    norm.includes('قابلت') || 
    norm.includes('اجتمعت') || 
    norm.includes('جلسه') || 
    norm.includes('فيس تو فيس') ||
    norm.includes('meeting')
  ) {
    return 'meeting_f2f';
  }

  // Visit / Field Hunting keywords
  if (
    norm.includes('نزلت') || 
    norm.includes('زرت') || 
    norm.includes('زياره') || 
    norm.includes('موقع') || 
    norm.includes('رحت لـ') || 
    norm.includes('رحت ل') || 
    norm.includes('مكتبهم') || 
    norm.includes('في الشركه') ||
    norm.includes('visit')
  ) {
    return 'visit';
  }

  // Online Meeting keywords
  if (
    norm.includes('زووم') || 
    norm.includes('تيمز') || 
    norm.includes('اونلاين') || 
    norm.includes('zoom') || 
    norm.includes('teams')
  ) {
    return 'meeting_online';
  }

  // Email / Quotation submission keywords
  if (
    norm.includes('ايميل') || 
    norm.includes('بريد') || 
    norm.includes('ميل') || 
    norm.includes('email') ||
    norm.includes('ارسلت العرض') ||
    norm.includes('بعت العرض')
  ) {
    return 'email';
  }

  // Default to Call as most common sales touchpoint
  return 'call';
}

/**
 * Infer activity outcome from spoken Arabic keywords
 */
function inferOutcome(text: string): ActivityOutcome {
  const norm = normalizeArabic(text);

  if (norm.includes('ميعاد') || norm.includes('موعد') || norm.includes('حددنا اجتماع') || norm.includes('اتفقنا نتقابل')) {
    return 'meeting_booked';
  }

  if (norm.includes('طلبوا عرض') || norm.includes('عرض سعر') || norm.includes('كوتيشن') || norm.includes('rfq') || norm.includes('تسعير')) {
    return 'rfq_received';
  }

  if (norm.includes('بعت العرض') || norm.includes('سلمت العرض') || norm.includes('ارسلت الكوتيشن')) {
    return 'quotation_sent';
  }

  if (norm.includes('هيردوا') || norm.includes('مستني رد') || norm.includes('هيدرسوا') || norm.includes('بيدرسوا') || norm.includes('متابعه')) {
    return 'awaiting_feedback';
  }

  if (norm.includes('ما ردش') || norm.includes('مبيردش') || norm.includes('مش متاح') || norm.includes('مغلق') || norm.includes('كنسل')) {
    return 'no_answer';
  }

  if (norm.includes('وافقوا') || norm.includes('اتعمد') || norm.includes('تم الترسيه') || norm.includes('كسبنا')) {
    return 'won';
  }

  if (norm.includes('رفضوا') || norm.includes('خسرنا') || norm.includes('مش مهتمين') || norm.includes('اعتذروا')) {
    return 'lost';
  }

  return 'connected';
}

/**
 * Infer visit/activity purpose
 */
function inferVisitPurpose(text: string): VisitPurpose {
  const norm = normalizeArabic(text);

  if (norm.includes('متابعه') || norm.includes('فولو اب') || norm.includes('بتابع')) {
    return 'follow_up';
  }

  if (norm.includes('جديد') || norm.includes('فرصه جديده') || norm.includes('عميل جديد') || norm.includes('اول مره')) {
    return 'new_lead';
  }

  if (norm.includes('كتالوج') || norm.includes('فني') || norm.includes('مواصفات') || norm.includes('استشاري') || norm.includes('اعتماد')) {
    return 'technical_clarification';
  }

  if (norm.includes('تسليم عرض') || norm.includes('عرض سعر') || norm.includes('تسليم كوتيشن')) {
    return 'quotation_delivery';
  }

  return 'customer_visit';
}

/**
 * Match project from text
 */
function matchProject(segment: string, projects: Project[]): { project?: Project; confidence: number } {
  if (!projects || projects.length === 0) return { confidence: 0 };
  const normSegment = normalizeArabic(segment);

  let bestMatch: Project | undefined;
  let highestScore = 0;

  for (const proj of projects) {
    const normProjName = normalizeArabic(proj.name);
    const normPrNumber = proj.pr_number ? normalizeArabic(proj.pr_number) : '';
    const normCompName = proj.company_name ? normalizeArabic(proj.company_name) : '';

    // Direct PR number match (highest confidence)
    if (normPrNumber && normSegment.includes(normPrNumber)) {
      return { project: proj, confidence: 1.0 };
    }

    // Exact or strong substring name match
    if (normProjName && normSegment.includes(normProjName)) {
      const score = normProjName.length / Math.max(normProjName.length, 10);
      if (score > highestScore) {
        highestScore = Math.max(0.9, score);
        bestMatch = proj;
      }
    }

    // Check project name words (tokens)
    const tokens = normProjName.split(/\s+/).filter(t => t.length > 3);
    let matchedTokensCount = 0;
    for (const token of tokens) {
      if (normSegment.includes(token)) {
        matchedTokensCount++;
      }
    }

    if (tokens.length > 0 && matchedTokensCount > 0) {
      const tokenScore = (matchedTokensCount / tokens.length) * 0.85;
      if (tokenScore > highestScore) {
        highestScore = tokenScore;
        bestMatch = proj;
      }
    }

    // Company name mentioned in relation to project
    if (normCompName && normSegment.includes(normCompName)) {
      if (highestScore < 0.7) {
        highestScore = 0.7;
        bestMatch = proj;
      }
    }
  }

  return { project: bestMatch, confidence: highestScore };
}

/**
 * Match contact or company from segment
 */
function matchContactAndCompany(
  segment: string, 
  contacts: Contact[], 
  companies: Company[], 
  matchedProject?: Project
): { contact?: Contact; company?: Company } {
  const normSegment = normalizeArabic(segment);

  let matchedCompany: Company | undefined;
  let matchedContact: Contact | undefined;

  // If project is already matched, inherit its company
  if (matchedProject?.company_id) {
    matchedCompany = companies.find(c => c.id === matchedProject.company_id);
  }

  // Look for company mention in text
  for (const comp of companies) {
    const normComp = normalizeArabic(comp.name);
    if (normComp.length > 3 && normSegment.includes(normComp)) {
      matchedCompany = comp;
      break;
    }
  }

  // Look for contact mention in text
  for (const cont of contacts) {
    const normName = normalizeArabic(cont.full_name);
    const firstName = normName.split(' ')[0];
    if (firstName && firstName.length > 2 && normSegment.includes(firstName)) {
      matchedContact = cont;
      if (!matchedCompany && cont.company_id) {
        matchedCompany = companies.find(c => c.id === cont.company_id);
      }
      break;
    }
  }

  // Fallback to project's primary contact
  if (!matchedContact && matchedProject?.primary_contact_id) {
    matchedContact = contacts.find(c => c.id === matchedProject.primary_contact_id);
  }

  return { contact: matchedContact, company: matchedCompany };
}

/**
 * Formulate clean notes from segment
 */
function cleanSegmentNotes(segment: string): string {
  let cleaned = segment.trim();
  // Capitalize first letter or keep Arabic punctuation tidy
  cleaned = cleaned.replace(/^[\s,;،]+/, '').replace(/[\s,;،]+$/, '');
  return cleaned;
}

/**
 * Main parser: takes spoken raw text and extracts structured activity drafts
 */
export function parseDayNarration(rawText: string, context: ParserContext): ParsedActivityDraft[] {
  if (!rawText || !rawText.trim()) return [];

  const segments = splitNarrationIntoSegments(rawText);
  const drafts: ParsedActivityDraft[] = [];

  segments.forEach((seg, index) => {
    const channel = inferChannel(seg);
    const outcome = inferOutcome(seg);
    const visitPurpose = inferVisitPurpose(seg);
    const { project, confidence } = matchProject(seg, context.projects);
    const { contact, company } = matchContactAndCompany(seg, context.contacts, context.companies, project);

    const notes = cleanSegmentNotes(seg);

    drafts.push({
      id: `voice_draft_${Date.now()}_${index}`,
      project_id: project?.id,
      project_name: project?.name,
      company_id: company?.id || project?.company_id,
      company_name: company?.name || project?.company_name,
      contact_id: contact?.id || project?.primary_contact_id,
      contact_name: contact?.full_name || project?.primary_contact_name,
      channel,
      visit_purpose: visitPurpose,
      outcome,
      notes,
      activity_date: context.defaultDate,
      confidence: confidence || 0.5
    });
  });

  return drafts;
}
