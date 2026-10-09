create or replace function public.get_dashboard_summary()
returns json
language sql
security invoker
set search_path = public
as $$
  select json_build_object(
    'clients_count',
    (
      select count(*)
      from public.clients
      where user_id = auth.uid()
    )
  );
$$;

revoke all on function public.get_dashboard_summary() from public;
grant execute on function public.get_dashboard_summary() to authenticated;
