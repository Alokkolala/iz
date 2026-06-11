-- 0002 — name on profiles, saved analyses, crew invites.

-- profiles.name (optional display name, distinct from auth email).
alter table public.profiles add column if not exists name text;

-- Saved AI critiques. payload holds the full Analysis JSON the Lens returns.
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sight_guess text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

drop policy if exists "analyses_self_all" on public.analyses;
create policy "analyses_self_all"
  on public.analyses for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Crew invites. Inviter creates a pending row by recipient email.
-- Recipients see their pending invites by matching auth.email().
create table if not exists public.crew_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now()
);

create index if not exists crew_invites_inviter_idx
  on public.crew_invites (inviter_id, created_at desc);
create index if not exists crew_invites_invitee_idx
  on public.crew_invites (lower(invitee_email), status);

alter table public.crew_invites enable row level security;

-- Inviter sees and manages their own outgoing invites.
drop policy if exists "invites_inviter_all" on public.crew_invites;
create policy "invites_inviter_all"
  on public.crew_invites for all
  to authenticated
  using (auth.uid() = inviter_id)
  with check (auth.uid() = inviter_id);

-- Invitee can SELECT invites addressed to their email.
drop policy if exists "invites_invitee_select" on public.crew_invites;
create policy "invites_invitee_select"
  on public.crew_invites for select
  to authenticated
  using (lower(invitee_email) = lower((auth.jwt() ->> 'email')));

-- Invitee can UPDATE only the status of invites addressed to them.
drop policy if exists "invites_invitee_update" on public.crew_invites;
create policy "invites_invitee_update"
  on public.crew_invites for update
  to authenticated
  using (lower(invitee_email) = lower((auth.jwt() ->> 'email')))
  with check (lower(invitee_email) = lower((auth.jwt() ->> 'email')));
