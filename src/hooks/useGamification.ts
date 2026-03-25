import { useCallback } from 'react'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useGamificationStore } from '../store/gamificationStore'
import { useGroupStore } from '../store/groupStore'
import {
  XP_VALUES,
  checkUnlockedTitles,
  detectGamificationEvents,
  generateDailyMissions,
  generateWeeklyMissions,
  generateEpicMissions,
} from '../lib/gamificationLogic'
import type { Session, FeedEvent } from '../lib/types'

export function useGamification() {
  const { profile, addXP, addTitle, recalculateStats } = useUserStore()
  const { sessions } = useWorkoutStore()
  const { setMissions, addEvent } = useGamificationStore()
  const { addFeedEvent } = useGroupStore()

  const refreshMissions = useCallback(
    (allSessions?: Session[]) => {
      const src = allSessions ?? sessions
      const daily = generateDailyMissions(src)
      const weekly = generateWeeklyMissions(src)
      const epic = generateEpicMissions(src)
      setMissions([...daily, ...weekly, ...epic])
    },
    [sessions, setMissions]
  )

  const processCompletedSession = useCallback(
    (newSession: Session) => {
      if (!profile) return

      const prevProfile = { ...profile }

      // Recalculate stats with new session included
      const allSessions = [...sessions, newSession]
      recalculateStats(allSessions)

      // Base XP for completing workout
      addXP(XP_VALUES.WORKOUT_COMPLETE)

      // Check load progressions in the new session
      let progressionXP = 0
      for (const entry of newSession.entries) {
        const prevMax = sessions
          .flatMap((s) => s.entries)
          .filter((e) => e.exerciseId === entry.exerciseId)
          .flatMap((e) => e.sets)
          .reduce((max, set) => Math.max(max, set.weight), 0)

        const newMax = Math.max(...entry.sets.map((s) => s.weight), 0)
        if (newMax > prevMax && prevMax > 0) {
          progressionXP += XP_VALUES.LOAD_PROGRESSION
        }
      }
      if (progressionXP > 0) addXP(progressionXP)

      // Detect gamification events after XP is applied
      const updatedProfile = useUserStore.getState().profile
      if (updatedProfile) {
        const events = detectGamificationEvents(prevProfile, updatedProfile, sessions, newSession)

        for (const event of events) {
          addEvent(event)

          const feedEvent: FeedEvent = {
            id: crypto.randomUUID(),
            userId: profile.id,
            userName: profile.name,
            type: event.type,
            payload: event.payload,
            createdAt: new Date().toISOString(),
            reactions: [],
          }
          addFeedEvent(feedEvent)
        }
      }

      // Unlock new titles
      const currentProfile = useUserStore.getState().profile
      if (currentProfile) {
        const newTitles = checkUnlockedTitles(currentProfile, allSessions)
        for (const titleId of newTitles) {
          addTitle(titleId)

          const feedEvent: FeedEvent = {
            id: crypto.randomUUID(),
            userId: profile.id,
            userName: profile.name,
            type: 'title_unlocked',
            payload: { title: titleId },
            createdAt: new Date().toISOString(),
            reactions: [],
          }
          addFeedEvent(feedEvent)
        }
      }

      // Refresh missions with updated sessions list
      refreshMissions(allSessions)
    },
    [profile, sessions, addXP, addTitle, recalculateStats, addEvent, addFeedEvent, refreshMissions]
  )

  return { processCompletedSession, refreshMissions }
}
