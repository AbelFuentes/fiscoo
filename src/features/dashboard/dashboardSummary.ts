import { supabase } from '../../lib/supabase';
import type { Invoice } from '../invoices/userInvoices';

export type DashboardSummary = {
  clients_count: number;
  income_30d: number;
  income_prev_30d: number;
  expenses_30d: number;
  expenses_prev_30d: number;
  invoices_30d: number;
  invoices_prev_30d: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc(
    'get_dashboard_summary',
  );

  if (error) {
    throw error;
  }

  return {
    clients_count: Number(data?.clients_count ?? 0),
    income_30d: Number(data?.income_30d ?? 0),
    income_prev_30d: Number(data?.income_prev_30d ?? 0),
    expenses_30d: Number(data?.expenses_30d ?? 0),
    expenses_prev_30d: Number(data?.expenses_prev_30d ?? 0),
    invoices_30d: Number(data?.invoices_30d ?? 0),
    invoices_prev_30d: Number(data?.invoices_prev_30d ?? 0),
  };
}

export async function getRecentInvoices(
  userId: string,
  limit = 8,
): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as Invoice[];
}
