grant update (stem,search,exact,equivalent,shape,fingerprint) on question_catalog.questions to kazu_catalog_review;
grant insert (fingerprint,payload_text) on question_catalog.versions to kazu_catalog_review;

create policy review_insert_versions on question_catalog.versions for insert to kazu_catalog_review
  with check (true);
create policy review_insert_revision_history on question_catalog.history for insert to kazu_catalog_review
  with check (event='revision' and previous_status is not null and status='unreviewed' and reason is null);

create function question_catalog.require_recheck_on_revision() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if new.fingerprint is distinct from old.fingerprint and
    (new.status <> 'unreviewed' or new.version <> old.version+1 or new.reason is not null) then
    raise exception 'A question revision must return to unreviewed' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function question_catalog.require_recheck_on_revision() from public;
create trigger question_revision_requires_recheck before update of fingerprint on question_catalog.questions
  for each row execute function question_catalog.require_recheck_on_revision();
