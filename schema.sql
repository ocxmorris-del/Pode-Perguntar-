-- Execute este arquivo no SQL Editor do seu projeto Supabase.
create extension if not exists pgcrypto;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(trim(body)) between 5 and 1500),
  status text not null default 'pending' check (status in ('pending','answered')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.questions enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_impact_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_impact_admin() from public;
grant execute on function public.is_impact_admin() to authenticated;

-- Participantes podem enviar perguntas sem conta, mas não podem ler o banco.
drop policy if exists "anonymous can submit questions" on public.questions;
create policy "anonymous can submit questions"
on public.questions for insert to anon, authenticated
with check (
  char_length(trim(body)) between 5 and 1500
  and status = 'pending'
);

drop policy if exists "admins can read questions" on public.questions;
create policy "admins can read questions"
on public.questions for select to authenticated
using (public.is_impact_admin());

drop policy if exists "admins can update questions" on public.questions;
create policy "admins can update questions"
on public.questions for update to authenticated
using (public.is_impact_admin())
with check (public.is_impact_admin());

drop policy if exists "admins can delete questions" on public.questions;
create policy "admins can delete questions"
on public.questions for delete to authenticated
using (public.is_impact_admin());

-- Bloqueia leitura e alteração da lista de administradores pelo navegador.
drop policy if exists "admins list private" on public.admin_users;
create policy "admins list private"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));
