import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

  register: (name: string, email: string, password: string) => Promise<{ error?: string }>
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
  updateAccountName: (name: string) => void
  isAuthenticated: boolean
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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      session: null,
      isAuthenticated: false,

      register: async (name, email, passwordRaw) => {
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

      logout: () => {
        set({ session: null, isAuthenticated: false })
      },

      updateAccountName: (name: string) => {
        const { session, accounts } = get()
        if (!session) return
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
      // Persist session across page refreshes
      partialize: (state) => ({
        accounts: state.accounts,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
