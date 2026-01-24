-- Enable UUID generation
create extension if not exists "pgcrypto";

-- USERS TABLE
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- RECORDS TABLE
create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster dashboard queries
create index if not exists idx_records_user_created_at
  on public.records(user_id, created_at desc);

-- Auto-update updated_at on record changes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_records_updated_at on public.records;

create trigger trg_records_updated_at
before update on public.records
for each row execute procedure public.set_updated_at();
