import type {
  HunterRank,
  HunterStats,
  Mission,
  Session,
  UserProfile,
  GamificationEvent,
} from './types'

// =====================
// XP VALUES
// =====================

export const XP_VALUES = {
  WORKOUT_COMPLETE: 100,
  LOAD_PROGRESSION: 50,
  DAILY_MISSION: 30,
  WEEKLY_MISSION: 150,
  EPIC_MISSION: 500,
  DUNGEON_CLEARED: 300,
  STREAK_7: 200,
  STREAK_30: 1000,
} as const

// =====================
// RANK THRESHOLDS
// =====================

export const RANK_ORDER: HunterRank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'National', 'Monarch']

export const RANK_XP_THRESHOLDS: Record<HunterRank, number> = {
  E: 0,
  D: 500,
  C: 2000,
  B: 6000,
  A: 15000,
  S: 35000,
  National: 100000,
  Monarch: 300000,
}

export const RANK_COLORS: Record<HunterRank, string> = {
  E: '#64748b',
  D: '#22c55e',
  C: '#06b6d4',
  B: '#3b82f6',
  A: '#a855f7',
  S: '#f59e0b',
  National: '#ef4444',
  Monarch: '#a855f7',
}

export const RANK_LABELS: Record<HunterRank, string> = {
  E: 'E',
  D: 'D',
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
  National: 'NAT',
  Monarch: 'MON',
}

export function getRankFromXP(xp: number): HunterRank {
  let rank: HunterRank = 'E'
  for (const r of RANK_ORDER) {
    if (xp >= RANK_XP_THRESHOLDS[r]) {
      rank = r
    } else {
      break
    }
  }
  return rank
}

export function getNextRank(rank: HunterRank): HunterRank | null {
  const idx = RANK_ORDER.indexOf(rank)
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null
}

export function getXPProgress(xp: number): { current: number; needed: number; percentage: number } {
  const rank = getRankFromXP(xp)
  const next = getNextRank(rank)
  if (!next) return { current: xp, needed: xp, percentage: 100 }

  const currentThreshold = RANK_XP_THRESHOLDS[rank]
  const nextThreshold = RANK_XP_THRESHOLDS[next]
  const current = xp - currentThreshold
  const needed = nextThreshold - currentThreshold
  const percentage = Math.min(100, (current / needed) * 100)
  return { current, needed, percentage }
}

// =====================
// STATS CALCULATION
// =====================

export function calculateStats(sessions: Session[]): HunterStats {
  if (sessions.length === 0) {
    return { STR: 0, END: 0, AGI: 0, VIT: 0, INT: 0 }
  }

  // STR: volume total de empurrar (peito, ombro, tríceps) — normalizado
  let pushVolume = 0
  const uniqueExercises = new Set<string>()

  for (const session of sessions) {
    for (const entry of session.entries) {
      uniqueExercises.add(entry.exerciseId)
      const isPush = ['peito', 'ombro', 'tríceps', 'triceps', 'chest', 'shoulder', 'tricep'].some(
        (m) => entry.exerciseName.toLowerCase().includes(m)
      )
      for (const set of entry.sets) {
        const vol = set.weight * set.reps
        if (isPush) pushVolume += vol
      }
    }
  }

  // END: % semanas com 4+ treinos nos últimos 3 meses
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recentSessions = sessions.filter((s) => new Date(s.date) >= threeMonthsAgo)
  const weekMap = new Map<string, number>()
  for (const s of recentSessions) {
    const d = new Date(s.date)
    const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1)
  }
  const totalWeeks = Math.max(1, Math.ceil((Date.now() - threeMonthsAgo.getTime()) / (7 * 86400000)))
  const consistentWeeks = [...weekMap.values()].filter((v) => v >= 4).length
  const endScore = Math.round((consistentWeeks / totalWeeks) * 100)

  // AGI: inverso do tempo médio (60min = 50 pts, 45min = 75 pts, 30min = 100 pts)
  const avgDuration =
    recentSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / Math.max(1, recentSessions.length)
  const agiScore = Math.round(Math.min(100, Math.max(0, 100 - (avgDuration / 60 - 30) * (100 / 90))))

  // VIT: frequência média últimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const last30 = sessions.filter((s) => new Date(s.date) >= thirtyDaysAgo)
  const vitScore = Math.round(Math.min(100, (last30.length / 4.3) * (100 / 7)))

  // INT: quantidade de exercícios únicos (normalizado para 100 = 30 exercícios distintos)
  const intScore = Math.round(Math.min(100, (uniqueExercises.size / 30) * 100))

  // STR normalizado (500k volume = 100)
  const strScore = Math.round(Math.min(100, (pushVolume / 500000) * 100))

  return {
    STR: strScore,
    END: endScore,
    AGI: agiScore,
    VIT: vitScore,
    INT: intScore,
  }
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// =====================
// STREAK CALCULATION
// =====================

export function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0

  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sessionDays = new Set(
    sorted.map((s) => {
      const d = new Date(s.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )

  let streak = 0
  let check = new Date(today)

  // Allow today or yesterday as streak start
  const hasToday = sessionDays.has(today.getTime())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const hasYesterday = sessionDays.has(yesterday.getTime())

  if (!hasToday && !hasYesterday) return 0

  if (!hasToday) check = yesterday

  while (sessionDays.has(check.getTime())) {
    streak++
    check.setDate(check.getDate() - 1)
  }

  return streak
}

// =====================
// TITLES
// =====================

export const ALL_TITLES: { id: string; label: string; description: string }[] = [
  { id: 'awakened', label: 'Awakened', description: 'Completou o primeiro treino' },
  { id: 'iron_will', label: 'Iron Will', description: '30 treinos consecutivos sem falhar' },
  { id: 'volume_king', label: 'Volume King', description: 'Maior volume do grupo na semana' },
  { id: 'dungeon_clearer', label: 'Dungeon Clearer', description: 'Completou qualquer dungeon' },
  { id: 'no_days_off', label: 'No Days Off', description: 'Streak de 60 dias' },
  { id: 'shadow_monarch', label: 'Shadow Monarch', description: 'Alcançou rank S' },
  { id: 'fortress_breaker', label: 'Fortress Breaker', description: 'Completou dungeon dificuldade 5' },
  { id: 'leg_day_lord', label: 'Leg Day Lord', description: 'Progrediu 10kg no agachamento em 3 meses' },
]

export function checkUnlockedTitles(
  profile: UserProfile,
  sessions: Session[]
): string[] {
  const newTitles: string[] = []
  const existing = new Set(profile.titles)

  if (!existing.has('awakened') && sessions.length >= 1) {
    newTitles.push('awakened')
  }

  if (!existing.has('iron_will') && profile.streakDays >= 30) {
    newTitles.push('iron_will')
  }

  if (!existing.has('no_days_off') && profile.streakDays >= 60) {
    newTitles.push('no_days_off')
  }

  if (!existing.has('shadow_monarch') && profile.rank === 'S') {
    newTitles.push('shadow_monarch')
  }

  return newTitles
}

// =====================
// GAMIFICATION EVENTS
// =====================

export function detectGamificationEvents(
  prevProfile: UserProfile,
  newProfile: UserProfile,
  sessions: Session[],
  newSession?: Session
): GamificationEvent[] {
  const events: GamificationEvent[] = []

  // Rank up
  if (RANK_ORDER.indexOf(newProfile.rank) > RANK_ORDER.indexOf(prevProfile.rank)) {
    events.push({
      type: 'rank_up',
      payload: { oldRank: prevProfile.rank, newRank: newProfile.rank },
      xpGained: 0,
    })
  }

  // Streak milestones
  const milestones = [7, 14, 30, 60, 100]
  for (const m of milestones) {
    if (newProfile.streakDays === m) {
      events.push({
        type: 'streak_milestone',
        payload: { days: m },
        xpGained: m === 7 ? XP_VALUES.STREAK_7 : m === 30 ? XP_VALUES.STREAK_30 : 0,
      })
    }
  }

  // New session PR detection
  if (newSession) {
    for (const entry of newSession.entries) {
      const prevMax = getPreviousMax(sessions, entry.exerciseId)
      const newMax = Math.max(...entry.sets.map((s) => s.weight), 0)
      if (newMax > prevMax && prevMax > 0) {
        events.push({
          type: 'pr_broken',
          payload: { exercise: entry.exerciseName, oldPR: prevMax, newPR: newMax },
          xpGained: XP_VALUES.LOAD_PROGRESSION,
        })
      }
    }
  }

  return events
}

function getPreviousMax(sessions: Session[], exerciseId: string): number {
  let max = 0
  for (const session of sessions) {
    for (const entry of session.entries) {
      if (entry.exerciseId === exerciseId) {
        for (const set of entry.sets) {
          if (set.weight > max) max = set.weight
        }
      }
    }
  }
  return max
}

// =====================
// MISSIONS GENERATION
// =====================

export function generateDailyMissions(sessions: Session[]): Mission[] {
  const today = new Date().toDateString()
  const todaySessions = sessions.filter((s) => new Date(s.date).toDateString() === today)
  const hasTrainedToday = todaySessions.length > 0

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  return [
    {
      id: 'daily_train',
      title: 'Despertar do Caçador',
      description: 'Complete 1 treino hoje',
      type: 'daily',
      xpReward: XP_VALUES.DAILY_MISSION,
      progress: hasTrainedToday ? 100 : 0,
      completed: hasTrainedToday,
      expiresAt: tomorrow.toISOString(),
    },
    {
      id: 'daily_sets',
      title: 'Séries de Batalha',
      description: 'Complete 15 séries em um único treino',
      type: 'daily',
      xpReward: XP_VALUES.DAILY_MISSION,
      progress: todaySessions.length > 0
        ? Math.min(100, (todaySessions[0].entries.reduce((a, e) => a + e.sets.length, 0) / 15) * 100)
        : 0,
      completed: todaySessions.some((s) => s.entries.reduce((a, e) => a + e.sets.length, 0) >= 15),
      expiresAt: tomorrow.toISOString(),
    },
  ]
}

export function generateWeeklyMissions(sessions: Session[]): Mission[] {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const weekSessions = sessions.filter((s) => {
    const d = new Date(s.date)
    return d >= weekStart && d < weekEnd
  })

  return [
    {
      id: 'weekly_4days',
      title: 'Semana do Guerreiro',
      description: 'Treine 4 dias nessa semana',
      type: 'weekly',
      xpReward: XP_VALUES.WEEKLY_MISSION,
      progress: Math.min(100, (weekSessions.length / 4) * 100),
      completed: weekSessions.length >= 4,
      expiresAt: weekEnd.toISOString(),
    },
    {
      id: 'weekly_volume',
      title: 'Carga Máxima',
      description: 'Atinja 10.000kg de volume total na semana',
      type: 'weekly',
      xpReward: XP_VALUES.WEEKLY_MISSION,
      progress: Math.min(100, (getWeeklyVolume(weekSessions) / 10000) * 100),
      completed: getWeeklyVolume(weekSessions) >= 10000,
      expiresAt: weekEnd.toISOString(),
    },
  ]
}

export function generateEpicMissions(sessions: Session[]): Mission[] {
  return [
    {
      id: 'epic_50sessions',
      title: 'Veterano das Masmorras',
      description: 'Complete 50 treinos no total',
      type: 'epic',
      xpReward: XP_VALUES.EPIC_MISSION,
      titleReward: 'Iron Will',
      progress: Math.min(100, (sessions.length / 50) * 100),
      completed: sessions.length >= 50,
    },
    {
      id: 'epic_streak30',
      title: 'Chamas Eternas',
      description: 'Mantenha um streak de 30 dias',
      type: 'epic',
      xpReward: XP_VALUES.EPIC_MISSION,
      titleReward: 'No Days Off',
      progress: 0,
      completed: false,
    },
  ]
}

function getWeeklyVolume(sessions: Session[]): number {
  return sessions.reduce((total, session) => {
    return total + session.entries.reduce((s, entry) => {
      return s + entry.sets.reduce((sv, set) => sv + set.weight * set.reps, 0)
    }, 0)
  }, 0)
}
