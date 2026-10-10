create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  person_type text not null default 'individual',
  legal_name text not null,
  rfc text not null,
  tax_regime text not null,
  tax_zip_code text not null,
  cfdi_use text not null default 'G03',

  email text,
  phone text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clients_person_type_check check (person_type in ('individual', 'business')),
  constraint clients_legal_name_length_check check (char_length(trim(legal_name)) between 1 and 254),
  constraint clients_rfc_length_check check (char_length(trim(rfc)) between 12 and 13),
  constraint clients_tax_zip_code_check check (tax_zip_code ~ '^[0-9]{5}$'),
  constraint clients_email_length_check check (email is null or char_length(email) <= 254),
  constraint clients_phone_length_check check (phone is null or char_length(phone) <= 30),
  constraint clients_notes_length_check check (notes is null or char_length(notes) <= 1000),
  constraint clients_rfc_unique_per_user unique (user_id, rfc)
);

create index clients_legal_name_idx on public.clients (user_id, legal_name);

alter table public.clients enable row level security;

create policy "clients_select_own" on public.clients
  for select to authenticated using (user_id = (select auth.uid()));
create policy "clients_insert_own" on public.clients
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "clients_update_own" on public.clients
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "clients_delete_own" on public.clients
  for delete to authenticated using (user_id = (select auth.uid()));

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();