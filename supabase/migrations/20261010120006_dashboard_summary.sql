create or replace function public.get_dashboard_summary()
returns json
language sql
security invoker
set search_path = public
as $$
  select json_build_object(
    'clients_count',
    (select count(*) from public.clients where user_id = auth.uid()),

    'income_30d',
    (select coalesce(sum(amount), 0) from public.income
      where user_id = auth.uid()
        and received_at > current_date - 30
        and received_at <= current_date),

    'income_prev_30d',
    (select coalesce(sum(amount), 0) from public.income
      where user_id = auth.uid()
        and received_at > current_date - 60
        and received_at <= current_date - 30),

    'expenses_30d',
    (select coalesce(sum(amount), 0) from public.expenses
      where user_id = auth.uid()
        and spent_at > current_date - 30
        and spent_at <= current_date),

    'expenses_prev_30d',
    (select coalesce(sum(amount), 0) from public.expenses
      where user_id = auth.uid()
        and spent_at > current_date - 60
        and spent_at <= current_date - 30),

    'invoices_30d',
    (select count(*) from public.invoices
      where user_id = auth.uid()
        and issued_at > now() - interval '30 days'),

    'invoices_prev_30d',
    (select count(*) from public.invoices
      where user_id = auth.uid()
        and issued_at > now() - interval '60 days'
        and issued_at <= now() - interval '30 days')
  );
$$;

revoke all on function public.get_dashboard_summary() from public;
grant execute on function public.get_dashboard_summary() to authenticated;