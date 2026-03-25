// =====================
// TREINO
// =====================

export type WorkoutTemplate = {
  id: string
  label: string           // "A" | "B" | "C" | "D"
  name: string            // "Push", "Pull", "Legs"
  exercises: TemplateExercise[]
}

export type TemplateExercise = {
  id: string
  name: string
  muscleGroup: string
  minReps: number
  maxReps: number
  restSeconds: number
  defaultSets: number
}

export type Session = {
  id: string
  date: string            // ISO
  templateId: string
  templateName: string
  durationSeconds: number
  entries: SessionEntry[]
}

export type SessionEntry = {
  exerciseId: string
  exerciseName: string
  sets: SetLog[]
}

export type SetLog = {
  reps: number
  weight: number
  completedAt: string
}

// =====================
// USUÁRIO E GAMIFICAÇÃO
// =====================

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch'

export type HunterStats = {
  STR: number   // volume total empurrar (kg × reps × sets acumulado)
  END: number   // consistência (% semanas com 4+ treinos)
  AGI: number   // inverso do tempo médio de treino
  VIT: number   // frequência média semanal últimos 30 dias
  INT: number   // variedade de exercícios únicos
}

export type UserProfile = {
  id: string
  name: string
  avatar?: string
  rank: HunterRank
  stats: HunterStats
  titles: string[]
  activeTitle: string
  streakDays: number
  totalSessions: number
  xp: number
}

export type Mission = {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'epic'
  xpReward: number
  titleReward?: string
  progress: number        // 0-100
  completed: boolean
  expiresAt?: string
}

export type Dungeon = {
  id: string
  name: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  objective: string
  titleReward: string
  xpReward: number
  deadlineAt: string
  createdBy: string
  participants: DungeonParticipant[]
}

export type DungeonParticipant = {
  userId: string
  userName: string
  completed: boolean
}

// =====================
// SOCIAL
// =====================

export type Group = {
  id: string
  name: string
  inviteCode: string
  members: GroupMember[]
  dungeons: Dungeon[]
  feed: FeedEvent[]
}

export type GroupMember = {
  userId: string
  name: string
  rank: HunterRank
  activeTitle: string
  streakDays: number
  weeklyVolume: number
  weeklyDays: number
}

export type FeedEventType =
  | 'rank_up'
  | 'pr_broken'
  | 'streak_milestone'
  | 'dungeon_cleared'
  | 'title_unlocked'
  | 'volume_king'
  | 'streak_broken'

export type FeedEvent = {
  id: string
  userId: string
  userName: string
  type: FeedEventType
  payload: Record<string, unknown>
  createdAt: string
  reactions: { userId: string; emoji: string }[]
}

// =====================
// PROGRESSÃO
// =====================

export type ProgressionStatus = 'ready_to_progress' | 'progressing' | 'stalled' | 'new'

export type ProgressionData = {
  lastWeight: number
  suggestedWeight: number
  progressionStatus: ProgressionStatus
  stalledFor: number
  weeklyProgress: { date: string; maxWeight: number }[]
}

// =====================
// AI COACH
// =====================

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

// =====================
// GAMIFICATION EVENTS
// =====================

export type GamificationEvent = {
  type: FeedEventType
  payload: Record<string, unknown>
  xpGained: number
}
