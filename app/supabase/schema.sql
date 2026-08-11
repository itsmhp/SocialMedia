-- Unggun — Supabase schema. Run this in a new project's SQL editor.
-- Model: small private rooms of fun, ephemeral chat, kept alive by an extend vote.
-- Security: Row-Level Security so only a room's members can read/write it.
-- This is a starting point; refine alongside the app's queries.

-- ---------- tables ----------

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null,
  avatar text not null default '🦊',
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  extends int not null default 0,
  resolved boolean not null default false
);

create table if not exists room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  avatar text not null,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  body text not null,
  system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reactions (
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  primary key (message_id, user_id, emoji)
);

create table if not exists extend_votes (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  choice text not null check (choice in ('keep', 'fade')),
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- ---------- helper (security definer avoids RLS recursion on room_members) ----------

create or replace function is_room_member(room uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from room_members m
    where m.room_id = room and m.user_id = auth.uid()
  );
$$;

-- ---------- row-level security ----------

alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table messages enable row level security;
alter table reactions enable row level security;
alter table extend_votes enable row level security;

-- profiles: signed-in users can read handle/avatar; you manage only your own row.
create policy "profiles readable" on profiles for select to authenticated using (true);
create policy "insert own profile" on profiles for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on profiles for update to authenticated using (id = auth.uid());

-- rooms: members can read; a signed-in user creates a room as themselves.
create policy "members read rooms" on rooms for select to authenticated using (is_room_member(id));
create policy "create room" on rooms for insert to authenticated with check (created_by = auth.uid());

-- room_members: members see co-members; you can add yourself (join).
create policy "members read members" on room_members for select to authenticated using (is_room_member(room_id));
create policy "join room" on room_members for insert to authenticated with check (user_id = auth.uid());

-- messages: members read; members post as themselves.
create policy "members read messages" on messages for select to authenticated using (is_room_member(room_id));
create policy "members send messages" on messages for insert to authenticated with check (is_room_member(room_id) and user_id = auth.uid());

-- reactions: members read; you react/unreact as yourself.
create policy "members read reactions" on reactions for select to authenticated using (
  exists (select 1 from messages msg where msg.id = message_id and is_room_member(msg.room_id))
);
create policy "members react" on reactions for insert to authenticated with check (user_id = auth.uid());
create policy "remove own reaction" on reactions for delete to authenticated using (user_id = auth.uid());

-- extend_votes: members read; you vote/change your vote as yourself.
create policy "members read votes" on extend_votes for select to authenticated using (is_room_member(room_id));
create policy "cast vote" on extend_votes for insert to authenticated with check (is_room_member(room_id) and user_id = auth.uid());
create policy "change vote" on extend_votes for update to authenticated using (user_id = auth.uid());

-- ---------- realtime ----------
alter publication supabase_realtime add table messages, extend_votes, rooms;

-- ---------- fading rooms (optional; needs pg_cron) ----------
-- Mark rooms whose countdown ran out. Schedule with pg_cron, or do it client-side.
-- create extension if not exists pg_cron;
-- select cron.schedule('fade-rooms', '* * * * *',
--   $$ update rooms set resolved = true where expires_at < now() and not resolved $$);
