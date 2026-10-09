import { supabase } from '../../lib/supabase';

export type Expense = {
  id: string;
  user_id: string;
  invoice_id: string | null;
  description: string;
  category: string;
  amount: number;
  currency: string;
  spent_at: string;
  is_deductible: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseInput = {
  description: string;
  category: string;
  amount: number;
  spent_at: string;
  is_deductible: boolean;
  notes?: string | null;
};

export async function getExpenses(
  userId: string,
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('spent_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Expense[];
}

export async function createExpense(
  userId: string,
  input: ExpenseInput,
): Promise<Expense> {
  const payload = {
    user_id: userId,
    description: input.description.trim(),
    category: input.category,
    amount: input.amount,
    spent_at: input.spent_at,
    is_deductible: input.is_deductible,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Expense;
}

export async function deleteExpense(
  userId: string,
  expenseId: string,
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('user_id', userId)
    .eq('id', expenseId);

  if (error) {
    throw error;
  }
}
