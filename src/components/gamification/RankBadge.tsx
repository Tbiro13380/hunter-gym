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

const SIZE_CONFIG: Record<RankBadgeSize, { box: string; text: string }> = {
  xs: { box: 'w-6 h-6',   text: 'text-[10px]' },
  sm: { box: 'w-8 h-8',   text: 'text-xs'     },
  md: { box: 'w-11 h-11', text: 'text-sm'     },
  lg: { box: 'w-16 h-16', text: 'text-xl'     },
  xl: { box: 'w-24 h-24', text: 'text-3xl'    },
}

const RANK_DESCRIPTIONS: Record<HunterRank, string> = {
  E: 'INITIATE',
  D: 'RECRUIT',
  C: 'HUNTER',
  B: 'ELITE',
  A: 'VETERAN',
  S: 'LEGEND',
  National: 'NATIONAL',
  Monarch: 'MONARCH',
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
  const { box, text } = SIZE_CONFIG[size]
  const isMonarch = rank === 'Monarch'

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`
          ${box} flex items-center justify-center font-display font-bold
          transition-all duration-300
          ${pulse ? 'animate-rank-pulse' : ''}
          ${glow ? 'animate-pulse-glow' : ''}
          ${isMonarch ? 'rank-monarch-gradient' : ''}
        `}
        style={{
          color,
          border: `2px solid ${color}60`,
          background: isMonarch ? undefined : `${color}15`,
          boxShadow: glow ? `0 0 16px ${color}50, inset 0 0 20px ${color}08` : undefined,
        }}
      >
        {isMonarch ? (
          <span className={`${text} bg-gradient-to-br from-[#a855f7] via-[#efc200] to-[#a855f7] bg-clip-text text-transparent font-black`}>
            M
          </span>
        ) : (
          <span className={`${text} font-black`} style={{ color }}>
            {rank === 'National' ? 'N' : rank}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="sys-label text-[#958da1]">{RANK_DESCRIPTIONS[rank]}</span>
      )}
    </div>
  )
}
