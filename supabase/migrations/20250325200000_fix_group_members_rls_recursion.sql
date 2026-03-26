-- Evita 42P17 "infinite recursion detected in policy for relation group_members":
-- políticas não podem consultar a mesma tabela com RLS na subquery.

create or replace function public.user_is_in_group(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = _group_id
      and user_id = auth.uid()
  );
$$;

comment on function public.user_is_in_group(uuid) is
  'Verifica membro do grupo sem RLS (quebra recursão em policies).';

grant execute on function public.user_is_in_group(uuid) to authenticated;

-- groups
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member"
  on public.groups for select
  using (public.user_is_in_group(id));

-- group_members
drop policy if exists "gm_select_member" on public.group_members;
create policy "gm_select_member"
  on public.group_members for select
  using (
    user_id = auth.uid()
    or public.user_is_in_group(group_members.group_id)
  );

-- group_dungeons
drop policy if exists "gd_select_member" on public.group_dungeons;
create policy "gd_select_member"
  on public.group_dungeons for select
  using (public.user_is_in_group(group_dungeons.group_id));

drop policy if exists "gd_insert_member" on public.group_dungeons;
create policy "gd_insert_member"
  on public.group_dungeons for insert
  with check (public.user_is_in_group(group_dungeons.group_id));

drop policy if exists "gd_update_member" on public.group_dungeons;
create policy "gd_update_member"
  on public.group_dungeons for update
  using (public.user_is_in_group(group_dungeons.group_id));

-- group_feed_events
drop policy if exists "gfe_select_member" on public.group_feed_events;
create policy "gfe_select_member"
  on public.group_feed_events for select
  using (public.user_is_in_group(group_feed_events.group_id));

drop policy if exists "gfe_insert_member" on public.group_feed_events;
create policy "gfe_insert_member"
  on public.group_feed_events for insert
  with check (public.user_is_in_group(group_feed_events.group_id));

drop policy if exists "gfe_update_member" on public.group_feed_events;
create policy "gfe_update_member"
  on public.group_feed_events for update
  using (public.user_is_in_group(group_feed_events.group_id));
