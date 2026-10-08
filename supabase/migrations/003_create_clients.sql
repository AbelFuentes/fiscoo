create table public.clients (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

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

  constraint clients_person_type_check
    check (person_type in ('individual', 'business')),

  constraint clients_legal_name_length_check
    check (
      char_length(trim(legal_name)) between 1 and 254
    ),

  constraint clients_rfc_length_check
    check (
      char_length(trim(rfc)) between 12 and 13
    ),

  constraint clients_tax_zip_code_check
    check (
      tax_zip_code ~ '^[0-9]{5}$'
    ),

  constraint clients_email_length_check
    check (
      email is null
      or char_length(email) <= 254
    ),

  constraint clients_phone_length_check
    check (
      phone is null
      or char_length(phone) <= 30
    ),

  constraint clients_notes_length_check
    check (
      notes is null
      or char_length(notes) <= 1000
    ),

  constraint clients_rfc_unique_per_user
    unique (user_id, rfc)
);


alter table public.clients enable row level security;


create policy "Users can view their own clients"
on public.clients
for select
to authenticated
using (
  auth.uid() = user_id
);


create policy "Users can create their own clients"
on public.clients
for insert
to authenticated
with check (
  auth.uid() = user_id
);


create policy "Users can update their own clients"
on public.clients
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


create policy "Users can delete their own clients"
on public.clients
for delete
to authenticated
using (
  auth.uid() = user_id
);


create or replace function public.update_clients_updated_at()
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


create trigger clients_updated_at
before update on public.clients
for each row
execute function public.update_clients_updated_at();


create index clients_user_id_idx
on public.clients(user_id);

create index clients_rfc_idx
on public.clients(user_id, rfc);

create index clients_legal_name_idx
on public.clients(user_id, legal_name);
