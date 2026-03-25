import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useWorkoutStore } from '../store/workoutStore'
import { getSessionVolume, getProgressionData, getExercisePR } from '../lib/progressionLogic'
import type { Session } from '../lib/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}min${sec > 0 ? ` ${sec}s` : ''}` : `${sec}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SessionRow({ session, onClick }: { session: Session; onClick: () => void }) {
  const volume = getSessionVolume(session)
  const sets = session.entries.reduce((s, e) => s + e.sets.length, 0)

  // Label color based on template label
  const labelMap: Record<string, string> = {
    A: 'bg-[#7c3aed]/20 text-[#a855f7] border-[#7c3aed]/30',
    B: 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/30',
    C: 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30',
    D: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
  }
  const labelChar = session.templateName.trim().charAt(0)
  const labelStyle = labelMap[labelChar] ?? 'bg-[#1a1a26] text-[#64748b] border-[#2a2a3a]'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#12121a] border border-[#2a2a3a] hover:border-[#7c3aed]/40 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 group"
    >
      {/* Label */}
      <span className={`w-9 h-9 rounded-xl border font-display font-bold text-sm flex items-center justify-center flex-shrink-0 ${labelStyle}`}>
        {labelChar}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate leading-tight">{session.templateName}</p>
        <p className="text-[#64748b] text-xs mt-0.5">{formatDate(session.date)}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-white text-sm font-medium">{(volume / 1000).toFixed(1)}t</p>
          <p className="text-[#64748b] text-xs">volume</p>
        </div>
        <div className="text-right">
          <p className="text-white text-sm font-medium">{formatDuration(session.durationSeconds)}</p>
          <p className="text-[#64748b] text-xs">{sets} séries</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className="w-4 h-4 text-[#2a2a3a] group-hover:text-[#64748b] transition-colors flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

function SessionDetail({ session, onBack }: { session: Session; onBack: () => void }) {
  const volume = getSessionVolume(session)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#1a1a26] text-[#64748b] hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-white font-semibold text-base">{session.templateName}</h2>
          <p className="text-[#64748b] text-xs">{formatDate(session.date)}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 divide-x divide-[#2a2a3a] border-y border-[#2a2a3a] mb-4">
        <StatCell label="Duração" value={formatDuration(session.durationSeconds)} />
        <StatCell label="Volume" value={`${(volume / 1000).toFixed(1)}t`} />
        <StatCell label="Exercícios" value={String(session.entries.length)} />
      </div>

      {/* Entries */}
      <div className="px-4 flex flex-col gap-3 pb-6">
        {session.entries.map((entry) => {
          const maxWeight = Math.max(...entry.sets.map((s) => s.weight), 0)
          const totalVol = entry.sets.reduce((s, set) => s + set.weight * set.reps, 0)
          return (
            <div key={entry.exerciseId} className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">{entry.exerciseName}</h3>
                <span className="text-[#64748b] text-xs">{Math.round(totalVol)}kg vol</span>
              </div>

              {/* Set table */}
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-1.5 px-1">
                <span>#</span><span>Reps</span><span>Kg</span><span>Volume</span>
              </div>
              {entry.sets.map((set, i) => {
                const isMax = set.weight === maxWeight && maxWeight > 0
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 items-center px-1 py-1.5 rounded-lg text-sm ${isMax ? 'bg-[#f59e0b]/5' : ''}`}
                  >
                    <span className="text-[#64748b] font-mono text-xs">{i + 1}</span>
                    <span className="text-white">{set.reps}</span>
                    <span className={`font-medium ${isMax ? 'text-[#f59e0b]' : 'text-white'}`}>
                      {set.weight}kg{isMax ? ' 🏆' : ''}
                    </span>
                    <span className="text-[#64748b] text-xs">{Math.round(set.weight * set.reps)}kg</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center py-3">
      <span className="text-white font-bold text-base font-mono-timer">{value}</span>
      <span className="text-[#64748b] text-xs mt-0.5">{label}</span>
    </div>
  )
}

// ── Custom Recharts Tooltip ────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[#64748b] text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white text-sm font-bold">{p.value}kg</p>
      ))}
    </div>
  )
}

// ── Exercise Progress Tab ──────────────────────────────────────────────────

function ExerciseProgressTab({ sessions }: { sessions: Session[] }) {
  // Build unique exercises list
  const allExercises = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sessions) {
      for (const e of s.entries) {
        if (!map.has(e.exerciseId)) map.set(e.exerciseId, e.exerciseName)
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [sessions])

  const [selectedId, setSelectedId] = useState<string>(allExercises[0]?.id ?? '')

  const progression = useMemo(
    () => (selectedId ? getProgressionData(selectedId, sessions) : null),
    [selectedId, sessions]
  )

  const pr = useMemo(
    () => (selectedId ? getExercisePR(selectedId, sessions) : 0),
    [selectedId, sessions]
  )

  // Build per-session chart data (not weekly aggregated)
  const chartData = useMemo(() => {
    if (!selectedId) return []
    return sessions
      .filter((s) => s.entries.some((e) => e.exerciseId === selectedId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s) => {
        const entry = s.entries.find((e) => e.exerciseId === selectedId)!
        const maxWeight = Math.max(...entry.sets.map((st) => st.weight), 0)
        return { date: formatShortDate(s.date), maxWeight }
      })
  }, [selectedId, sessions])

  if (allExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-[#64748b] text-sm">Nenhum treino registrado ainda</p>
        <p className="text-[#2a2a3a] text-xs mt-1">Complete um treino para ver seu progresso aqui</p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-6">
      {/* Exercise selector */}
      <div className="mb-4">
        <label className="text-xs text-[#64748b] uppercase tracking-wider font-medium block mb-2">
          Selecionar exercício
        </label>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-[#7c3aed] transition-colors pr-10"
          >
            {allExercises.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-[#1a1a26]">
                {ex.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {progression && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MiniStat
            label="PR Atual"
            value={`${pr}kg`}
            color="text-[#f59e0b]"
          />
          <MiniStat
            label="Última carga"
            value={`${progression.lastWeight}kg`}
            color="text-white"
          />
          <MiniStat
            label="Sugestão"
            value={`${progression.suggestedWeight}kg`}
            color={progression.progressionStatus === 'ready_to_progress' ? 'text-[#06b6d4]' : 'text-[#64748b]'}
          />
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
          <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium mb-4">
            Progresso de carga
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {pr > 0 && (
                <ReferenceLine
                  y={pr}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: 'PR', fill: '#f59e0b', fontSize: 10, position: 'right' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ fill: '#7c3aed', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#a855f7', r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Status indicator */}
          {progression && (
            <div className="mt-3 flex items-center gap-2 px-1">
              <StatusPill status={progression.progressionStatus} />
              {progression.stalledFor > 0 && (
                <span className="text-xs text-[#f59e0b]">
                  Travado há {progression.stalledFor} sessão{progression.stalledFor > 1 ? 'ões' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-6 text-center">
          <p className="text-[#64748b] text-sm">
            {chartData.length === 0
              ? 'Nenhum dado para este exercício'
              : 'Treine mais vezes para ver o gráfico de progresso'}
          </p>
          {chartData.length === 1 && (
            <p className="text-[#2a2a3a] text-xs mt-1">
              Primeira sessão: {chartData[0].maxWeight}kg em {chartData[0].date}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-3 text-center">
      <p className={`font-bold text-base font-mono-timer ${color}`}>{value}</p>
      <p className="text-[#64748b] text-xs mt-0.5">{label}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    new:               { label: 'Novo',         color: 'text-[#64748b] bg-[#1a1a26]' },
    progressing:       { label: 'Progredindo',  color: 'text-[#22c55e] bg-[#22c55e]/10' },
    ready_to_progress: { label: 'Pronto p/ +2.5kg', color: 'text-[#06b6d4] bg-[#06b6d4]/10' },
    stalled:           { label: 'Travado',      color: 'text-[#f59e0b] bg-[#f59e0b]/10' },
  }
  const s = map[status] ?? map.new
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${s.color}`}>{s.label}</span>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = 'sessions' | 'progress'

export default function History() {
  const { sessions } = useWorkoutStore()
  const [tab, setTab] = useState<Tab>('sessions')
  const [selected, setSelected] = useState<Session | null>(null)

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sessions]
  )

  // Weekly volume stats
  const weeklyStats = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const thisWeek = sessions.filter((s) => new Date(s.date) >= weekStart)
    const totalVol = sessions.reduce((sum, s) => sum + getSessionVolume(s), 0)

    return {
      weekSessions: thisWeek.length,
      weekVolume: thisWeek.reduce((sum, s) => sum + getSessionVolume(s), 0),
      totalSessions: sessions.length,
      totalVolume: totalVol,
    }
  }, [sessions])

  // Session detail view
  if (selected) {
    return (
      <div className="min-h-screen">
        <SessionDetail session={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-display text-2xl font-bold text-white tracking-wide">Histórico</h1>
        <p className="text-[#64748b] text-sm mt-1">{sessions.length} treino{sessions.length !== 1 ? 's' : ''} registrado{sessions.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Summary cards */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-5">
        <SummaryCard
          icon="🗓️"
          label="Esta semana"
          value={`${weeklyStats.weekSessions} treino${weeklyStats.weekSessions !== 1 ? 's' : ''}`}
          sub={`${(weeklyStats.weekVolume / 1000).toFixed(1)}t volume`}
          accent="text-[#7c3aed]"
        />
        <SummaryCard
          icon="📊"
          label="Total geral"
          value={`${weeklyStats.totalSessions} treinos`}
          sub={`${(weeklyStats.totalVolume / 1000).toFixed(1)}t levantado`}
          accent="text-[#06b6d4]"
        />
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-[#12121a] border border-[#2a2a3a] rounded-xl p-1">
          {(['sessions', 'progress'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t
                  ? 'bg-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              {t === 'sessions' ? 'Sessões' : 'Por Exercício'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'sessions' ? (
        <div className="px-4 flex flex-col gap-2 pb-6">
          {sorted.length === 0 ? (
            <EmptyState />
          ) : (
            sorted.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onClick={() => setSelected(session)}
              />
            ))
          )}
        </div>
      ) : (
        <ExerciseProgressTab sessions={sessions} />
      )}
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[#64748b] text-xs font-medium">{label}</span>
      </div>
      <p className={`font-bold text-lg leading-tight ${accent}`}>{value}</p>
      <p className="text-[#64748b] text-xs mt-0.5">{sub}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#1a1a26] border border-[#2a2a3a] flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[#64748b]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-[#64748b] text-sm font-medium">Nenhum treino ainda</p>
      <p className="text-[#2a2a3a] text-xs mt-1">Complete seu primeiro treino para ver o histórico</p>
    </div>
  )
}
