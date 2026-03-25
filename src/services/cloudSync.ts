import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'
import type {
  GamificationEvent,
  HunterRank,
  HunterStats,
  Mission,
  Session,
  UserProfile,
  WorkoutTemplate,
} from '../lib/types'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useGamificationStore } from '../store/gamificationStore'

type GamificationPersist = {
  missions: Mission[]
  pendingEvents: { type: string; payload: Record<string, unknown>; xpGained: number }[]
  lastMissionReset: string | null
}

function mapRowToProfile(row: {
  id: string
  display_name: string
  avatar_url: string | null
  xp: number
  rank: string
  stats: unknown
  titles: string[] | null
  active_title: string
  streak_days: number
  total_sessions: number
  game_onboarded: boolean
}): UserProfile {
  return {
    id: row.id,
    name: row.display_name,
    avatar: row.avatar_url ?? undefined,
    rank: row.rank as HunterRank,
    stats: (row.stats || {}) as HunterStats,
    titles: row.titles ?? [],
    activeTitle: row.active_title,
    streakDays: row.streak_days,
    totalSessions: row.total_sessions,
    xp: row.xp,
  }
}

export async function pullGameFromCloud(userId: string): Promise<boolean> {
  if (!SUPABASE_ENABLED || !supabase) return false

  const [{ data: prof, error: pe }, { data: game, error: ge }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_game_data').select('*').eq('user_id', userId).maybeSingle(),
  ])

  if (pe || ge) {
    console.warn('[cloudSync] pull error', pe || ge)
    return false
  }

  if (prof) {
    const row = prof as {
      id: string
      display_name: string
      avatar_url: string | null
      xp: number
      rank: string
      stats: unknown
      titles: string[] | null
      active_title: string
      streak_days: number
      total_sessions: number
      game_onboarded?: boolean
    }
    const profile = mapRowToProfile({
      ...row,
      game_onboarded: row.game_onboarded ?? false,
    })
    useUserStore.getState().setProfile(profile)
    useUserStore.setState({ isOnboarded: !!row.game_onboarded })
  }

  if (game) {
    const g = game as {
      templates: WorkoutTemplate[] | null | undefined
      sessions: Session[] | null | undefined
      missions: Mission[] | null | undefined
      gamification: GamificationPersist | null | undefined
    }
    if (g.templates != null && Array.isArray(g.templates) && g.templates.length > 0) {
      useWorkoutStore.setState({ templates: g.templates })
    }
    if (g.sessions != null && Array.isArray(g.sessions)) {
      useWorkoutStore.setState({ sessions: g.sessions })
    }
    if (g.missions != null && Array.isArray(g.missions) && g.missions.length > 0) {
      useGamificationStore.getState().setMissions(g.missions)
    }
    if (g.gamification != null && typeof g.gamification === 'object') {
      const gm = g.gamification
      useGamificationStore.setState({
        pendingEvents: (gm.pendingEvents || []) as GamificationEvent[],
        lastMissionReset: gm.lastMissionReset ?? null,
      })
    }
  }

  useUserStore.getState().recalculateStats(useWorkoutStore.getState().sessions)

  return true
}

export async function pushGameToCloud(userId: string): Promise<void> {
  if (!SUPABASE_ENABLED || !supabase) return

  const profile = useUserStore.getState().profile
  const onboarded = useUserStore.getState().isOnboarded
  const { templates, sessions } = useWorkoutStore.getState()
  const { missions, pendingEvents, lastMissionReset } = useGamificationStore.getState()

  if (!profile) return

  const now = new Date().toISOString()

  const { error: pErr } = await supabase.from('profiles').upsert(
    {
      id: userId,
      display_name: profile.name,
      avatar_url: profile.avatar ?? null,
      xp: profile.xp,
      rank: profile.rank,
      stats: profile.stats,
      titles: profile.titles,
      active_title: profile.activeTitle,
      streak_days: profile.streakDays,
      total_sessions: profile.totalSessions,
      game_onboarded: onboarded,
      updated_at: now,
    },
    { onConflict: 'id' }
  )

  if (pErr) console.warn('[cloudSync] profiles upsert', pErr)

  const { error: gErr } = await supabase.from('user_game_data').upsert(
    {
      user_id: userId,
      templates,
      sessions,
      missions,
      gamification: { pendingEvents, lastMissionReset } as unknown as Record<string, unknown>,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  )

  if (gErr) console.warn('[cloudSync] user_game_data upsert', gErr)
}
