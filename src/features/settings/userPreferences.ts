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

const AVATARS_BUCKET = 'avatars';
const AVATAR_EXTENSIONS = ['jpg', 'png', 'webp'] as const;

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

  const path = `${userId}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
    });

  if (error) {
    throw error;
  }

  const stale = AVATAR_EXTENSIONS.filter(
    (item) => item !== extension,
  ).map((item) => `${userId}/avatar.${item}`);

  await supabase.storage.from(AVATARS_BUCKET).remove(stale);

  return path;
}

export async function getAvatarSignedUrl(
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deleteUserAvatar(
  userId: string,
  avatarPath: string | null,
): Promise<void> {
  if (!avatarPath) {
    return;
  }

  if (!avatarPath.startsWith(`${userId}/`)) {
    throw new Error('Invalid avatar path.');
  }

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .remove([avatarPath]);

  if (error) {
    throw error;
  }
}