import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'
import type { Dungeon, FeedEvent, Group, GroupMember, HunterRank } from '../lib/types'

type ProfileRow = {
  id: string
  display_name: string
  rank: string
  active_title: string
  streak_days: number
}

function mapMember(p: ProfileRow, weeklyVolume = 0, weeklyDays = 0): GroupMember {
  return {
    userId: p.id,
    name: p.display_name,
    rank: p.rank as HunterRank,
    activeTitle: p.active_title,
    streakDays: p.streak_days,
    weeklyVolume,
    weeklyDays,
  }
}

export async function fetchGroupForUser(userId: string): Promise<Group | null> {
  if (!SUPABASE_ENABLED || !supabase) return null

  const { data: prof, error: pe } = await supabase
    .from('profiles')
    .select('current_group_id')
    .eq('id', userId)
    .maybeSingle()

  if (pe || !prof?.current_group_id) return null

  return fetchGroupById(prof.current_group_id as string, userId)
}

export async function fetchGroupById(groupId: string, _currentUserId: string): Promise<Group | null> {
  if (!SUPABASE_ENABLED || !supabase) return null

  const { data: g, error: ge } = await supabase
    .from('groups')
    .select('id, name, invite_code, created_by')
    .eq('id', groupId)
    .maybeSingle()

  if (ge || !g) return null

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  const ids = (memberRows || []).map((m: { user_id: string }) => m.user_id)
  if (ids.length === 0) return null

  const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)

  const members: GroupMember[] = (profiles || []).map((row: ProfileRow) =>
    mapMember(row)
  )

  const { data: dRows } = await supabase
    .from('group_dungeons')
    .select('id, data')
    .eq('group_id', groupId)

  const dungeons: Dungeon[] = (dRows || []).map((r: { id: string; data: Dungeon }) => ({
    ...(r.data || {}),
    id: r.id,
  }))

  const { data: fRows } = await supabase
    .from('group_feed_events')
    .select('id, data, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(100)

  const feed: FeedEvent[] = (fRows || []).map(
    (r: { id: string; data: FeedEvent; created_at: string }) => ({
      ...r.data,
      id: r.id,
      createdAt: r.data?.createdAt ?? r.created_at,
    })
  )

  return {
    id: g.id as string,
    name: g.name as string,
    inviteCode: (g.invite_code as string) ?? '',
    members,
    dungeons,
    feed,
  }
}

export async function createGroupRemote(name: string): Promise<string | null> {
  if (!SUPABASE_ENABLED || !supabase) return null
  const { data, error } = await supabase.rpc('create_hunter_group', { p_name: name })
  if (error) {
    console.warn('[groupCloud] create', error)
    return null
  }
  return data as string
}

export async function joinGroupRemote(code: string): Promise<string | null> {
  if (!SUPABASE_ENABLED || !supabase) return null
  const { data, error } = await supabase.rpc('join_hunter_group_by_code', {
    p_code: code,
  })
  if (error) {
    console.warn('[groupCloud] join', error)
    return null
  }
  return data as string | null
}

export async function upsertDungeonRemote(groupId: string, dungeon: Dungeon): Promise<boolean> {
  if (!SUPABASE_ENABLED || !supabase) return false
  const { error } = await supabase.from('group_dungeons').upsert(
    {
      id: dungeon.id,
      group_id: groupId,
      data: dungeon,
    },
    { onConflict: 'id' }
  )
  if (error) {
    console.warn('[groupCloud] upsert dungeon', error)
    return false
  }
  return true
}

export async function insertFeedEventRemote(groupId: string, event: FeedEvent): Promise<boolean> {
  if (!SUPABASE_ENABLED || !supabase) return false
  const { error } = await supabase.from('group_feed_events').insert({
    id: event.id,
    group_id: groupId,
    data: event,
  })
  if (error) {
    console.warn('[groupCloud] insert feed', error)
    return false
  }
  return true
}

export async function updateFeedEventRemote(rowId: string, event: FeedEvent): Promise<boolean> {
  if (!SUPABASE_ENABLED || !supabase) return false
  const { error } = await supabase
    .from('group_feed_events')
    .update({ data: event })
    .eq('id', rowId)
  if (error) {
    console.warn('[groupCloud] update feed', error)
    return false
  }
  return true
}
