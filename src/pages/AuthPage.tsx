import { useState, useId } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'

type Tab = 'login' | 'register'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { login, register } = useAuthStore()
  const initProfile = useUserStore((s) => s.initProfile)
  const profileExists = useUserStore((s) => s.isOnboarded)

  const emailId = useId()
  const passwordId = useId()
  const nameId = useId()

  function resetForm() {
    setError('')
    setSuccess('')
    setPassword('')
    setShowPassword(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (tab === 'register') {
        const result = await register(name, email, password)
        if (result.error) {
          setError(result.error)
          return
        }
        // Init game profile if not yet created
        if (!profileExists) {
          initProfile(name.trim())
        }
      } else {
        const result = await login(email, password)
        if (result.error) {
          setError(result.error)
          return
        }
        // If existing auth user but no game profile, create one
        const sess = useAuthStore.getState().session
        if (!profileExists && sess) {
          initProfile(sess.name)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function switchTab(t: Tab) {
    setTab(t)
    resetForm()
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute top-0 -left-32 w-80 h-80 rounded-full bg-[#7c3aed]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full bg-[#06b6d4]/8 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="flex flex-col items-center mb-8 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-[#12121a] border-2 border-[#7c3aed]/50 flex items-center justify-center mb-3 animate-pulse-glow">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#a855f7]" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-widest bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
          HUNTER GYM
        </h1>
        <p className="text-[#64748b] text-xs mt-1 tracking-wide">
          {tab === 'register' ? 'Crie sua conta de Caçador' : 'Entre na sua conta'}
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm animate-fade-in-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        {/* Tabs */}
        <div className="flex bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-1 mb-5">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === t
                  ? 'bg-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              {t === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name (register only) */}
          {tab === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={nameId} className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Nome do Caçador
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                placeholder="Sung Jin-Woo"
                maxLength={32}
                autoComplete="name"
                required
                className="w-full bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder-[#64748b] text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              E-mail
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="caçador@email.com"
              autoComplete={tab === 'login' ? 'email' : 'email'}
              inputMode="email"
              required
              className="w-full bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder-[#64748b] text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                required
                className="w-full bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#64748b] text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors p-1"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {tab === 'register' && (
              <p className="text-[10px] text-[#64748b]">
                Mínimo 6 caracteres. Sua senha é armazenada localmente com hash SHA-256.
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl px-3 py-2.5">
              <span className="text-[#ef4444] text-sm flex-shrink-0 mt-0.5">⚠️</span>
              <p className="text-[#ef4444] text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl px-3 py-2.5">
              <span className="text-[#22c55e] text-sm flex-shrink-0">✓</span>
              <p className="text-[#22c55e] text-xs">{success}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all font-display tracking-wider hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95 flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {tab === 'login' ? 'Entrando...' : 'Criando conta...'}
              </>
            ) : tab === 'login' ? (
              'ENTRAR'
            ) : (
              'CRIAR CONTA'
            )}
          </button>

          {/* Switch tab hint */}
          <p className="text-center text-xs text-[#64748b]">
            {tab === 'login' ? (
              <>
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="text-[#a855f7] hover:text-[#7c3aed] font-medium transition-colors"
                >
                  Cadastrar-se
                </button>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-[#a855f7] hover:text-[#7c3aed] font-medium transition-colors"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </form>

        {/* Existing accounts shortcut (login tab) */}
        {tab === 'login' && <ExistingAccounts onSelect={(e) => setEmail(e)} />}
      </div>

      {/* Footer */}
      <p className="text-[#1a1a26] text-[10px] mt-8">
        Hunter Gym v1.0 · Dados armazenados localmente
      </p>
    </div>
  )
}

// ── Show registered accounts as quick-fill ────────────────────────────────

function ExistingAccounts({ onSelect }: { onSelect: (email: string) => void }) {
  const accounts = useAuthStore((s) => s.accounts)
  if (accounts.length === 0) return null

  return (
    <div className="mt-5">
      <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-2 text-center">
        Contas salvas
      </p>
      <div className="flex flex-col gap-2">
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => onSelect(acc.email)}
            className="flex items-center gap-3 bg-[#12121a] border border-[#2a2a3a] hover:border-[#7c3aed]/40 rounded-xl px-3 py-2.5 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center flex-shrink-0 font-bold text-[#a855f7] text-sm">
              {acc.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{acc.name}</p>
              <p className="text-[#64748b] text-[10px] truncate">{acc.email}</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[#64748b] flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
