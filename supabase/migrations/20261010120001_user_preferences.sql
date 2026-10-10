create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,

  first_name text not null default '',
  last_name text not null default '',
  bio text not null default '',
  language text not null default 'es',
  avatar_url text,
  theme text not null default 'light',
  accent text not null default 'indigo',

  email_notifications boolean not null default true,
  push_notifications boolean not null default false,
  mention_notifications boolean not null default true,
  activity_summary text not null default 'weekly',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_preferences_language_check check (language in ('es', 'en', 'pt')),
  constraint user_preferences_theme_check check (theme in ('light', 'dark')),
  constraint user_preferences_accent_check check (accent in ('indigo', 'green', 'orange')),
  constraint user_preferences_activity_summary_check check (activity_summary in ('daily', 'weekly', 'never')),
  constraint user_preferences_bio_length_check check (char_length(bio) <= 160)
);

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own" on public.user_preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_preferences_insert_own" on public.user_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_preferences_update_own" on public.user_preferences
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "user_preferences_delete_own" on public.user_preferences
  for delete to authenticated using (user_id = (select auth.uid()));

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_select_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.user_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;