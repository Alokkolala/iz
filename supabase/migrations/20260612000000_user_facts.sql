-- user_facts: stable per-user preferences the agent learns over time.
-- Read on every voice turn, written when the voice agent's remember tool fires.
create table if not exists public.user_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value text not null,
  source text not null default 'agent',
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.user_facts enable row level security;

create policy "owner reads" on public.user_facts
  for select using (auth.uid() = user_id);

create policy "owner writes" on public.user_facts
  for insert with check (auth.uid() = user_id);

create policy "owner updates" on public.user_facts
  for update using (auth.uid() = user_id);
