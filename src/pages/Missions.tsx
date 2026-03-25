import { useEffect, useMemo, useState } from 'react'
import { useGamificationStore } from '../store/gamificationStore'
import { useUserStore } from '../store/userStore'
import { useGamification } from '../hooks/useGamification'
import { XP_VALUES } from '../lib/gamificationLogic'
import type { Mission } from '../lib/types'
import MissionCard from '../components/gamification/MissionCard'

// ── Reset timer hook ───────────────────────────────────────────────────────

function useResetTimer(expiresAt?: string) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (!expiresAt) return

    function update() {
      const diff = new Date(expiresAt!).getTime() - Date.now()
      if (diff <= 0) {
        setDisplay('Reiniciando…')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setDisplay(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return display
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  color,
  count,
  completed,
  resetAt,
  xpPossible,
}: {
  icon: string
  title: string
  color: string
  count: number
  completed: number
  resetAt?: string
  xpPossible: number
}) {
  const timer = useResetTimer(resetAt)

  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">{title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#64748b]">
              {completed}/{count} completas
            </span>
            {xpPossible > 0 && (
              <>
                <span className="text-[#2a2a3a]">·</span>
                <span className="text-[10px]" style={{ color }}>
                  até +{xpPossible} XP disponível
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {timer && (
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-[10px] text-[#64748b] uppercase tracking-wider">reinicia em</span>
          <span className="font-mono-timer text-xs text-white font-bold tabular-nums">{timer}</span>
        </div>
      )}
    </div>
  )
}

function CompletionBanner({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-2xl px-4 py-3 mb-4 animate-fade-in-up">
      <span className="text-xl">🏆</span>
      <div>
        <p className="text-[#22c55e] text-sm font-semibold">
          {count === 1 ? '1 missão completa!' : `${count} missões completas!`}
        </p>
        <p className="text-[#64748b] text-xs">Continue treinando para desbloquear mais.</p>
      </div>
    </div>
  )
}

function XPSummaryCard({
  totalEarned,
  totalPossible,
  completedCount,
}: {
  totalEarned: number
  totalPossible: number
  completedCount: number
}) {
  const pct = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium">XP de Missões</p>
          <p className="text-white font-display font-bold text-2xl mt-0.5">
            {totalEarned.toLocaleString('pt-BR')}
            <span className="text-[#64748b] text-sm font-normal font-body ml-1">
              / {totalPossible.toLocaleString('pt-BR')} XP
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[#a855f7] font-bold text-xl font-mono-timer">{Math.round(pct)}%</span>
          <span className="text-[#64748b] text-xs">{completedCount} completas</span>
        </div>
      </div>
      <div className="h-2 bg-[#1a1a26] rounded-full overflow-hidden border border-[#2a2a3a]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
          }}
        />
      </div>
    </div>
  )
}

function EmptySection({ type }: { type: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#12121a] border border-dashed border-[#2a2a3a] rounded-2xl px-4 py-4">
      <span className="text-[#64748b] text-2xl">📭</span>
      <p className="text-[#64748b] text-sm">
        Nenhuma missão {type} disponível no momento
      </p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Missions() {
  const { missions } = useGamificationStore()
  const profile = useUserStore((s) => s.profile)
  const { refreshMissions } = useGamification()

  // Init / refresh missions on mount
  useEffect(() => {
    refreshMissions()
  }, [refreshMissions])

  // Split missions by type
  const daily = useMemo(() => missions.filter((m) => m.type === 'daily'), [missions])
  const weekly = useMemo(() => missions.filter((m) => m.type === 'weekly'), [missions])
  const epic = useMemo(() => missions.filter((m) => m.type === 'epic'), [missions])

  // XP stats
  const xpStats = useMemo(() => {
    const completedMissions = missions.filter((m) => m.completed)
    const earned = completedMissions.reduce((sum, m) => sum + m.xpReward, 0)
    const possible = missions.reduce((sum, m) => sum + m.xpReward, 0)
    return { earned, possible, completedCount: completedMissions.length }
  }, [missions])

  // Reset timestamps (first expirable mission of each type)
  const dailyReset = daily.find((m) => m.expiresAt)?.expiresAt
  const weeklyReset = weekly.find((m) => m.expiresAt)?.expiresAt

  // XP possible per type
  function xpLeft(list: Mission[]) {
    return list.filter((m) => !m.completed).reduce((sum, m) => sum + m.xpReward, 0)
  }

  const totalCompleted = missions.filter((m) => m.completed).length

  return (
    <div className="flex flex-col min-h-full flex-1 pb-6">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-display text-2xl font-bold text-white tracking-wide">Missões</h1>
        <p className="text-[#64748b] text-sm mt-1">
          Complete missões para ganhar XP e subir de rank
        </p>
      </div>

      <div className="px-4">
        {/* XP summary */}
        <XPSummaryCard
          totalEarned={xpStats.earned}
          totalPossible={xpStats.possible}
          completedCount={xpStats.completedCount}
        />

        {/* Completion banner */}
        <CompletionBanner count={totalCompleted} />

        {/* ── DAILY ── */}
        <div className="mb-6">
          <SectionHeader
            icon="🌅"
            title="Missões Diárias"
            color="#06b6d4"
            count={daily.length}
            completed={daily.filter((m) => m.completed).length}
            resetAt={dailyReset}
            xpPossible={xpLeft(daily)}
          />
          {daily.length === 0 ? (
            <EmptySection type="diária" />
          ) : (
            <div className="flex flex-col gap-3">
              {daily.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          )}
        </div>

        {/* ── WEEKLY ── */}
        <div className="mb-6">
          <SectionHeader
            icon="⚔️"
            title="Missões Semanais"
            color="#a855f7"
            count={weekly.length}
            completed={weekly.filter((m) => m.completed).length}
            resetAt={weeklyReset}
            xpPossible={xpLeft(weekly)}
          />
          {weekly.length === 0 ? (
            <EmptySection type="semanal" />
          ) : (
            <div className="flex flex-col gap-3">
              {weekly.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          )}
        </div>

        {/* ── EPIC ── */}
        <div className="mb-6">
          <SectionHeader
            icon="🏰"
            title="Missões Épicas"
            color="#f59e0b"
            count={epic.length}
            completed={epic.filter((m) => m.completed).length}
            xpPossible={xpLeft(epic)}
          />
          {epic.length === 0 ? (
            <EmptySection type="épica" />
          ) : (
            <div className="flex flex-col gap-3">
              {epic.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          )}
        </div>

        {/* XP reference guide */}
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
          <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium mb-3">
            Tabela de XP
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Treino completo',    xp: XP_VALUES.WORKOUT_COMPLETE,  icon: '⚔️' },
              { label: 'Progressão de carga',xp: XP_VALUES.LOAD_PROGRESSION,  icon: '📈' },
              { label: 'Missão diária',      xp: XP_VALUES.DAILY_MISSION,     icon: '🌅' },
              { label: 'Missão semanal',     xp: XP_VALUES.WEEKLY_MISSION,    icon: '⚔️' },
              { label: 'Missão épica',       xp: XP_VALUES.EPIC_MISSION,      icon: '🏰' },
              { label: 'Dungeon concluída',  xp: XP_VALUES.DUNGEON_CLEARED,   icon: '🗺️' },
              { label: 'Streak 7 dias',      xp: XP_VALUES.STREAK_7,          icon: '🔥' },
              { label: 'Streak 30 dias',     xp: XP_VALUES.STREAK_30,         icon: '💀' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 bg-[#1a1a26] rounded-xl px-3 py-2">
                <span className="text-sm flex-shrink-0">{item.icon}</span>
                <span className="text-[#64748b] text-[10px] flex-1 leading-tight">{item.label}</span>
                <span className="text-[#a855f7] text-xs font-bold font-mono-timer flex-shrink-0">
                  +{item.xp}
                </span>
              </div>
            ))}
          </div>

          {/* Rank XP guide */}
          <div className="mt-3 pt-3 border-t border-[#2a2a3a]">
            <p className="text-[#64748b] text-[10px] uppercase tracking-wider font-medium mb-2">
              XP necessário por rank
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['E','D','C','B','A','S'] as const).map((rank) => {
                const thresholds = { E: 0, D: 500, C: 2000, B: 6000, A: 15000, S: 35000 }
                const colors = { E: '#64748b', D: '#22c55e', C: '#06b6d4', B: '#3b82f6', A: '#a855f7', S: '#f59e0b' }
                return (
                  <div key={rank} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span
                      className="font-display font-bold text-xs w-7 h-7 rounded-lg flex items-center justify-center border"
                      style={{
                        color: colors[rank],
                        borderColor: `${colors[rank]}40`,
                        background: `${colors[rank]}15`,
                      }}
                    >
                      {rank}
                    </span>
                    <span className="text-[9px] text-[#64748b] tabular-nums">
                      {thresholds[rank] >= 1000
                        ? `${thresholds[rank] / 1000}k`
                        : thresholds[rank]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Current XP indicator */}
        {profile && (
          <div className="mt-3 flex items-center justify-between bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-4 py-3">
            <span className="text-[#64748b] text-xs">Seu XP atual</span>
            <span className="text-[#a855f7] font-bold font-mono-timer text-sm">
              {profile.xp.toLocaleString('pt-BR')} XP
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
