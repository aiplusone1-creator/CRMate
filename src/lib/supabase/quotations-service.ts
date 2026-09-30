import { createClient } from './client';
import { Quotation, QuotationStatus } from '@/types/crm';

/**
 * Service to execute quotation persistence against Supabase PostgreSQL.
 * If Supabase is not configured or network fails, operations gracefully return null or fallback
 * allowing CRMContext to handle offline/local caching seamlessly.
 */

export const quotationsService = {
  /**
   * Fetch all quotations for a specific project ordered by version descending
   */
  async getQuotationsByProject(projectId: string): Promise<Quotation[] | null> {
    try {
      const supabase = createClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_archived', false)
        .order('version', { ascending: false });

      if (error) {
        console.warn('Supabase fetch quotations error:', error.message);
        return null;
      }
      return data as Quotation[];
    } catch (e) {
      console.warn('Supabase quotation service getByProject error:', e);
      return null;
    }
  },

  /**
   * Safely determine the next version number for a quotation series in the database
   */
  async getNextVersionNumber(projectId: string, quotationNumber: string): Promise<number> {
    try {
      const supabase = createClient();
      if (!supabase) return 1;

      const { data, error } = await supabase
        .from('quotations')
        .select('version')
        .eq('project_id', projectId)
        .eq('quotation_number', quotationNumber)
        .order('version', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return 1;
      return (data[0].version || 0) + 1;
    } catch {
      return 1;
    }
  },

  /**
   * Insert a new quotation or revision into Supabase
   */
  async insertQuotation(quotation: Quotation): Promise<boolean> {
    try {
      const supabase = createClient();
      if (!supabase) return false;

      const payload = {
        id: quotation.id,
        project_id: quotation.project_id,
        quotation_number: quotation.quotation_number,
        version: quotation.version,
        amount: quotation.amount,
        total_amount: quotation.total_amount ?? quotation.amount,
        subtotal: quotation.subtotal ?? quotation.amount,
        discount_amount: quotation.discount_amount ?? 0,
        discount_percentage: quotation.discount_percentage ?? 0,
        tax_amount: quotation.tax_amount ?? 0,
        currency: quotation.currency || 'SAR',
        vendor_brand: quotation.vendor_brand,
        status: quotation.status,
        sent_date: quotation.sent_date || quotation.quotation_date,
        quotation_date: quotation.quotation_date || quotation.sent_date,
        valid_until: quotation.valid_until,
        file_url: quotation.file_url,
        file_name: quotation.file_name,
        file_size: quotation.file_size,
        notes: quotation.notes,
        customer_reference: quotation.customer_reference,
        rfq_number: quotation.rfq_number,
        revision_reason: quotation.revision_reason,
        payment_terms: quotation.payment_terms,
        delivery_terms: quotation.delivery_terms,
        warranty_terms: quotation.warranty_terms,
        technical_notes: quotation.technical_notes,
        previous_version_id: quotation.previous_version_id,
        is_archived: quotation.is_archived ?? false,
        created_by: quotation.created_by,
        created_at: quotation.created_at,
        updated_at: quotation.updated_at,
      };

      const { error } = await supabase.from('quotations').insert(payload);
      if (error) {
        console.warn('Supabase insert quotation error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase quotation insert error:', e);
      return false;
    }
  },

  /**
   * Update quotation status in Supabase
   */
  async updateStatus(id: string, status: QuotationStatus): Promise<boolean> {
    try {
      const supabase = createClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from('quotations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Supabase update quotation status error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase update status error:', e);
      return false;
    }
  },

  /**
   * Soft-delete / archive quotation in Supabase
   */
  async archiveQuotation(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from('quotations')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Supabase archive quotation error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase archive quotation error:', e);
      return false;
    }
  },

  /**
   * Update quotation details and amounts in Supabase
   */
  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<boolean> {
    try {
      const supabase = createClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from('quotations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Supabase update quotation error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase update quotation error:', e);
      return false;
    }
  },

  /**
   * Delete quotation permanently from Supabase
   */
  async deleteQuotation(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase delete quotation error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase delete quotation error:', e);
      return false;
    }
  },
};

