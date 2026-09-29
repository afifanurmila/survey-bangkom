-- Run once in the Supabase SQL Editor.
-- This lets the static admin page save its questionnaire without granting
-- direct UPDATE access to anonymous visitors. The administrator password is
-- verified against the existing public.users password hash.

create extension if not exists pgcrypto;

-- Remove the old broad client-side write access if the original schema was run.
drop policy if exists "Admins manage survey config" on public.survey_config;
revoke insert, update on public.survey_config from anon, authenticated;
grant select on public.survey_config to anon, authenticated;

create or replace function public.save_survey_config(
  p_config jsonb,
  p_username text,
  p_password text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  saved_config jsonb;
begin
  if p_config is null then
    raise exception 'Konfigurasi kuesioner tidak boleh kosong.';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.username = p_username
      and u.password_hash = crypt(p_password, u.password_hash)
  ) then
    raise exception 'Username atau kata sandi administrator salah.';
  end if;

  update public.survey_config
  set config = p_config,
      updated_at = now()
  where id = 'main'
  returning config into saved_config;

  if saved_config is null then
    raise exception 'Baris konfigurasi main tidak ditemukan di survey_config.';
  end if;

  return saved_config;
end;
$$;

revoke all on function public.save_survey_config(jsonb, text, text) from public;
grant execute on function public.save_survey_config(jsonb, text, text) to anon, authenticated;
