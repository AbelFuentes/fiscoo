update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/xml', 'text/xml', 'application/pdf']
where id = 'invoices';

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on table public.%I from anon', t.tablename);
  end loop;
end $$;

alter default privileges in schema public revoke all on tables from anon;

drop policy if exists "invoice_items_insert_own" on public.invoice_items;
drop policy if exists "invoice_items_update_own" on public.invoice_items;

create policy "invoice_items_insert_own" on public.invoice_items
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid())
    )
  );

create policy "invoice_items_update_own" on public.invoice_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid())
    )
  );

drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;

create policy "expenses_insert_own" on public.expenses
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
  );

create policy "expenses_update_own" on public.expenses
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
  );

drop policy if exists "income_insert_own" on public.income;
drop policy if exists "income_update_own" on public.income;

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
