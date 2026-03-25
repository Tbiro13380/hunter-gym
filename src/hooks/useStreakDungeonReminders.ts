import { useEffect, useRef } from 'react'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useGroupStore } from '../store/groupStore'

/**
 * Lembretes locais (Notification API) quando o utilizador concedeu permissão.
 * Push em background completo requer Edge Function + VAPID no servidor.
 */
export function useStreakDungeonReminders() {
  const profile = useUserStore((s) => s.profile)
  const sessions = useWorkoutStore((s) => s.sessions)
  const group = useGroupStore((s) => s.group)
  const doneRef = useRef<{ streak?: string; dungeon?: string }>({})

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !profile) {
      return
    }

    const today = new Date().toDateString()
    const trainedToday = sessions.some((s) => new Date(s.date).toDateString() === today)

    if (profile.streakDays > 0 && !trainedToday && doneRef.current.streak !== today) {
      const h = new Date().getHours()
      if (h >= 16) {
        doneRef.current.streak = today
        new Notification('Hunter Gym — Streak', {
          body: `Treine hoje para manter seus ${profile.streakDays} dias de streak.`,
        })
      }
    }

    if (!group) return
    const soon = group.dungeons.filter((d) => {
      const end = new Date(d.deadlineAt).getTime()
      const now = Date.now()
      return end > now && end - now < 48 * 3600 * 1000
    })
    if (soon.length === 0) return

    const key = `${today}-${soon.map((d) => d.id).join(',')}`
    if (doneRef.current.dungeon === key) return
    doneRef.current.dungeon = key
    new Notification('Hunter Gym — Dungeon', {
      body: `${soon.length} dungeon(s) com prazo nas próximas 48h.`,
    })
  }, [profile, sessions, group])
}
