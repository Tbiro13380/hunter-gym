-- Hunter Gym — schema Supabase (Auth + sync + grupos + leaderboard + push)
-- Execute no SQL Editor do projeto ou via: supabase db push

-- ── Extensões ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Perfis (1:1 com auth.users) ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  xp integer not null default 0,
  rank text not null default 'E',
  stats jsonb not null default '{}'::jsonb,
  titles text[] not null default array[]::text[],
  active_title text not null default '',
  streak_days integer not null default 0,
  total_sessions integer not null default 0,
  current_group_id uuid,
  updated_at timestamptz not null default now()
);

create index if not exists profiles_xp_idx on public.profiles (xp desc);

alter table public.profiles
  add column if not exists game_onboarded boolean not null default false;

-- ── Dados de jogo por usuário (JSON para multi-dispositivo) ─────────────────
create table if not exists public.user_game_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  templates jsonb,
  sessions jsonb,
  missions jsonb,
  gamification jsonb,
  updated_at timestamptz not null default now()
);

-- ── Grupos ───────────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists groups_invite_upper on public.groups (upper(invite_code));

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);

do $$
begin
  alter table public.profiles
    add constraint profiles_current_group_fk
    foreign key (current_group_id) references public.groups (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

-- ── Dungeons e feed (JSON alinhado aos tipos TS) ────────────────────────────
create table if not exists public.group_dungeons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists group_dungeons_group_idx on public.group_dungeons (group_id);

create table if not exists public.group_feed_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists group_feed_group_created_idx on public.group_feed_events (group_id, created_at desc);

-- ── Web Push (subscriptions) ───────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ── View: leaderboard global (somente colunas públicas) ─────────────────────
create or replace view public.leaderboard_global as
select
  p.id as user_id,
  p.display_name as name,
  p.xp,
  p.rank as hunter_rank
from public.profiles p;

-- ── Trigger: novo usuário → profile ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'hunter'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  insert into public.user_game_data (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RPC: gerar código de convite ────────────────────────────────────────────
create or replace function public.generate_invite_code()
returns text
language sql
as $$
  select upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

-- ── RPC: criar grupo ────────────────────────────────────────────────────────
create or replace function public.create_hunter_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g_id uuid;
  code text;
begin
  if length(trim(p_name)) < 2 then
    raise exception 'invalid_group_name';
  end if;

  code := public.generate_invite_code();

  -- garantir unicidade do código
  while exists (select 1 from public.groups g where g.invite_code = code) loop
    code := public.generate_invite_code();
  end loop;

  insert into public.groups (name, invite_code, created_by)
  values (trim(p_name), code, auth.uid())
  returning id into g_id;

  insert into public.group_members (group_id, user_id)
  values (g_id, auth.uid())
  on conflict do nothing;

  update public.profiles
  set current_group_id = g_id, updated_at = now()
  where id = auth.uid();

  return g_id;
end;
$$;

-- ── RPC: entrar por código ───────────────────────────────────────────────────
create or replace function public.join_hunter_group_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g_id uuid;
  norm text;
begin
  norm := upper(trim(p_code));
  if length(norm) < 4 then
    return null;
  end if;

  select g.id into g_id
  from public.groups g
  where upper(g.invite_code) = norm;

  if g_id is null then
    return null;
  end if;

  insert into public.group_members (group_id, user_id)
  values (g_id, auth.uid())
  on conflict (group_id, user_id) do nothing;

  update public.profiles
  set current_group_id = g_id, updated_at = now()
  where id = auth.uid();

  return g_id;
end;
$$;

-- ── RPC: sair do grupo (opcional) ────────────────────────────────────────────
create or replace function public.leave_hunter_group()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  select current_group_id into gid from public.profiles where id = auth.uid();
  if gid is null then
    return;
  end if;

  delete from public.group_members
  where group_id = gid and user_id = auth.uid();

  update public.profiles
  set current_group_id = null, updated_at = now()
  where id = auth.uid();
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_game_data enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_dungeons enable row level security;
alter table public.group_feed_events enable row level security;
alter table public.push_subscriptions enable row level security;

-- profiles: leitura entre usuários autenticados (leaderboard / guild); update só próprio
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_leaderboard" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_game_data
drop policy if exists "ugd_all_own" on public.user_game_data;
create policy "ugd_all_own"
  on public.user_game_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- groups: membros veem o grupo
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid()
    )
  );

-- group_members
drop policy if exists "gm_select_member" on public.group_members;
create policy "gm_select_member"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()
    )
  );

drop policy if exists "gm_insert_self_join" on public.group_members;
create policy "gm_insert_self_join"
  on public.group_members for insert
  with check (user_id = auth.uid());

drop policy if exists "gm_delete_self" on public.group_members;
create policy "gm_delete_self"
  on public.group_members for delete
  using (user_id = auth.uid());

-- dungeons + feed: membros do grupo
drop policy if exists "gd_select_member" on public.group_dungeons;
create policy "gd_select_member"
  on public.group_dungeons for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_dungeons.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "gd_insert_member" on public.group_dungeons;
create policy "gd_insert_member"
  on public.group_dungeons for insert
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_dungeons.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "gd_update_member" on public.group_dungeons;
create policy "gd_update_member"
  on public.group_dungeons for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_dungeons.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "gfe_select_member" on public.group_feed_events;
create policy "gfe_select_member"
  on public.group_feed_events for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_feed_events.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "gfe_insert_member" on public.group_feed_events;
create policy "gfe_insert_member"
  on public.group_feed_events for insert
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_feed_events.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "gfe_update_member" on public.group_feed_events;
create policy "gfe_update_member"
  on public.group_feed_events for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_feed_events.group_id and gm.user_id = auth.uid()
    )
  );

-- push_subscriptions
drop policy if exists "push_all_own" on public.push_subscriptions;
create policy "push_all_own"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on public.leaderboard_global to authenticated;

grant execute on function public.create_hunter_group(text) to authenticated;
grant execute on function public.join_hunter_group_by_code(text) to authenticated;
grant execute on function public.leave_hunter_group() to authenticated;

-- Realtime (ignora se já estiver na publication)
do $$
begin
  begin
    alter publication supabase_realtime add table public.group_feed_events;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.group_dungeons;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.group_members;
  exception when duplicate_object then null;
  end;
end $$;
