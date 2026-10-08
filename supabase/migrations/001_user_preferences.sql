create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,

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

  constraint user_preferences_language_check
    check (language in ('es', 'en', 'pt')),

  constraint user_preferences_theme_check
    check (theme in ('light', 'dark')),

  constraint user_preferences_accent_check
    check (accent in ('indigo', 'green', 'orange')),

  constraint user_preferences_activity_summary_check
    check (activity_summary in ('daily', 'weekly', 'never')),

  constraint user_preferences_bio_length_check
    check (char_length(bio) <= 160)
);

alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
on public.user_preferences
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own preferences"
on public.user_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
on public.user_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own preferences"
on public.user_preferences
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.update_user_preferences_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.update_user_preferences_updated_at();
