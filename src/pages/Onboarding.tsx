import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { useAuthStore } from '../store/authStore'
import { SUPABASE_ENABLED } from '../lib/supabaseClient'
import HunterLogoMark from '../components/ui/HunterLogoMark'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const initProfile = useUserStore((s) => s.initProfile)
  const session = useAuthStore((s) => s.session)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres.')
      return
    }
    setSubmitted(true)
    const uid = SUPABASE_ENABLED && session ? session.accountId : undefined
    setTimeout(() => initProfile(trimmed, uid), 600)
  }

  return (
    <div className="app-shell min-h-[100dvh] bg-[#0a0a0f] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute top-1/4 -left-24 w-64 h-64 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-64 h-64 rounded-full bg-[#06b6d4]/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#7c3aed]/5 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="relative inline-flex items-center justify-center mb-5">
          {/* Outer ring */}
          <div className="absolute w-28 h-28 rounded-full border border-[#7c3aed]/20 animate-spin-slow" />
          <div className="absolute w-24 h-24 rounded-full border border-[#a855f7]/10 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '10s' }} />

          {/* Badge */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#12121a] border-2 border-[#7c3aed]/60 animate-pulse-glow">
            <HunterLogoMark className="h-10 w-10" />
          </div>
        </div>

        <h1 className="font-display text-4xl font-bold tracking-widest bg-gradient-to-r from-[#a855f7] via-[#7c3aed] to-[#06b6d4] bg-clip-text text-transparent">
          HUNTER GYM
        </h1>
        <p className="text-[#64748b] mt-2 text-sm font-medium tracking-wide">
          Seu despertar começa agora.
        </p>

        {/* Rank preview */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {(['E','D','C','B','A','S'] as const).map((rank, i) => {
            const colors: Record<string, string> = { E:'#64748b', D:'#22c55e', C:'#06b6d4', B:'#3b82f6', A:'#a855f7', S:'#f59e0b' }
            return (
              <div
                key={rank}
                className="w-6 h-6 rounded-md flex items-center justify-center font-display font-bold text-[10px] border animate-fade-in-up"
                style={{
                  color: colors[rank],
                  borderColor: `${colors[rank]}40`,
                  background: `${colors[rank]}15`,
                  animationDelay: `${i * 80}ms`,
                  animationFillMode: 'both',
                }}
              >
                {rank}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm animate-fade-in-up"
        style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-6">
          <h2 className="text-[#f1f5f9] font-semibold text-lg mb-1">
            Qual é o seu nome, Caçador?
          </h2>
          <p className="text-[#64748b] text-sm mb-5">
            Esse nome aparecerá no seu perfil e no ranking do grupo.
          </p>

          <div className="mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Ex: Sung Jin-Woo"
              maxLength={32}
              className="w-full bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder-[#64748b] text-base focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
              autoFocus
              disabled={submitted}
            />
            {error && <p className="text-[#ef4444] text-xs mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={submitted}
            className="w-full relative overflow-hidden bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-70 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 font-display tracking-wider hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] active:scale-95"
          >
            {submitted ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Despertando...
              </span>
            ) : (
              'DESPERTAR'
            )}
          </button>
        </div>

        {/* Feature tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {['Gamificação RPG', 'Progressão de carga', 'IA Coach', 'Grupo social', 'Dungeons'].map((tag) => (
            <span key={tag} className="text-[10px] text-[#64748b] bg-[#12121a] border border-[#2a2a3a] px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </form>

      <p className="text-[#1a1a26] text-xs mt-8">Hunter Gym v1.0</p>
    </div>
  )
}
