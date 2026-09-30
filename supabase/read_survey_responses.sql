-- Allow the admin dashboard to read responses only after re-verifying the
-- administrator password. Survey responses contain personal employee data,
-- so do not grant direct SELECT access to the public/anon role.

create or replace function public.get_survey_responses(
  p_username text,
  p_password text
) returns table (
  id bigint,
  created_at timestamptz,
  response jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1
    from public.users u
    where u.username = p_username
      and u.password_hash = crypt(p_password, u.password_hash)
  ) then
    raise exception 'Username atau kata sandi administrator salah.';
  end if;

  return query
    select sr.id, sr.created_at, sr.response
    from public.survey_responses sr
    order by sr.created_at desc
    limit 5000;
end;
$$;

revoke all on function public.get_survey_responses(text, text) from public;
grant execute on function public.get_survey_responses(text, text) to anon, authenticated;

-- Remove direct table read access. Inserts from survey respondents remain
-- available through the existing INSERT grant and RLS policy.
drop policy if exists "Admins can read survey responses" on public.survey_responses;
revoke select on public.survey_responses from anon, authenticated;
