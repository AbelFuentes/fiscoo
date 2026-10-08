import { supabase } from '../../lib/supabase';

export type ClientPersonType =
  | 'individual'
  | 'business';

export type Client = {
  id: string;
  user_id: string;
  person_type: ClientPersonType;
  legal_name: string;
  rfc: string;
  tax_regime: string;
  tax_zip_code: string;
  cfdi_use: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientInput = {
  person_type: ClientPersonType;
  legal_name: string;
  rfc: string;
  tax_regime: string;
  tax_zip_code: string;
  cfdi_use: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export async function getClients(
  userId: string,
): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('legal_name', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Client[];
}

export async function getClient(
  userId: string,
  clientId: string,
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .eq('id', clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Client | null;
}

export async function createClient(
  userId: string,
  input: ClientInput,
): Promise<Client> {
  const payload = {
    user_id: userId,
    person_type: input.person_type,
    legal_name: input.legal_name.trim(),
    rfc: input.rfc.trim().toUpperCase(),
    tax_regime: input.tax_regime,
    tax_zip_code: input.tax_zip_code.trim(),
    cfdi_use: input.cfdi_use,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Client;
}

export async function updateClient(
  userId: string,
  clientId: string,
  input: ClientInput,
): Promise<Client> {
  const payload = {
    person_type: input.person_type,
    legal_name: input.legal_name.trim(),
    rfc: input.rfc.trim().toUpperCase(),
    tax_regime: input.tax_regime,
    tax_zip_code: input.tax_zip_code.trim(),
    cfdi_use: input.cfdi_use,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('user_id', userId)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Client;
}

export async function deleteClient(
  userId: string,
  clientId: string,
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('user_id', userId)
    .eq('id', clientId);

  if (error) {
    throw error;
  }
}
