import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session as SupabaseSession, User } from '@supabase/supabase-js'
import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'

export type AuthAccount = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export type AuthSession = {
  accountId: string
  email: string
  name: string
  loggedInAt: string
}

type AuthStore = {
  accounts: AuthAccount[]
  session: AuthSession | null
  authReady: boolean
  isAuthenticated: boolean

  setAuthReady: (v: boolean) => void
  hydrateFromSupabase: (session: SupabaseSession | null) => void

  register: (name: string, email: string, password: string) => Promise<{ error?: string; info?: string }>
  login: (email: string, password: string) => Promise<{ error?: string }>
  signInWithMagicLink: (email: string) => Promise<{ error?: string; info?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>

  logout: () => Promise<void>
  updateAccountName: (name: string) => Promise<void>
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'hunter-gym-salt-2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function mapSupabaseUser(user: User): AuthSession {
  const meta = user.user_metadata as Record<string, string | undefined>
  const name =
    meta.full_name ||
    meta.name ||
    meta.display_name ||
    user.email?.split('@')[0] ||
    'Hunter'
  return {
    accountId: user.id,
    email: user.email ?? '',
    name,
    loggedInAt: new Date().toISOString(),
  }
}

function authCallbackUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/auth/callback`
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      session: null,
      authReady: false,
      isAuthenticated: false,

      setAuthReady: (v) => set({ authReady: v }),

      hydrateFromSupabase: (sbSession) => {
        if (!sbSession?.user) {
          set({ session: null, isAuthenticated: false })
          return
        }
        set({
          session: mapSupabaseUser(sbSession.user),
          isAuthenticated: true,
        })
      },

      register: async (name, email, passwordRaw) => {
        if (SUPABASE_ENABLED && supabase) {
          const normalizedEmail = normalizeEmail(email)
          if (!name.trim() || name.trim().length < 2) {
            return { error: 'Nome deve ter pelo menos 2 caracteres.' }
          }
          if (!normalizedEmail.includes('@')) {
            return { error: 'E-mail inválido.' }
          }
          if (passwordRaw.length < 6) {
            return { error: 'Senha deve ter pelo menos 6 caracteres.' }
          }
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: passwordRaw,
            options: {
              data: { full_name: name.trim(), name: name.trim() },
              emailRedirectTo: authCallbackUrl(),
            },
          })
          if (error) return { error: error.message }
          if (data.session) {
            get().hydrateFromSupabase(data.session)
            return {}
          }
          return {
            info: 'Verifique seu e-mail para confirmar a conta (se a confirmação estiver ativa no projeto).',
          }
        }

        const normalizedEmail = normalizeEmail(email)
        if (!name.trim() || name.trim().length < 2) {
          return { error: 'Nome deve ter pelo menos 2 caracteres.' }
        }
        if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
          return { error: 'E-mail inválido.' }
        }
        if (passwordRaw.length < 6) {
          return { error: 'Senha deve ter pelo menos 6 caracteres.' }
        }

        const { accounts } = get()
        if (accounts.some((a) => a.email === normalizedEmail)) {
          return { error: 'E-mail já cadastrado. Faça login.' }
        }

        const passwordHash = await hashPassword(passwordRaw)
        const account: AuthAccount = {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          createdAt: new Date().toISOString(),
        }

        const session: AuthSession = {
          accountId: account.id,
          email: account.email,
          name: account.name,
          loggedInAt: new Date().toISOString(),
        }

        set((state) => ({
          accounts: [...state.accounts, account],
          session,
          isAuthenticated: true,
        }))

        return {}
      },

      login: async (email, passwordRaw) => {
        if (SUPABASE_ENABLED && supabase) {
          const normalizedEmail = normalizeEmail(email)
          if (!normalizedEmail || !passwordRaw) {
            return { error: 'Preencha e-mail e senha.' }
          }
          const { error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: passwordRaw,
          })
          if (error) return { error: error.message }
          const { data: s } = await supabase.auth.getSession()
          get().hydrateFromSupabase(s.session)
          return {}
        }

        const normalizedEmail = normalizeEmail(email)
        if (!normalizedEmail || !passwordRaw) {
          return { error: 'Preencha e-mail e senha.' }
        }

        const { accounts } = get()
        const account = accounts.find((a) => a.email === normalizedEmail)
        if (!account) {
          return { error: 'E-mail não encontrado. Cadastre-se primeiro.' }
        }

        const passwordHash = await hashPassword(passwordRaw)
        if (passwordHash !== account.passwordHash) {
          return { error: 'Senha incorreta.' }
        }

        const session: AuthSession = {
          accountId: account.id,
          email: account.email,
          name: account.name,
          loggedInAt: new Date().toISOString(),
        }

        set({ session, isAuthenticated: true })
        return {}
      },

      signInWithMagicLink: async (email) => {
        if (!SUPABASE_ENABLED || !supabase) {
          return { error: 'Supabase não configurado.' }
        }
        const normalizedEmail = normalizeEmail(email)
        if (!normalizedEmail.includes('@')) {
          return { error: 'E-mail inválido.' }
        }
        const { error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: { emailRedirectTo: authCallbackUrl() },
        })
        if (error) return { error: error.message }
        return { info: 'Enviamos um link mágico para seu e-mail.' }
      },

      signInWithGoogle: async () => {
        if (!SUPABASE_ENABLED || !supabase) {
          return { error: 'Supabase não configurado.' }
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: authCallbackUrl() },
        })
        if (error) return { error: error.message }
        return {}
      },

      logout: async () => {
        if (SUPABASE_ENABLED && supabase) {
          await supabase.auth.signOut()
        }
        set({ session: null, isAuthenticated: false })
      },

      updateAccountName: async (name: string) => {
        const { session, accounts } = get()
        if (!session) return

        if (SUPABASE_ENABLED && supabase) {
          await supabase.auth.updateUser({ data: { full_name: name, name } })
          await supabase.from('profiles').update({ display_name: name }).eq('id', session.accountId)
          set({ session: { ...session, name } })
          return
        }

        set({
          accounts: accounts.map((a) =>
            a.id === session.accountId ? { ...a, name } : a
          ),
          session: { ...session, name },
        })
      },
    }),
    {
      name: 'hunter-gym-auth',
      partialize: (state) =>
        SUPABASE_ENABLED
          ? { accounts: state.accounts }
          : {
              accounts: state.accounts,
              session: state.session,
              isAuthenticated: state.isAuthenticated,
            },
    }
  )
)
