import { supabase } from '../../lib/supabase';
import type { ParsedCfdi } from './cfdi';

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

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  user_id: string;
  position: number;
  description: string;
  product_key: string | null;
  unit_key: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_amount: number;
};

export async function getInvoiceItems(
  userId: string,
  invoiceId: string,
): Promise<InvoiceItem[]> {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('user_id', userId)
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as InvoiceItem[];
}

const BUCKET = 'invoices';

export async function importInvoice(
  userId: string,
  cfdi: ParsedCfdi,
  files: { xml: File; pdf?: File | null },
  direction: InvoiceDirection,
): Promise<Invoice> {
  const uuid = cfdi.stamp.uuid.toUpperCase();
  const xmlPath = `${userId}/${uuid}.xml`;
  const pdfPath = files.pdf ? `${userId}/${uuid}.pdf` : null;

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      direction,
      voucher_type: cfdi.voucher_type,
      cfdi_uuid: uuid,
      cfdi_version: cfdi.version || null,
      series: cfdi.series,
      folio: cfdi.folio,
      issued_at: cfdi.issued_at,
      issuer_rfc: cfdi.issuer.rfc,
      issuer_name: cfdi.issuer.name,
      receiver_rfc: cfdi.receiver.rfc,
      receiver_name: cfdi.receiver.name,
      currency: cfdi.currency,
      exchange_rate: cfdi.exchange_rate,
      subtotal: cfdi.subtotal,
      tax_total: cfdi.tax_total,
      total: cfdi.total,
      payment_method: cfdi.payment_method,
      payment_form: cfdi.payment_form,
      cfdi_use: cfdi.receiver.cfdi_use,
      xml_path: xmlPath,
      pdf_path: pdfPath,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const invoice = data as Invoice;

  try {
    if (cfdi.concepts.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          cfdi.concepts.map((concept, index) => ({
            invoice_id: invoice.id,
            user_id: userId,
            position: index,
            description: concept.description,
            product_key: concept.product_key,
            unit_key: concept.unit_key,
            quantity: concept.quantity,
            unit_price: concept.unit_price,
            amount: concept.amount,
            tax_amount: concept.tax_amount,
          })),
        );

      if (itemsError) throw itemsError;
    }

    const xmlUpload = await supabase.storage
      .from(BUCKET)
      .upload(xmlPath, files.xml, {
        contentType: 'application/xml',
        upsert: true,
      });

    if (xmlUpload.error) throw xmlUpload.error;

    if (files.pdf && pdfPath) {
      const pdfUpload = await supabase.storage
        .from(BUCKET)
        .upload(pdfPath, files.pdf, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (pdfUpload.error) throw pdfUpload.error;
    }
  } catch (uploadError) {
    await supabase
      .from('invoices')
      .delete()
      .eq('user_id', userId)
      .eq('id', invoice.id);

    await supabase.storage
      .from(BUCKET)
      .remove(pdfPath ? [xmlPath, pdfPath] : [xmlPath]);

    throw uploadError;
  }

  return invoice;
}

export async function downloadInvoiceText(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (error) {
    throw error;
  }

  return data.text();
}

export async function openInvoiceFile(path: string): Promise<void> {
  const popup = window.open('', '_blank');

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (error) {
    popup?.close();
    throw error;
  }

  if (popup) {
    popup.opener = null;
    popup.location.href = data.signedUrl;
  } else {
    window.location.href = data.signedUrl;
  }
}