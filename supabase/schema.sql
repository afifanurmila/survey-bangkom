-- Run once in Supabase SQL Editor. Create admin users in Authentication > Users.
create table if not exists public.survey_config (
  id text primary key default 'main' check (id = 'main'),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  response jsonb not null
);

alter table public.survey_config enable row level security;
alter table public.survey_responses enable row level security;

drop policy if exists "Anyone can read active survey config" on public.survey_config;
create policy "Anyone can read active survey config" on public.survey_config
  for select to anon, authenticated using (true);
drop policy if exists "Admins manage survey config" on public.survey_config;
create policy "Admins manage survey config" on public.survey_config
  for all to authenticated using (true) with check (true);

drop policy if exists "Respondents can submit surveys" on public.survey_responses;
create policy "Respondents can submit surveys" on public.survey_responses
  for insert to anon, authenticated with check (true);
drop policy if exists "Admins can read survey responses" on public.survey_responses;
create policy "Admins can read survey responses" on public.survey_responses
  for select to authenticated using (true);

grant select on public.survey_config to anon, authenticated;
grant insert on public.survey_responses to anon, authenticated;
grant select on public.survey_responses to authenticated;
grant usage, select on sequence public.survey_responses_id_seq to anon, authenticated;

-- Replace this starter object with the live questionnaire config (the first
-- public response page works from its built-in defaults until this row exists).
insert into public.survey_config (id, config) values ('main', '{"version":1}')
on conflict (id) do nothing;
