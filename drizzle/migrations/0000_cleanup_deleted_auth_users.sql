-- App data is shared by the installation. Remove the deleted account's profile;
-- clear shared data only when no Auth-backed app account remains.
create schema if not exists private;
--> statement-breakpoint
create or replace function private.cleanup_deleted_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed_profiles integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(702371204);

  delete from public.users
  where user_id = old.id::text
     or (user_id is null and pg_catalog.lower(email) = pg_catalog.lower(old.email));
  get diagnostics removed_profiles = row_count;

  if removed_profiles > 0 and not exists (
    select 1
    from public.users u
    join auth.users a on a.id::text = u.user_id
  ) then
    delete from public."competitionWinners";
    delete from public.certification;
    delete from public."eventsResponses";
    delete from public."competitionsResponses";
    delete from public.events;
    delete from public."leadsData";
    delete from public."allLeads";
    delete from public."inductionResponses";
    delete from public."contactResponses";
    delete from public.members;
    delete from public.app_settings;
    delete from public."appSettings";
    delete from public.societies;
    delete from public.users;
  end if;

  return old;
end;
$$;
--> statement-breakpoint
revoke all on function private.cleanup_deleted_auth_user() from public, anon, authenticated, service_role;
--> statement-breakpoint
drop trigger if exists on_socflow_auth_user_deleted on auth.users;
--> statement-breakpoint
create trigger on_socflow_auth_user_deleted
after delete on auth.users
for each row execute function private.cleanup_deleted_auth_user();
