import { useEffect, type ReactNode } from 'react'
import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'
import { pullGameFromCloud } from '../services/cloudSync'
import { fetchGroupForUser } from '../services/groupCloud'
import { useGroupStore } from '../store/groupStore'

export default function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const setAuthReady = useAuthStore((s) => s.setAuthReady)

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) {
      setAuthReady(true)
      return
    }

    let cancelled = false

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      useAuthStore.getState().hydrateFromSupabase(session)
      if (session?.user) {
        await pullGameFromCloud(session.user.id)
        const g = await fetchGroupForUser(session.user.id)
        useGroupStore.getState().setGroup(g)
      }
      setAuthReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      useAuthStore.getState().hydrateFromSupabase(session)
      if (event === 'SIGNED_OUT') {
        useGroupStore.getState().setGroup(null)
        return
      }
      if (event === 'SIGNED_IN' && session?.user) {
        await pullGameFromCloud(session.user.id)
        const g = await fetchGroupForUser(session.user.id)
        useGroupStore.getState().setGroup(g)
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [setAuthReady])

  return <>{children}</>
}
