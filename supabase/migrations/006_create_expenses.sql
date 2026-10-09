create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete set null,

  description text not null,
  category text not null default 'other',
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'MXN',
  spent_at date not null default current_date,
  is_deductible boolean not null default false,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_user_spent_idx on public.expenses (user_id, spent_at desc);
create index expenses_invoice_idx on public.expenses (invoice_id);

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
  for select to authenticated using (user_id = (select auth.uid()));
create policy "expenses_insert_own" on public.expenses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "expenses_update_own" on public.expenses
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "expenses_delete_own" on public.expenses
  for delete to authenticated using (user_id = (select auth.uid()));
  