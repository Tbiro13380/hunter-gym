import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, SUPABASE_ENABLED } from '../lib/supabaseClient'
import { RANK_COLORS } from '../lib/gamificationLogic'
import type { HunterRank } from '../lib/types'
import { useAuthStore } from '../store/authStore'

type Row = {
  user_id: string
  name: string
  xp: number
  hunter_rank: string
}

export default function GlobalLeaderboard() {
  const selfId = useAuthStore((s) => s.session?.accountId)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) {
      setLoading(false)
      setError('Supabase não configurado.')
      return
    }

    void supabase
      .from('leaderboard_global')
      .select('user_id, name, xp, hunter_rank')
      .order('xp', { ascending: false })
      .limit(100)
      .then(({ data, error: e }) => {
        setLoading(false)
        if (e) {
          setError(e.message)
          return
        }
        setRows((data || []) as Row[])
      })
  }, [])

  return (
    <div className="flex flex-col min-h-full flex-1 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-[#64748b] hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-white tracking-wide">Ranking global</h1>
          <p className="text-[#64748b] text-xs mt-0.5">Top caçadores por XP</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16 text-[#64748b] text-sm">Carregando…</div>
      )}

      {error && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl px-4 py-3 text-sm text-[#ef4444]">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-[#64748b] text-sm text-center py-12">Nenhum dado ainda. Treine e suba no ranking.</p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => {
          const rank = r.hunter_rank as HunterRank
          const color = RANK_COLORS[rank] ?? '#64748b'
          const isSelf = selfId === r.user_id
          return (
            <div
              key={r.user_id}
              className={`flex items-center gap-3 p-3 border rounded-none ${
                isSelf ? 'border-[#7c3aed]/50 bg-[#7c3aed]/10' : 'border-[#2a2a3a] bg-[#12121a]'
              }`}
              style={{ borderLeftWidth: 3, borderLeftColor: color }}
            >
              <span className="font-mono-timer text-lg w-8 text-center text-[#64748b]">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {r.name}
                  {isSelf && <span className="text-[#a855f7] text-xs ml-2">(você)</span>}
                </p>
                <p className="sys-label text-[#64748b]">
                  Rank {r.hunter_rank} · {r.xp.toLocaleString('pt-BR')} XP
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
