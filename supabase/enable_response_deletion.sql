-- Run once in the Supabase SQL Editor to enable deletion of selected responses.
-- Each request verifies the administrator username/password before deleting.
create extension if not exists pgcrypto;

create or replace function public.delete_selected_survey_responses(
  p_ids bigint[], p_username text, p_password text
) returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  deleted_count integer;
begin
  if p_ids is null or cardinality(p_ids) = 0 or cardinality(p_ids) > 100 then
    raise exception 'Pilih antara 1 dan 100 respons.';
  end if;
  if not exists (
    select 1 from public.users u
    where u.username = p_username and u.password_hash = crypt(p_password, u.password_hash)
  ) then
    raise exception 'Kata sandi administrator salah.';
  end if;
  with deleted as (
    delete from public.survey_responses where id = any(p_ids) returning 1
  ) select count(*) into deleted_count from deleted;
  return deleted_count;
end;
$$;
revoke all on function public.delete_selected_survey_responses(bigint[], text, text) from public;
grant execute on function public.delete_selected_survey_responses(bigint[], text, text) to anon, authenticated;
