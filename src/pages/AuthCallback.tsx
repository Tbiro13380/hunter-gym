import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'

/** Erros devolvidos pelo Supabase/Google no redirect (query ou hash). */
function parseOAuthErrorFromUrl(): string | null {
  const q = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const h = new URLSearchParams(hash)

  const err = q.get('error') ?? h.get('error')
  const code = q.get('error_code') ?? h.get('error_code')
  const desc = q.get('error_description') ?? h.get('error_description')

  if (!err && !desc) return null

  const parts = [err, code, desc ? decodeURIComponent(desc.replace(/\+/g, ' ')) : null].filter(Boolean)
  return parts.join(' — ')
}

const _sb = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const supabaseGoogleRedirectHint = _sb
  ? `${_sb}/auth/v1/callback`
  : 'https://SEU_PROJETO.supabase.co/auth/v1/callback'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) {
      navigate('/', { replace: true })
      return
    }

    const fromUrl = parseOAuthErrorFromUrl()
    if (fromUrl) {
      setOauthError(fromUrl)
      return
    }

    void supabase.auth.getSession().then(({ error }) => {
      if (error) {
        setOauthError(error.message)
        return
      }
      navigate('/', { replace: true })
    })
  }, [navigate])

  if (oauthError) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[#ef4444] text-sm font-medium max-w-md">Falha no login com Google</p>
        <p className="text-[#94a3b8] text-xs max-w-lg break-words">{oauthError}</p>
        <p className="text-[#64748b] text-[11px] max-w-md leading-relaxed">
          Causas comuns: (1) Em Supabase → Authentication → URL Configuration, adiciona o redirect exato, por exemplo{' '}
          <code className="text-[#a855f7]">http://localhost:5174/auth/callback</code> (a porta tem de bater com a do Vite).
          (2) No Google Cloud Console → OAuth Client → &quot;Authorized redirect URIs&quot;, inclui apenas o callback do Supabase:{' '}
          <code className="text-[#a855f7] break-all">{supabaseGoogleRedirectHint}</code>
          — não uses localhost aí.
        </p>
        <Link
          to="/"
          replace
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9]"
        >
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] flex flex-col items-center justify-center gap-3 text-white">
      <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[#64748b]">Sincronizando sessão…</p>
    </div>
  )
}
