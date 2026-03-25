import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Mission, GamificationEvent } from '../lib/types'

type GamificationStore = {
  missions: Mission[]
  pendingEvents: GamificationEvent[]
  lastMissionReset: string | null

  setMissions: (missions: Mission[]) => void
  updateMission: (id: string, partial: Partial<Mission>) => void
  addEvent: (event: GamificationEvent) => void
  clearEvents: () => void
  setLastMissionReset: (date: string) => void
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set) => ({
      missions: [],
      pendingEvents: [],
      lastMissionReset: null,

      setMissions: (missions) => set({ missions }),

      updateMission: (id, partial) =>
        set((state) => ({
          missions: state.missions.map((m) => (m.id === id ? { ...m, ...partial } : m)),
        })),

      addEvent: (event) =>
        set((state) => ({ pendingEvents: [...state.pendingEvents, event] })),

      clearEvents: () => set({ pendingEvents: [] }),

      setLastMissionReset: (date) => set({ lastMissionReset: date }),
    }),
    { name: 'hunter-gym-gamification' }
  )
)
