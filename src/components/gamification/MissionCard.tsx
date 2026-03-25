import { useEffect, useRef } from 'react'
import type { Mission } from '../../lib/types'

type MissionCardProps = {
  mission: Mission
  compact?: boolean
}

const TYPE_CONFIG = {
  daily:  { label: 'Diária',   color: '#06b6d4', bg: 'bg-[#06b6d4]/10 border-[#06b6d4]/20', icon: '🌅' },
  weekly: { label: 'Semanal',  color: '#a855f7', bg: 'bg-[#a855f7]/10 border-[#a855f7]/20', icon: '⚔️' },
  epic:   { label: 'Épica',    color: '#f59e0b', bg: 'bg-[#f59e0b]/10 border-[#f59e0b]/20', icon: '🏰' },
}

function useCountdown(expiresAt?: string): string {
  if (!expiresAt) return ''
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirado'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d restante${Math.floor(h / 24) > 1 ? 's' : ''}`
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export default function MissionCard({ mission, compact = false }: MissionCardProps) {
  const cfg = TYPE_CONFIG[mission.type]
  const timeLeft = useCountdown(mission.expiresAt)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    const el = barRef.current
    el.style.width = '0%'
    const t = setTimeout(() => { el.style.width = `${mission.progress}%` }, 80)
    return () => clearTimeout(t)
  }, [mission.progress])

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${cfg.bg} ${mission.completed ? 'opacity-60' : ''}`}>
        <span className="text-base flex-shrink-0">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{mission.title}</p>
          <div className="h-1 bg-[#0a0a0f]/40 rounded-full mt-1.5 overflow-hidden">
            <div
              ref={barRef}
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ background: cfg.color }}
            />
          </div>
        </div>
        <span className="text-xs font-bold flex-shrink-0" style={{ color: cfg.color }}>
          {mission.completed ? '✓' : `${Math.round(mission.progress)}%`}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-[#12121a] border rounded-2xl p-4 transition-all duration-200 ${
      mission.completed
        ? 'border-[#22c55e]/30 opacity-75'
        : 'border-[#2a2a3a] hover:border-[#2a2a3a]'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-semibold ${mission.completed ? 'text-[#22c55e]' : 'text-white'}`}>
                {mission.title}
              </h3>
              {mission.completed && (
                <span className="text-[10px] bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 px-1.5 py-0.5 rounded-md font-medium">
                  Completa ✓
                </span>
              )}
            </div>
            <p className="text-[#64748b] text-xs mt-0.5">{mission.description}</p>
          </div>
        </div>

        {/* Type badge */}
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${cfg.bg}`} style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Progresso</span>
          <span className="text-xs font-medium" style={{ color: cfg.color }}>
            {Math.round(mission.progress)}%
          </span>
        </div>
        <div className="h-2 bg-[#1a1a26] rounded-full overflow-hidden border border-[#2a2a3a]">
          <div
            ref={barRef}
            className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ background: mission.completed ? '#22c55e' : cfg.color }}
          >
            <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-white/15 to-transparent w-full" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Rewards */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[#a855f7] text-xs">⚡</span>
            <span className="text-xs text-white font-medium">+{mission.xpReward} XP</span>
          </div>
          {mission.titleReward && (
            <div className="flex items-center gap-1">
              <span className="text-[#f59e0b] text-xs">👑</span>
              <span className="text-xs text-[#f59e0b] font-medium truncate max-w-[80px]">
                {mission.titleReward}
              </span>
            </div>
          )}
        </div>

        {/* Timer */}
        {timeLeft && !mission.completed && (
          <span className="text-[10px] text-[#64748b]">⏱ {timeLeft}</span>
        )}
      </div>
    </div>
  )
}
