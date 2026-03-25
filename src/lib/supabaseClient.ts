/**
 * Supabase Client — FASE 1: Mock local (localStorage)
 * Fase 2: Descomentar a inicialização real do Supabase e remover os mocks.
 */

// import { createClient } from '@supabase/supabase-js'
//
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
//
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const SUPABASE_ENABLED = false

// Mock functions that read from localStorage — allows a clean migration later
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
