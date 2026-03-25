import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function isConfigured(): boolean {
  if (!url || !anon) return false
  const u = url.trim().toLowerCase()
  const a = anon.trim().toLowerCase()
  if (u.includes('desativado') || a.includes('desativado')) return false
  if (!u.startsWith('http')) return false
  if (a.length < 20) return false
  return true
}

export const SUPABASE_ENABLED = isConfigured()

export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null

/** Mock legado (Fase 1) — mantido para compatibilidade */
export const supabaseMock = {
  async getProfile(userId: string) {
    const data = localStorage.getItem(`profile_${userId}`)
    return data ? JSON.parse(data) : null
  },

  async saveProfile(userId: string, profile: unknown) {
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profile))
    return { error: null }
  },

  async getSessions(userId: string) {
    const data = localStorage.getItem(`sessions_${userId}`)
    return data ? JSON.parse(data) : []
  },

  async saveSession(userId: string, session: unknown) {
    const sessions = await this.getSessions(userId)
    sessions.push(session)
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(sessions))
    return { error: null }
  },

  async getGroup(groupId: string) {
    const data = localStorage.getItem(`group_${groupId}`)
    return data ? JSON.parse(data) : null
  },

  async saveGroup(groupId: string, group: unknown) {
    localStorage.setItem(`group_${groupId}`, JSON.stringify(group))
    return { error: null }
  },
}
