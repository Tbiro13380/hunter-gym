import { useEffect, useRef } from 'react'
import type { HunterStats } from '../../lib/types'

type StatBarsProps = {
  stats: HunterStats
  animate?: boolean
  compact?: boolean
}

type StatConfig = {
  key: keyof HunterStats
  label: string
  fullLabel: string
  color: string
}

const STAT_CONFIG: StatConfig[] = [
  { key: 'STR', label: 'STR', fullLabel: 'STRENGTH',   color: '#ef4444' },
  { key: 'END', label: 'END', fullLabel: 'ENDURANCE',  color: '#4cd7f6' },
  { key: 'AGI', label: 'AGI', fullLabel: 'AGILITY',    color: '#4cd7f6' },
  { key: 'VIT', label: 'VIT', fullLabel: 'VITALITY',   color: '#efc200' },
  { key: 'INT', label: 'INT', fullLabel: 'INTELLECT',  color: '#a855f7' },
]

function SingleBar({ config, value, animate }: { config: StatConfig; value: number; animate: boolean }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    const el = barRef.current
    if (animate) {
      el.style.width = '0%'
      const t = setTimeout(() => { el.style.width = `${value}%` }, 80)
      return () => clearTimeout(t)
    } else {
      el.style.width = `${value}%`
    }
  }, [value, animate])

  return (
    <div className="flex items-center gap-3">
      {/* Stat label */}
      <span
        className="font-mono-timer text-xs font-bold w-8 flex-shrink-0 text-right"
        style={{ color: config.color }}
      >
        {config.label}
      </span>

      {/* Bar track */}
      <div className="flex-1 h-2 relative" style={{ background: '#35343a' }}>
        {/* Fill */}
        <div
          ref={barRef}
          className="absolute top-0 left-0 h-full stripe-bar transition-all duration-1000 ease-out overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${config.color}cc, ${config.color})`,
            boxShadow: `0 0 8px ${config.color}60`,
          }}
        />
      </div>

      {/* Value */}
      <span
        className="font-mono-timer text-xs font-bold w-8 flex-shrink-0 tabular-nums"
        style={{ color: config.color }}
      >
        {value}
      </span>
    </div>
  )
}

export default function StatBars({ stats, animate = true, compact = false }: StatBarsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {STAT_CONFIG.map((cfg) => (
          <div
            key={cfg.key}
            className="flex flex-col items-center px-2.5 py-1.5 border"
            style={{ background: '#1b1b20', borderColor: `${cfg.color}30` }}
          >
            <span className="font-mono-timer font-bold text-[10px]" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span className="font-mono-timer text-xs font-bold text-[#e4e1e9]">{stats[cfg.key]}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card-tactical card-tactical-accent p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="sys-label text-[#958da1]">HUNTER ATTRIBUTES</span>
        <span className="sys-label text-[#4cd7f6]">SYSTEM LEVEL</span>
      </div>

      <div className="flex flex-col gap-3">
        {STAT_CONFIG.map((cfg) => {
          const val = stats[cfg.key]
          return (
            <div key={cfg.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="sys-label text-[#958da1]">
                  {cfg.fullLabel} ({cfg.label})
                </span>
                <span className="sys-label" style={{ color: cfg.color }}>
                  {val} / 100
                </span>
              </div>
              <SingleBar config={cfg} value={val} animate={animate} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
