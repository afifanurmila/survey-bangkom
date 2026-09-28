-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- 1. Table users (Admin authentication)
create table if not exists public.users (
  id bigint generated always as identity primary key,
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Insert default admin (username: admin, password: 123456)
insert into public.users (username, password_hash)
values ('admin', crypt('123456', gen_salt('bf', 10)))
on conflict (username) do update
set password_hash = crypt('123456', gen_salt('bf', 10));

-- 2. Table survey_config
create table if not exists public.survey_config (
  id text primary key default 'main' check (id = 'main'),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 3. Table survey_responses
create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  response jsonb not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.survey_config enable row level security;
alter table public.survey_responses enable row level security;

-- Policies for users
drop policy if exists "Allow select users for login verification" on public.users;
create policy "Allow select users for login verification" on public.users
  for select to anon, authenticated using (true);

-- Policies for survey_config
drop policy if exists "Anyone can read active survey config" on public.survey_config;
create policy "Anyone can read active survey config" on public.survey_config
  for select to anon, authenticated using (true);

drop policy if exists "Admins manage survey config" on public.survey_config;
create policy "Admins manage survey config" on public.survey_config
  for all to anon, authenticated using (true) with check (true);

-- Policies for survey_responses
drop policy if exists "Respondents can submit surveys" on public.survey_responses;
create policy "Respondents can submit surveys" on public.survey_responses
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins can read survey responses" on public.survey_responses;
create policy "Admins can read survey responses" on public.survey_responses
  for select to anon, authenticated using (true);

-- Grants
grant select on public.users to anon, authenticated;
grant select, insert, update on public.survey_config to anon, authenticated;
grant select, insert on public.survey_responses to anon, authenticated;
grant usage, select on sequence public.survey_responses_id_seq to anon, authenticated;
grant usage, select on sequence public.users_id_seq to anon, authenticated;

-- Default starter config
insert into public.survey_config (id, config) values ('main', '{"version":1}')
on conflict (id) do nothing;
