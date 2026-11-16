create function question_catalog.active_owner_session(owner_id uuid, auth_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from question_catalog.administrators a
    join auth.sessions s on s.user_id = a.user_id
    where a.user_id = owner_id and a.active and s.id = auth_session_id
      and (s.not_after is null or s.not_after > now())
  )
$$;
revoke all on function question_catalog.active_owner_session(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function question_catalog.active_owner_session(uuid, uuid) to kazu_catalog_review;
