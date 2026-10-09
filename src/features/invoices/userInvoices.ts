import { supabase } from '../../lib/supabase';

export type InvoiceDirection = 'issued' | 'received';
export type InvoiceStatus = 'active' | 'cancelled';
export type VoucherType = 'I' | 'E' | 'T' | 'P' | 'N';

export type Invoice = {
  id: string;
  user_id: string;
  direction: InvoiceDirection;
  status: InvoiceStatus;
  cfdi_uuid: string;
  cfdi_version: string | null;
  voucher_type: VoucherType;
  series: string | null;
  folio: string | null;
  issued_at: string;
  issuer_rfc: string;
  issuer_name: string | null;
  receiver_rfc: string;
  receiver_name: string | null;
  currency: string;
  exchange_rate: number | null;
  subtotal: number;
  tax_total: number;
  total: number;
  payment_method: string | null;
  payment_form: string | null;
  cfdi_use: string | null;
  xml_path: string | null;
  pdf_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceInput = {
  direction: InvoiceDirection;
  voucher_type: VoucherType;
  cfdi_uuid: string;
  series?: string | null;
  folio?: string | null;
  issued_at: string;
  issuer_rfc: string;
  issuer_name?: string | null;
  receiver_rfc: string;
  receiver_name?: string | null;
  currency: string;
  subtotal: number;
  tax_total: number;
  total: number;
  payment_method?: string | null;
  payment_form?: string | null;
  cfdi_use?: string | null;
  notes?: string | null;
};

const clean = (value?: string | null) => value?.trim() || null;

export async function getInvoices(
  userId: string,
): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Invoice[];
}

export async function getInvoice(
  userId: string,
  invoiceId: string,
): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .eq('id', invoiceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Invoice | null;
}

export async function createInvoice(
  userId: string,
  input: InvoiceInput,
): Promise<Invoice> {
  const payload = {
    user_id: userId,
    direction: input.direction,
    voucher_type: input.voucher_type,
    cfdi_uuid: input.cfdi_uuid.trim().toUpperCase(),
    series: clean(input.series),
    folio: clean(input.folio),
    issued_at: input.issued_at,
    issuer_rfc: input.issuer_rfc.trim().toUpperCase(),
    issuer_name: clean(input.issuer_name),
    receiver_rfc: input.receiver_rfc.trim().toUpperCase(),
    receiver_name: clean(input.receiver_name),
    currency: input.currency.trim().toUpperCase() || 'MXN',
    subtotal: input.subtotal,
    tax_total: input.tax_total,
    total: input.total,
    payment_method: clean(input.payment_method),
    payment_form: clean(input.payment_form),
    cfdi_use: clean(input.cfdi_use)?.toUpperCase() ?? null,
    notes: clean(input.notes),
  };

  const { data, error } = await supabase
    .from('invoices')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Invoice;
}

export async function deleteInvoice(
  userId: string,
  invoiceId: string,
): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('user_id', userId)
    .eq('id', invoiceId);

  if (error) {
    throw error;
  }
}
