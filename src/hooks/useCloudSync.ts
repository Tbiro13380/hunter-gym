import { useEffect, useRef } from 'react'
import { SUPABASE_ENABLED, supabase } from '../lib/supabaseClient'
import { pushGameToCloud } from '../services/cloudSync'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useGamificationStore } from '../store/gamificationStore'

const DEBOUNCE_MS = 1800

/**
 * Envia estado de jogo para o Supabase quando o usuário está na nuvem.
 */
export function useCloudSync() {
  const session = useAuthStore((s) => s.session)
  const profile = useUserStore((s) => s.profile)
  const isOnboarded = useUserStore((s) => s.isOnboarded)
  const templates = useWorkoutStore((s) => s.templates)
  const sessions = useWorkoutStore((s) => s.sessions)
  const missions = useGamificationStore((s) => s.missions)
  const pendingEvents = useGamificationStore((s) => s.pendingEvents)
  const lastMissionReset = useGamificationStore((s) => s.lastMissionReset)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase || !session?.accountId || !profile || !isOnboarded) {
      return
    }

    const uid = session.accountId

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void pushGameToCloud(uid)
    }, DEBOUNCE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [
    session?.accountId,
    profile,
    isOnboarded,
    templates,
    sessions,
    missions,
    pendingEvents,
    lastMissionReset,
  ])
}
