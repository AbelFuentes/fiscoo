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
    .upsert(
      preferences,
      {
        onConflict: 'user_id',
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as UserPreferences;
}

export async function uploadUserAvatar(
  userId: string,
  file: File,
): Promise<string> {
  const extension =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : 'jpg';

  const path =
    `${userId}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(
      path,
      file,
      {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      },
    );

  if (error) {
    throw error;
  }

  const {
    data: publicUrlData,
  } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

export async function deleteUserAvatar(
  userId: string,
  avatarUrl: string | null,
): Promise<void> {
  if (!avatarUrl) {
    return;
  }

  const marker =
    `/storage/v1/object/public/avatars/`;

  const index =
    avatarUrl.indexOf(marker);

  if (index === -1) {
    return;
  }

  const path =
    avatarUrl.slice(
      index + marker.length,
    );

  const expectedPrefix =
    `${userId}/`;

  if (!path.startsWith(expectedPrefix)) {
    throw new Error(
      'Invalid avatar path.',
    );
  }

  const { error } = await supabase.storage
    .from('avatars')
    .remove([path]);

  if (error) {
    throw error;
  }
}
