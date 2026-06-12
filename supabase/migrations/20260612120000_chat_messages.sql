-- chat_messages: persistent voice-agent conversation history per user.
-- Loaded when the user opens the voice chat, appended on every turn.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  action jsonb,
  suggestions jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;

create policy "owner reads chat" on public.chat_messages
  for select using (auth.uid() = user_id);

create policy "owner writes chat" on public.chat_messages
  for insert with check (auth.uid() = user_id);

create policy "owner deletes chat" on public.chat_messages
  for delete using (auth.uid() = user_id);
