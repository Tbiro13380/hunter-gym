import type { Session, ProgressionData } from './types'

export function getProgressionData(exerciseId: string, sessions: Session[]): ProgressionData {
  // Filter sessions that contain this exercise, sorted by date asc
  const relevantSessions = sessions
    .filter((s) => s.entries.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (relevantSessions.length === 0) {
    return {
      lastWeight: 0,
      suggestedWeight: 0,
      progressionStatus: 'new',
      stalledFor: 0,
      weeklyProgress: [],
    }
  }

  // Build weight history per session
  const history = relevantSessions.map((session) => {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)!
    const maxWeight = Math.max(...entry.sets.map((s) => s.weight), 0)
    const maxReps = Math.max(...entry.sets.map((s) => s.reps), 0)
    return { date: session.date, maxWeight, maxReps, sets: entry.sets }
  })

  const lastSession = history[history.length - 1]
  const lastWeight = lastSession.maxWeight

  // Check if the user hit the top of the rep range in the last session
  // Look at the template for maxReps — approximated by checking if reps >= assumed maxReps
  // We use a heuristic: if all sets in last session hit >= the rep target, suggest +2.5kg
  const hitCeiling = lastSession.sets.every((s) => s.reps >= 10)

  // Check for stalling: last N sessions with no weight increase
  const STALL_THRESHOLD = 3
  let stalledFor = 0
  if (history.length >= 2) {
    for (let i = history.length - 1; i >= 1; i--) {
      if (history[i].maxWeight <= history[i - 1].maxWeight) {
        stalledFor++
      } else {
        break
      }
    }
  }

  let progressionStatus: ProgressionData['progressionStatus']
  if (history.length === 1) {
    progressionStatus = 'new'
  } else if (stalledFor >= STALL_THRESHOLD) {
    progressionStatus = 'stalled'
  } else if (hitCeiling) {
    progressionStatus = 'ready_to_progress'
  } else {
    progressionStatus = 'progressing'
  }

  const suggestedWeight = hitCeiling ? lastWeight + 2.5 : lastWeight

  // Weekly progress for chart (last 8 weeks)
  const weeklyProgress = buildWeeklyProgress(history)

  return {
    lastWeight,
    suggestedWeight,
    progressionStatus,
    stalledFor,
    weeklyProgress,
  }
}

function buildWeeklyProgress(
  history: { date: string; maxWeight: number }[]
): { date: string; maxWeight: number }[] {
  // Group by week and take max weight per week
  const weekMap = new Map<string, number>()

  for (const item of history) {
    const d = new Date(item.date)
    const year = d.getFullYear()
    const week = getWeekNumber(d)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const prev = weekMap.get(key) ?? 0
    if (item.maxWeight > prev) weekMap.set(key, item.maxWeight)
  }

  const sorted = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)

  return sorted.map(([date, maxWeight]) => ({ date, maxWeight }))
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function getTotalVolume(sessions: Session[]): number {
  return sessions.reduce((total, session) => {
    return total + session.entries.reduce((s, entry) => {
      return s + entry.sets.reduce((sv, set) => sv + set.weight * set.reps, 0)
    }, 0)
  }, 0)
}

export function getSessionVolume(session: Session): number {
  return session.entries.reduce((s, entry) => {
    return s + entry.sets.reduce((sv, set) => sv + set.weight * set.reps, 0)
  }, 0)
}

export function getExercisePR(exerciseId: string, sessions: Session[]): number {
  let pr = 0
  for (const session of sessions) {
    for (const entry of session.entries) {
      if (entry.exerciseId === exerciseId) {
        for (const set of entry.sets) {
          if (set.weight > pr) pr = set.weight
        }
      }
    }
  }
  return pr
}
