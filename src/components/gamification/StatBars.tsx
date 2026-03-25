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
  description: string
  color: string
  icon: string
}

const STAT_CONFIG: StatConfig[] = [
  {
    key: 'STR',
    label: 'STR',
    description: 'Força — volume de empurrar acumulado',
    color: '#ef4444',
    icon: '⚔️',
  },
  {
    key: 'END',
    label: 'END',
    description: 'Resistência — consistência semanal',
    color: '#22c55e',
    icon: '🛡️',
  },
  {
    key: 'AGI',
    label: 'AGI',
    description: 'Agilidade — eficiência do treino',
    color: '#06b6d4',
    icon: '⚡',
  },
  {
    key: 'VIT',
    label: 'VIT',
    description: 'Vitalidade — frequência semanal',
    color: '#f59e0b',
    icon: '💛',
  },
  {
    key: 'INT',
    label: 'INT',
    description: 'Inteligência — variedade de exercícios',
    color: '#a855f7',
    icon: '📖',
  },
]

function SingleBar({
  config,
  value,
  animate,
}: {
  config: StatConfig
  value: number
  animate: boolean
}) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    const el = barRef.current
    if (animate) {
      el.style.width = '0%'
      const timer = setTimeout(() => {
        el.style.width = `${value}%`
      }, 100)
      return () => clearTimeout(timer)
    } else {
      el.style.width = `${value}%`
    }
  }, [value, animate])

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <span
        className="font-display font-bold text-xs w-7 flex-shrink-0 text-right"
        style={{ color: config.color }}
      >
        {config.label}
      </span>

      {/* Bar track */}
      <div className="flex-1 h-3 bg-[#1a1a26] rounded-full overflow-hidden border border-[#2a2a3a] relative">
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${config.color}cc, ${config.color})` }}
        >
          {/* Shine */}
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </div>

      {/* Value */}
      <span className="text-xs font-mono-timer w-7 flex-shrink-0 text-right" style={{ color: config.color }}>
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
            className="flex flex-col items-center px-2.5 py-1.5 rounded-lg bg-[#1a1a26] border border-[#2a2a3a] min-w-[3rem]"
          >
            <span className="font-display font-bold text-xs" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span className="text-white font-mono-timer text-xs font-bold">{stats[cfg.key]}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
      <p className="text-[#64748b] text-xs uppercase tracking-wider font-medium mb-4">
        Atributos do Caçador
      </p>
      <div className="flex flex-col gap-3">
        {STAT_CONFIG.map((cfg) => (
          <SingleBar
            key={cfg.key}
            config={cfg}
            value={stats[cfg.key]}
            animate={animate}
          />
        ))}
      </div>
    </div>
  )
}
