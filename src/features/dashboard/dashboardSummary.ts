import { supabase } from '../../lib/supabase';

export type DashboardSummary = {
  clients_count: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc(
    'get_dashboard_summary',
  );

  if (error) {
    throw error;
  }

  return {
    clients_count: Number(
      data?.clients_count ?? 0,
    ),
  };
}
