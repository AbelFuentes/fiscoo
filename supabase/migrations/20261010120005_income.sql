create table public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,

  description text not null,
  category text not null default 'other',
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'MXN',
  received_at date not null default current_date,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index income_user_received_idx on public.income (user_id, received_at desc);
create index income_invoice_idx on public.income (invoice_id);
create index income_client_idx on public.income (client_id);

create trigger income_set_updated_at
before update on public.income
for each row execute function public.set_updated_at();

alter table public.income enable row level security;

create policy "income_select_own" on public.income
  for select to authenticated using (user_id = (select auth.uid()));
create policy "income_insert_own" on public.income
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      invoice_id is null
      or exists (
        select 1 from public.invoices i
        where i.id = invoice_id and i.user_id = (select auth.uid())
      )
    )
    and (
      client_id is null
      or exists (
        select 1 from public.clients c
        where c.id = client_id and c.user_id = (select auth.uid())
      )
    )
  );
create policy "income_update_own" on public.income
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      invoice_id is null
      or exists (
        select 1 from public.invoices i
        where i.id = invoice_id and i.user_id = (select auth.uid())
      )
    )
    and (
      client_id is null
      or exists (
        select 1 from public.clients c
        where c.id = client_id and c.user_id = (select auth.uid())
      )
    )
  );
create policy "income_delete_own" on public.income
  for delete to authenticated using (user_id = (select auth.uid()));