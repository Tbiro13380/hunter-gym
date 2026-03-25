import { useEffect, useRef } from 'react'
import type { Mission } from '../../lib/types'

type MissionCardProps = {
  mission: Mission
  compact?: boolean
}

const TYPE_CONFIG = {
  daily:  { label: 'DAILY',     color: '#4cd7f6', borderClass: 'card-tactical-accent' },
  weekly: { label: 'WEEKLY',    color: '#a855f7', borderClass: 'card-tactical-primary' },
  epic:   { label: 'EMERGENCY', color: '#efc200', borderClass: 'card-tactical-warning' },
}

function useCountdown(expiresAt?: string): string {
  if (!expiresAt) return ''
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'EXPIRED'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 24) return `${Math.floor(h / 24)}D REMAINING`
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
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
      <div
        className={`flex items-center gap-3 px-3 py-2.5 card-tactical ${cfg.borderClass} ${mission.completed ? 'opacity-60' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="sys-label" style={{ color: cfg.color }}>{cfg.label}</span>
            <span className="sys-label" style={{ color: cfg.color }}>
              {mission.completed ? 'COMPLETE' : `${Math.round(mission.progress)}%`}
            </span>
          </div>
          <p className="text-[#e4e1e9] text-xs font-medium truncate mb-1.5">{mission.title}</p>
          <div className="h-1 relative" style={{ background: '#35343a' }}>
            <div
              ref={barRef}
              className="absolute top-0 left-0 h-full stripe-bar transition-all duration-700 ease-out"
              style={{
                background: mission.completed ? '#22c55e' : cfg.color,
                boxShadow: `0 0 6px ${mission.completed ? '#22c55e' : cfg.color}80`,
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card-tactical ${cfg.borderClass} p-4 ${mission.completed ? 'opacity-70' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="sys-label px-2 py-0.5"
              style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
            >
              {cfg.label}
            </span>
            {mission.completed && (
              <span className="sys-label px-2 py-0.5 text-[#22c55e]" style={{ background: '#22c55e18', border: '1px solid #22c55e30' }}>
                COMPLETE ✓
              </span>
            )}
          </div>
          <h3 className="font-display text-sm font-bold text-[#e4e1e9] tracking-wide">{mission.title}</h3>
          <p className="text-[#958da1] text-xs mt-0.5">{mission.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="sys-label text-[#958da1]">PROGRESS</span>
          <span className="sys-label" style={{ color: cfg.color }}>{Math.round(mission.progress)}%</span>
        </div>
        <div className="h-2 relative" style={{ background: '#35343a' }}>
          <div
            ref={barRef}
            className="absolute top-0 left-0 h-full stripe-bar transition-all duration-700 ease-out"
            style={{
              background: mission.completed ? '#22c55e' : `linear-gradient(90deg, ${cfg.color}cc, ${cfg.color})`,
              boxShadow: `0 0 8px ${mission.completed ? '#22c55e' : cfg.color}60`,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(74,68,85,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[#a855f7] text-xs">⚡</span>
            <span className="sys-label text-[#e4e1e9]">+{mission.xpReward} XP</span>
          </div>
          {mission.titleReward && (
            <div className="flex items-center gap-1">
              <span className="text-[#efc200] text-xs">◆</span>
              <span className="sys-label text-[#efc200] truncate max-w-[80px]">{mission.titleReward}</span>
            </div>
          )}
        </div>
        {timeLeft && !mission.completed && (
          <span className="sys-label text-[#958da1]">RESET: {timeLeft}</span>
        )}
      </div>
    </div>
  )
}
