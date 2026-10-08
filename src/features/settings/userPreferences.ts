import { supabase } from '../../lib/supabase';

export type UserPreferences = {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  language: 'es' | 'en' | 'pt';
  avatar_url: string | null;
  theme: 'light' | 'dark';
  accent: 'indigo' | 'green' | 'orange';
  email_notifications: boolean;
  push_notifications: boolean;
  mention_notifications: boolean;
  activity_summary: 'daily' | 'weekly' | 'never';
  created_at: string;
  updated_at: string;
};

export type UserPreferencesInput = Omit<
  UserPreferences,
  'created_at' | 'updated_at'
>;

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as UserPreferences | null;
}

export async function saveUserPreferences(
  preferences: UserPreferencesInput,
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(preferences, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as UserPreferences;
}
