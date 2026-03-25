import type { HunterRank } from '../../lib/types'
import { RANK_COLORS } from '../../lib/gamificationLogic'

type RankBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type RankBadgeProps = {
  rank: HunterRank
  size?: RankBadgeSize
  glow?: boolean
  pulse?: boolean
  showLabel?: boolean
  className?: string
}

const SIZE_CONFIG: Record<RankBadgeSize, { box: string; text: string; ring: string }> = {
  xs: { box: 'w-6 h-6',   text: 'text-[10px]', ring: 'ring-1' },
  sm: { box: 'w-8 h-8',   text: 'text-xs',     ring: 'ring-1' },
  md: { box: 'w-11 h-11', text: 'text-sm',     ring: 'ring-2' },
  lg: { box: 'w-16 h-16', text: 'text-xl',     ring: 'ring-2' },
  xl: { box: 'w-24 h-24', text: 'text-3xl',    ring: 'ring-[3px]' },
}

const RANK_DESCRIPTIONS: Record<HunterRank, string> = {
  E: 'Iniciante',
  D: 'Recruta',
  C: 'Caçador',
  B: 'Elite',
  A: 'Veterano',
  S: 'Lenda',
  National: 'Nacional',
  Monarch: 'Monarca',
}

export default function RankBadge({
  rank,
  size = 'md',
  glow = false,
  pulse = false,
  showLabel = false,
  className = '',
}: RankBadgeProps) {
  const color = RANK_COLORS[rank]
  const { box, text, ring } = SIZE_CONFIG[size]
  const isMonarch = rank === 'Monarch'

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`
          ${box} rounded-xl flex items-center justify-center font-display font-bold
          ${ring} transition-all duration-300
          ${pulse ? 'animate-rank-pulse' : ''}
          ${glow ? 'animate-pulse-glow' : ''}
          ${isMonarch ? 'rank-monarch-gradient' : ''}
        `}
        style={{
          color,
          borderColor: `${color}60`,
          boxShadow: glow ? `0 0 16px ${color}50` : undefined,
          background: isMonarch
            ? undefined
            : `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        }}
      >
        {isMonarch ? (
          <span className={`${text} bg-gradient-to-br from-[#a855f7] via-[#f59e0b] to-[#a855f7] bg-clip-text text-transparent`}>
            M
          </span>
        ) : (
          <span className={text} style={{ color }}>
            {rank === 'National' ? 'N' : rank}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] text-[#64748b] font-medium">{RANK_DESCRIPTIONS[rank]}</span>
      )}
    </div>
  )
}
