-- Falò secure core schema for a NEW Supabase project.
-- Do not run this file over an existing database with user data. Use a reviewed
-- migration instead. Client code must use the RPCs below for room membership.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;

-- ---------- tables ----------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null check (handle ~ '^[A-Za-z0-9_]{2,16}$'),
  avatar text not null default '🦊' check (char_length(avatar) between 1 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_handle_ci on public.profiles (lower(handle));

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 28),
  spark text not null check (char_length(btrim(spark)) between 1 and 120),
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  duration_hours smallint not null check (duration_hours in (12, 24)),
  status text not null default 'active' check (status in ('active', 'faded')),
  extension_cycle integer not null default 0 check (extension_cycle >= 0),
  extension_count smallint not null default 0 check (extension_count >= 0),
  max_extensions smallint not null default 3 check (max_extensions between 0 and 7),
  member_limit smallint not null default 12 check (member_limit between 2 and 20),
  faded_at timestamptz,
  check (expires_at > created_at),
  check (extension_count <= max_extensions)
);

create table room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  removed_at timestamptz,
  primary key (room_id, user_id),
  check (not (left_at is not null and removed_at is not null))
);

create unique index one_active_owner_per_room
  on public.room_members (room_id)
  where role = 'owner' and left_at is null and removed_at is null;

create table room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses smallint not null check (max_uses between 1 and 20),
  uses smallint not null default 0 check (uses >= 0 and uses <= max_uses),
  revoked_at timestamptz,
  check (expires_at > created_at)
);

create index room_invites_room_id on public.room_invites (room_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  system boolean not null default false,
  created_at timestamptz not null default now(),
  check ((system and user_id is null) or (not system and user_id is not null)),
  unique (id, room_id)
);

create index messages_room_created_at on public.messages (room_id, created_at);

create table reactions (
  room_id uuid not null,
  message_id uuid not null,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null check (emoji in ('😂', '❤️', '🔥')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji),
  foreign key (message_id, room_id) references messages(id, room_id) on delete cascade
);

create table extend_votes (
  room_id uuid not null references rooms(id) on delete cascade,
  cycle integer not null check (cycle >= 0),
  user_id uuid not null references profiles(id) on delete cascade,
  choice text not null check (choice in ('keep', 'fade')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, cycle, user_id)
);

create table baras (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references rooms(id) on delete cascade,
  room_name text not null,
  spark text not null,
  created_at timestamptz not null default now(),
  member_count integer not null check (member_count >= 0),
  message_count integer not null check (message_count >= 0),
  reaction_count integer not null check (reaction_count >= 0)
);

create table bara_highlights (
  id uuid primary key default gen_random_uuid(),
  bara_id uuid not null references baras(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  message_id uuid not null,
  author_id uuid,
  author_handle text not null,
  author_avatar text not null,
  body text not null,
  reaction_count integer not null check (reaction_count >= 0),
  unique (bara_id, position),
  unique (bara_id, message_id)
);

create table user_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  reporter_id_snapshot uuid not null,
  reporter_handle_snapshot text not null,
  room_id uuid references rooms(id) on delete set null,
  room_id_snapshot uuid not null,
  room_name_snapshot text not null,
  message_id uuid references messages(id) on delete set null,
  message_body_snapshot text not null default '' check (char_length(message_body_snapshot) <= 500),
  reported_user_id uuid references profiles(id) on delete set null,
  reported_user_id_snapshot uuid,
  reported_handle_snapshot text not null default '',
  reason text not null check (reason in ('harassment', 'spam', 'privacy', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (message_body_snapshot <> '' or reported_user_id_snapshot is not null)
);

create index reports_pending_created_at on reports (created_at) where status = 'pending';

-- ---------- auth bootstrap ----------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, handle, avatar)
  values (
    new.id,
    'user_' || left(replace(new.id::text, '-', ''), 11),
    '🦊'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------- private authorization helpers ----------

create or replace function private.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members member
    where member.room_id = p_room_id
      and member.user_id = p_user_id
      and member.left_at is null
      and member.removed_at is null
  );
$$;

create or replace function private.is_room_owner(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members member
    where member.room_id = p_room_id
      and member.user_id = p_user_id
      and member.role = 'owner'
      and member.left_at is null
      and member.removed_at is null
  );
$$;

create or replace function private.users_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_a is not null
    and p_user_b is not null
    and p_user_a <> p_user_b
    and exists (
      select 1
      from public.user_blocks block
      where (block.blocker_id = p_user_a and block.blocked_id = p_user_b)
         or (block.blocker_id = p_user_b and block.blocked_id = p_user_a)
    );
$$;

create or replace function private.shares_room(p_viewer_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_viewer_id = p_profile_id or (
    not private.users_blocked(p_viewer_id, p_profile_id)
    and exists (
    select 1
    from public.room_members viewer
    join public.room_members target on target.room_id = viewer.room_id
    where viewer.user_id = p_viewer_id
      and target.user_id = p_profile_id
      and viewer.left_at is null
      and viewer.removed_at is null
      and target.left_at is null
      and target.removed_at is null
      )
      );
$$;

create or replace function private.can_write_room(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_room_member(p_room_id, p_user_id)
    and exists (
      select 1
      from public.rooms room
      where room.id = p_room_id
        and room.status = 'active'
        and room.expires_at > now()
    );
$$;

create or replace function private.can_react_to_message(p_message_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.messages message
    where message.id = p_message_id
      and private.can_write_room(message.room_id, p_user_id)
      and (message.user_id is null or not private.users_blocked(p_user_id, message.user_id))
  );
$$;

create or replace function private.can_vote(p_room_id uuid, p_cycle integer, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_room_member(p_room_id, p_user_id)
    and exists (
      select 1
      from public.rooms room
      where room.id = p_room_id
        and room.status = 'active'
        and room.expires_at > now()
        and room.expires_at <= now() + interval '2 hours'
        and room.extension_cycle = p_cycle
        and room.extension_count < room.max_extensions
    );
$$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_room_member(uuid, uuid) to authenticated, service_role;
grant execute on function private.is_room_owner(uuid, uuid) to authenticated, service_role;
grant execute on function private.users_blocked(uuid, uuid) to authenticated, service_role;
grant execute on function private.shares_room(uuid, uuid) to authenticated, service_role;
grant execute on function private.can_write_room(uuid, uuid) to authenticated, service_role;
grant execute on function private.can_react_to_message(uuid, uuid) to authenticated, service_role;
grant execute on function private.can_vote(uuid, integer, uuid) to authenticated, service_role;

-- ---------- atomic room and invite RPCs ----------

create or replace function public.create_room(
  p_name text,
  p_spark text,
  p_duration_hours smallint,
  p_member_limit smallint default 12
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(btrim(p_name)) not between 1 and 28 then
    raise exception 'room name must be 1-28 characters' using errcode = '22023';
  end if;
  if char_length(btrim(p_spark)) not between 1 and 120 then
    raise exception 'spark must be 1-120 characters' using errcode = '22023';
  end if;
  if p_duration_hours not in (12, 24) then
    raise exception 'duration must be 12 or 24 hours' using errcode = '22023';
  end if;
  if p_member_limit not between 2 and 20 then
    raise exception 'member limit must be 2-20' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles profile where profile.id = v_user_id) then
    raise exception 'profile required' using errcode = '23503';
  end if;

  insert into public.rooms (
    name, spark, created_by, expires_at, duration_hours, member_limit
  )
  values (
    btrim(p_name), btrim(p_spark), v_user_id,
    now() + make_interval(hours => p_duration_hours),
    p_duration_hours, p_member_limit
  )
  returning * into v_room;

  insert into public.room_members (room_id, user_id, role)
  values (v_room.id, v_user_id, 'owner');

  return v_room;
end;
$$;

create or replace function public.create_room_invite(
  p_room_id uuid,
  p_expires_in_hours integer default 24,
  p_max_uses integer default 12
)
returns table (token text, expires_at timestamptz, max_uses integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text;
  v_expires_at timestamptz;
  v_member_limit integer;
begin
  if v_user_id is null or not private.is_room_owner(p_room_id, v_user_id) then
    raise exception 'room owner required' using errcode = '42501';
  end if;
  if p_expires_in_hours not between 1 and 168 then
    raise exception 'invite expiry must be 1-168 hours' using errcode = '22023';
  end if;

  select room.member_limit into v_member_limit
  from public.rooms room
  where room.id = p_room_id and room.status = 'active' and room.expires_at > now();

  if v_member_limit is null then
    raise exception 'active room not found' using errcode = 'P0002';
  end if;
  if p_max_uses not between 1 and v_member_limit then
    raise exception 'invalid invite use limit' using errcode = '22023';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires_at := least(
    now() + make_interval(hours => p_expires_in_hours),
    (select room.expires_at from public.rooms room where room.id = p_room_id)
  );

  insert into public.room_invites (
    room_id, token_hash, created_by, expires_at, max_uses
  ) values (
    p_room_id, extensions.digest(v_token, 'sha256'), v_user_id,
    v_expires_at, p_max_uses
  );

  return query select v_token, v_expires_at, p_max_uses;
end;
$$;

create or replace function public.preview_room_invite(p_token text)
returns table (
  room_id uuid,
  room_name text,
  spark text,
  member_count integer,
  member_limit integer,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    room.id,
    room.name,
    room.spark,
    (
      select count(*)::integer
      from public.room_members member
      where member.room_id = room.id
        and member.left_at is null
        and member.removed_at is null
    ),
    room.member_limit::integer,
    room.expires_at
  from public.room_invites invite
  join public.rooms room on room.id = invite.room_id
  where invite.token_hash = extensions.digest(p_token, 'sha256')
    and invite.revoked_at is null
    and invite.expires_at > now()
    and invite.uses < invite.max_uses
    and room.status = 'active'
    and room.expires_at > now()
    and (
      select count(*)
      from public.room_members member
      where member.room_id = room.id
        and member.left_at is null
        and member.removed_at is null
    ) < room.member_limit;
$$;

create or replace function public.join_room_by_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.room_invites;
  v_room public.rooms;
  v_existing public.room_members;
  v_member_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select invite.* into v_invite
  from public.room_invites invite
  where invite.token_hash = extensions.digest(p_token, 'sha256')
    and invite.revoked_at is null
    and invite.expires_at > now()
    and invite.uses < invite.max_uses
  for update;

  if not found then
    raise exception 'invite unavailable' using errcode = 'P0002';
  end if;

  select room.* into v_room
  from public.rooms room
  where room.id = v_invite.room_id
  for update;

  if not found or v_room.status <> 'active' or v_room.expires_at <= now() then
    raise exception 'room unavailable' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.room_members member
    where member.room_id = v_room.id
      and member.left_at is null
      and member.removed_at is null
      and private.users_blocked(v_user_id, member.user_id)
  ) then
    raise exception 'a blocked relationship prevents joining this room' using errcode = '42501';
  end if;

  select member.* into v_existing
  from public.room_members member
  where member.room_id = v_room.id and member.user_id = v_user_id;

  if found and v_existing.removed_at is not null then
    raise exception 'membership revoked' using errcode = '42501';
  end if;
  if found and v_existing.left_at is null then
    return v_room.id;
  end if;

  select count(*)::integer into v_member_count
  from public.room_members member
  where member.room_id = v_room.id
    and member.left_at is null
    and member.removed_at is null;

  if v_member_count >= v_room.member_limit then
    raise exception 'room is full' using errcode = 'P0001';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (v_room.id, v_user_id, 'member')
  on conflict (room_id, user_id) do update
    set left_at = null, removed_at = null, joined_at = now(), role = 'member';

  update public.room_invites
  set uses = uses + 1
  where id = v_invite.id;

  return v_room.id;
end;
$$;

create or replace function public.revoke_room_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
begin
  select invite.room_id into v_room_id
  from public.room_invites invite
  where invite.id = p_invite_id;

  if v_room_id is null or not private.is_room_owner(v_room_id, auth.uid()) then
    raise exception 'room owner required' using errcode = '42501';
  end if;

  update public.room_invites
  set revoked_at = coalesce(revoked_at, now())
  where id = p_invite_id;
end;
$$;

create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_room_owner(p_room_id, auth.uid()) then
    raise exception 'owner cannot leave without closing or transferring the room' using errcode = 'P0001';
  end if;

  update public.room_members
  set left_at = now()
  where room_id = p_room_id
    and user_id = auth.uid()
    and removed_at is null
    and left_at is null;

  if not found then
    raise exception 'active membership not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.remove_room_member(p_room_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_room_owner(p_room_id, auth.uid()) then
    raise exception 'room owner required' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'owner cannot remove themselves' using errcode = 'P0001';
  end if;

  update public.room_members
  set removed_at = now(), left_at = null
  where room_id = p_room_id
    and user_id = p_user_id
    and role = 'member'
    and left_at is null
    and removed_at is null;

  if not found then
    raise exception 'active member not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.cast_extend_vote(p_room_id uuid, p_choice text)
returns table (
  extended boolean,
  keep_count integer,
  member_count integer,
  cycle integer,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms;
  v_keep_count integer;
  v_member_count integer;
  v_extended boolean := false;
begin
  if p_choice not in ('keep', 'fade') then
    raise exception 'choice must be keep or fade' using errcode = '22023';
  end if;

  select room.* into v_room
  from public.rooms room
  where room.id = p_room_id
  for update;

  if not found or not private.can_vote(p_room_id, v_room.extension_cycle, v_user_id) then
    raise exception 'extension vote is not available' using errcode = '42501';
  end if;

  insert into public.extend_votes (room_id, cycle, user_id, choice)
  values (p_room_id, v_room.extension_cycle, v_user_id, p_choice)
  on conflict (room_id, cycle, user_id) do update
    set choice = excluded.choice, updated_at = now();

  select count(*)::integer into v_member_count
  from public.room_members member
  where member.room_id = p_room_id
    and member.left_at is null
    and member.removed_at is null;

  select count(*)::integer into v_keep_count
  from public.extend_votes vote
  join public.room_members member
    on member.room_id = vote.room_id and member.user_id = vote.user_id
  where vote.room_id = p_room_id
    and vote.cycle = v_room.extension_cycle
    and vote.choice = 'keep'
    and member.left_at is null
    and member.removed_at is null;

  if v_keep_count >= floor(v_member_count / 2.0) + 1 then
    update public.rooms
    set
      expires_at = rooms.expires_at + interval '24 hours',
      extension_cycle = rooms.extension_cycle + 1,
      extension_count = rooms.extension_count + 1
    where id = p_room_id
    returning rooms.* into v_room;

    insert into public.messages (room_id, user_id, body, system)
    values (
      p_room_id,
      null,
      '🔥 The circle voted to keep the fire going — this room now glows for 24h more.',
      true
    );

    v_extended := true;
  end if;

  return query select
    v_extended,
    v_keep_count,
    v_member_count,
    v_room.extension_cycle,
    v_room.expires_at;
end;
$$;

create or replace function public.report_room_content(
  p_room_id uuid,
  p_message_id uuid,
  p_reported_user_id uuid,
  p_reason text,
  p_details text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_report_id uuid;
  v_reporter_handle text;
  v_room_name text;
  v_message_body text := '';
  v_message_author_id uuid;
  v_target_id uuid := p_reported_user_id;
  v_target_handle text := '';
begin
  if v_user_id is null or not private.is_room_member(p_room_id, v_user_id) then
    raise exception 'active room membership required' using errcode = '42501';
  end if;
  if p_message_id is null and p_reported_user_id is null then
    raise exception 'a message or member target is required' using errcode = '22023';
  end if;
  if p_reason not in ('harassment', 'spam', 'privacy', 'other') then
    raise exception 'invalid report reason' using errcode = '22023';
  end if;
  if char_length(coalesce(p_details, '')) > 500 then
    raise exception 'report details must be at most 500 characters' using errcode = '22023';
  end if;

  select profile.handle into v_reporter_handle
  from public.profiles profile where profile.id = v_user_id;
  select room.name into v_room_name
  from public.rooms room where room.id = p_room_id;

  if p_message_id is not null then
    select
      message.body,
      message.user_id,
      coalesce(profile.handle, '')
    into v_message_body, v_message_author_id, v_target_handle
    from public.messages message
    left join public.profiles profile on profile.id = message.user_id
    where message.id = p_message_id and message.room_id = p_room_id;
    if not found then
      raise exception 'message is not in this room' using errcode = '22023';
    end if;
    if p_reported_user_id is not null and p_reported_user_id is distinct from v_message_author_id then
      raise exception 'reported member does not author this message' using errcode = '22023';
    end if;
    v_target_id := v_message_author_id;
  end if;
  if p_message_id is null and v_target_id is not null then
    if not private.is_room_member(p_room_id, v_target_id) then
      raise exception 'member is not in this room' using errcode = '22023';
    end if;
    select profile.handle into v_target_handle
    from public.profiles profile where profile.id = v_target_id;
  end if;

  insert into public.reports (
    reporter_id, reporter_id_snapshot, reporter_handle_snapshot,
    room_id, room_id_snapshot, room_name_snapshot,
    message_id, message_body_snapshot,
    reported_user_id, reported_user_id_snapshot, reported_handle_snapshot,
    reason, details
  ) values (
    v_user_id, v_user_id, v_reporter_handle,
    p_room_id, p_room_id, v_room_name,
    p_message_id, v_message_body,
    v_target_id, v_target_id, v_target_handle,
    p_reason, coalesce(p_details, '')
  )
  returning id into v_report_id;

  return v_report_id;
end;
$$;

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Rooms this user created cascade to their members, messages, invites, votes, and Bara.
  delete from public.rooms where created_by = uid;
  -- Remove this user's messages elsewhere first; the non-null author check blocks set-null on delete.
  delete from public.messages where user_id = uid;
  -- The profile delete cascades remaining memberships, reactions, votes, and blocks.
  delete from public.profiles where id = uid;
  -- Finally drop the auth identity so the account can no longer sign in.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.create_room(text, text, smallint, smallint) from public, anon;
revoke all on function public.create_room_invite(uuid, integer, integer) from public, anon;
revoke all on function public.preview_room_invite(text) from public, anon;
revoke all on function public.join_room_by_invite(text) from public, anon;
revoke all on function public.revoke_room_invite(uuid) from public, anon;
revoke all on function public.leave_room(uuid) from public, anon;
revoke all on function public.remove_room_member(uuid, uuid) from public, anon;
revoke all on function public.cast_extend_vote(uuid, text) from public, anon;
revoke all on function public.report_room_content(uuid, uuid, uuid, text, text) from public, anon;
revoke all on function public.delete_account() from public, anon;

grant execute on function public.create_room(text, text, smallint, smallint) to authenticated;
grant execute on function public.create_room_invite(uuid, integer, integer) to authenticated;
grant execute on function public.preview_room_invite(text) to authenticated;
grant execute on function public.join_room_by_invite(text) to authenticated;
grant execute on function public.revoke_room_invite(uuid) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.remove_room_member(uuid, uuid) to authenticated;
grant execute on function public.cast_extend_vote(uuid, text) to authenticated;
grant execute on function public.report_room_content(uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.delete_account() to authenticated;

-- ---------- server-authoritative fade / Bara ----------

create or replace function private.finalize_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_bara_id uuid;
  v_member_count integer;
  v_message_count integer;
  v_reaction_count integer;
begin
  select room.* into v_room
  from public.rooms room
  where room.id = p_room_id
  for update;

  if not found or v_room.status <> 'active' or v_room.expires_at > now() then
    return false;
  end if;

  select count(*)::integer into v_member_count
  from public.room_members member
  where member.room_id = p_room_id
    and member.left_at is null
    and member.removed_at is null;

  select count(*)::integer into v_message_count
  from public.messages message
  where message.room_id = p_room_id and not message.system;

  select count(*)::integer into v_reaction_count
  from public.reactions reaction
  join public.messages message on message.id = reaction.message_id
  where message.room_id = p_room_id and not message.system and reaction.active;

  insert into public.baras (
    room_id, room_name, spark, member_count, message_count, reaction_count
  ) values (
    p_room_id, v_room.name, v_room.spark,
    v_member_count, v_message_count, v_reaction_count
  )
  on conflict (room_id) do nothing
  returning id into v_bara_id;

  if v_bara_id is null then
    select bara.id into v_bara_id from public.baras bara where bara.room_id = p_room_id;
  end if;

  insert into public.bara_highlights (
    bara_id, position, message_id, author_id, author_handle,
    author_avatar, body, reaction_count
  )
  select
    v_bara_id,
    row_number() over (
      order by ranked.reaction_count desc, ranked.created_at asc, ranked.id
    )::smallint,
    ranked.id,
    ranked.user_id,
    ranked.author_handle,
    ranked.author_avatar,
    ranked.body,
    ranked.reaction_count
  from (
    select
      message.id,
      message.user_id,
      message.body,
      message.created_at,
      coalesce(profile.handle, 'Former member') as author_handle,
      coalesce(profile.avatar, '🔥') as author_avatar,
      count(reaction.message_id)::integer as reaction_count
    from public.messages message
    left join public.profiles profile on profile.id = message.user_id
    left join public.reactions reaction on reaction.message_id = message.id and reaction.active
    where message.room_id = p_room_id and not message.system
    group by message.id, profile.handle, profile.avatar
    order by count(reaction.message_id) desc, message.created_at asc, message.id
    limit 5
  ) ranked
  on conflict do nothing;

  delete from public.messages where room_id = p_room_id;
  update public.rooms
  set status = 'faded', faded_at = coalesce(faded_at, now())
  where id = p_room_id;

  return true;
end;
$$;

create or replace function private.finalize_expired_rooms()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_count integer := 0;
begin
  for v_room_id in
    select room.id
    from public.rooms room
    where room.status = 'active' and room.expires_at <= now()
    order by room.expires_at
  loop
    if private.finalize_room(v_room_id) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke all on function private.finalize_room(uuid) from public, anon, authenticated;
revoke all on function private.finalize_expired_rooms() from public, anon, authenticated;
grant execute on function private.finalize_room(uuid) to service_role;
grant execute on function private.finalize_expired_rooms() to service_role;

-- Optional after enabling pg_cron in Supabase:
-- select cron.schedule(
--   'falo-finalize-expired-rooms',
--   '* * * * *',
--   $$ select private.finalize_expired_rooms(); $$
-- );

-- ---------- row-level security ----------

alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table room_invites enable row level security;
alter table messages enable row level security;
alter table reactions enable row level security;
alter table extend_votes enable row level security;
alter table baras enable row level security;
alter table bara_highlights enable row level security;
alter table user_blocks enable row level security;
alter table reports enable row level security;

create policy "profiles visible to self and shared rooms"
  on profiles for select to authenticated
  using (private.shares_room(auth.uid(), id));

create policy "users update own profile"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "members read rooms"
  on rooms for select to authenticated
  using (private.is_room_member(id, auth.uid()));

create policy "members read room membership"
  on room_members for select to authenticated
  using (
    private.is_room_member(room_id, auth.uid())
    and (user_id = auth.uid() or not private.users_blocked(auth.uid(), user_id))
  );

create policy "owners read invite metadata"
  on room_invites for select to authenticated
  using (private.is_room_owner(room_id, auth.uid()));

create policy "members read messages"
  on messages for select to authenticated
  using (
    private.is_room_member(room_id, auth.uid())
    and (user_id is null or not private.users_blocked(auth.uid(), user_id))
  );

create policy "members send own messages"
  on messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and not system
    and private.can_write_room(room_id, auth.uid())
  );

create policy "members read reactions"
  on reactions for select to authenticated
  using (
    private.is_room_member(room_id, auth.uid())
    and
    exists (
      select 1
      from public.messages message
      where message.id = message_id
        and message.room_id = reactions.room_id
        and not private.users_blocked(auth.uid(), reactions.user_id)
        and (message.user_id is null or not private.users_blocked(auth.uid(), message.user_id))
    )
  );

create policy "members add own reactions"
  on reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages message
      where message.id = message_id and message.room_id = reactions.room_id
    )
    and private.can_react_to_message(message_id, auth.uid())
  );

create policy "users toggle own reactions"
  on reactions for update to authenticated
  using (
    user_id = auth.uid()
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages message
      where message.id = message_id and message.room_id = reactions.room_id
    )
    and private.can_react_to_message(message_id, auth.uid())
  );

create policy "members read extension votes"
  on extend_votes for select to authenticated
  using (
    private.is_room_member(room_id, auth.uid())
    and not private.users_blocked(auth.uid(), user_id)
  );

-- Vote writes are only available through public.cast_extend_vote(), which locks
-- the room and resolves a majority once per extension cycle.

create policy "members read Bara"
  on baras for select to authenticated
  using (private.is_room_member(room_id, auth.uid()));

create policy "members read Bara highlights"
  on bara_highlights for select to authenticated
  using (
    exists (
      select 1
      from public.baras bara
      where bara.id = bara_highlights.bara_id
        and private.is_room_member(bara.room_id, auth.uid())
        and (
          bara_highlights.author_id is null
          or not private.users_blocked(auth.uid(), bara_highlights.author_id)
        )
    )
  );

create policy "users read own blocks"
  on user_blocks for select to authenticated
  using (blocker_id = auth.uid());

create policy "users create own blocks"
  on user_blocks for insert to authenticated
  with check (blocker_id = auth.uid());

create policy "users remove own blocks"
  on user_blocks for delete to authenticated
  using (blocker_id = auth.uid());

create policy "reporters read own reports"
  on reports for select to authenticated
  using (reporter_id = auth.uid());

-- Report inserts only happen through public.report_room_content(). Status changes
-- are performed by the founders through a trusted service-role review surface.

-- Direct room/member/invite/Bara writes have no client policy. They can only
-- happen through the narrow security-definer RPCs or the service role.

-- ---------- realtime ----------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'extend_votes'
  ) then
    alter publication supabase_realtime add table public.extend_votes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end;
$$;

-- PostgreSQL cannot apply row filters to DELETE payloads. Falò does not need
-- delete events: room/message/reaction removal is represented by room UPDATEs
-- and subsequent authorized rehydration.
alter publication supabase_realtime set (publish = 'insert, update');
