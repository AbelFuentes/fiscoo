import { supabase } from '../../lib/supabase';

export type IncomeRecord = {
  id: string;
  user_id: string;
  invoice_id: string | null;
  client_id: string | null;
  description: string;
  category: string;
  amount: number;
  currency: string;
  received_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type IncomeInput = {
  description: string;
  category: string;
  amount: number;
  received_at: string;
  client_id?: string | null;
  notes?: string | null;
};

export async function getIncome(
  userId: string,
): Promise<IncomeRecord[]> {
  const { data, error } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', userId)
    .order('received_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as IncomeRecord[];
}

export async function createIncome(
  userId: string,
  input: IncomeInput,
): Promise<IncomeRecord> {
  const payload = {
    user_id: userId,
    description: input.description.trim(),
    category: input.category,
    amount: input.amount,
    received_at: input.received_at,
    client_id: input.client_id || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('income')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as IncomeRecord;
}

export async function deleteIncome(
  userId: string,
  incomeId: string,
): Promise<void> {
  const { error } = await supabase
    .from('income')
    .delete()
    .eq('user_id', userId)
    .eq('id', incomeId);

  if (error) {
    throw error;
  }
}
