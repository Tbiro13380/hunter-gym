import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '../lib/types'
import { calculateStreak, calculateStats, getRankFromXP } from '../lib/gamificationLogic'
import type { Session } from '../lib/types'

type UserStore = {
  profile: UserProfile | null
  isOnboarded: boolean
  setProfile: (profile: UserProfile) => void
  updateProfile: (partial: Partial<UserProfile>) => void
  initProfile: (name: string, userId?: string) => void
  recalculateStats: (sessions: Session[]) => void
  addXP: (amount: number) => void
  addTitle: (titleId: string) => void
  setActiveTitle: (titleId: string) => void
}

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'name'> = {
  rank: 'E',
  stats: { STR: 0, END: 0, AGI: 0, VIT: 0, INT: 0 },
  titles: [],
  activeTitle: '',
  streakDays: 0,
  totalSessions: 0,
  xp: 0,
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboarded: false,

      setProfile: (profile) => set({ profile, isOnboarded: true }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : null,
        })),

      initProfile: (name, userId) => {
        const profile: UserProfile = {
          ...DEFAULT_PROFILE,
          id: userId ?? crypto.randomUUID(),
          name,
          titles: [],
          activeTitle: '',
        }
        set({ profile, isOnboarded: true })
      },

      recalculateStats: (sessions) => {
        const { profile } = get()
        if (!profile) return
        const stats = calculateStats(sessions)
        const streak = calculateStreak(sessions)
        const rank = getRankFromXP(profile.xp)
        set({
          profile: {
            ...profile,
            stats,
            streakDays: streak,
            totalSessions: sessions.length,
            rank,
          },
        })
      },

      addXP: (amount) => {
        const { profile } = get()
        if (!profile) return
        const newXP = profile.xp + amount
        const newRank = getRankFromXP(newXP)
        set({ profile: { ...profile, xp: newXP, rank: newRank } })
      },

      addTitle: (titleId) => {
        const { profile } = get()
        if (!profile || profile.titles.includes(titleId)) return
        const newTitles = [...profile.titles, titleId]
        const activeTitle = profile.activeTitle || titleId
        set({ profile: { ...profile, titles: newTitles, activeTitle } })
      },

      setActiveTitle: (titleId) => {
        const { profile } = get()
        if (!profile) return
        set({ profile: { ...profile, activeTitle: titleId } })
      },
    }),
    { name: 'hunter-gym-user' }
  )
)
