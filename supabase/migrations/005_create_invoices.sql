create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  direction text not null default 'received'
    check (direction in ('issued', 'received')),
  status text not null default 'active'
    check (status in ('active', 'cancelled')),

  cfdi_uuid text not null,
  cfdi_version text,
  voucher_type text not null default 'I'
    check (voucher_type in ('I', 'E', 'T', 'P', 'N')),
  series text,
  folio text,
  issued_at timestamptz not null,

  issuer_rfc text not null,
  issuer_name text,
  receiver_rfc text not null,
  receiver_name text,

  currency text not null default 'MXN',
  exchange_rate numeric(14, 6),
  subtotal numeric(14, 2) not null default 0,
  tax_total numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,

  payment_method text,
  payment_form text,
  cfdi_use text,

  xml_path text,
  pdf_path text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, cfdi_uuid)
);

create index invoices_user_issued_idx on public.invoices (user_id, issued_at desc);
create index invoices_user_direction_idx on public.invoices (user_id, direction);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  position int not null default 0,
  description text not null,
  product_key text,
  unit_key text,
  quantity numeric(14, 6) not null default 1,
  unit_price numeric(14, 6) not null default 0,
  amount numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0
);

create index invoice_items_invoice_idx on public.invoice_items (invoice_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "invoices_select_own" on public.invoices
  for select to authenticated using (user_id = (select auth.uid()));
create policy "invoices_insert_own" on public.invoices
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "invoices_update_own" on public.invoices
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "invoices_delete_own" on public.invoices
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "invoice_items_select_own" on public.invoice_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "invoice_items_insert_own" on public.invoice_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "invoice_items_update_own" on public.invoice_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "invoice_items_delete_own" on public.invoice_items
  for delete to authenticated using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

create policy "invoices_files_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "invoices_files_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "invoices_files_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "invoices_files_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = (select auth.uid())::text);