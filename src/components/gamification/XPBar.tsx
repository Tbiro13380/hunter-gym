import { useEffect, useRef } from 'react'
import type { HunterRank } from '../../lib/types'
import { getXPProgress, getNextRank, RANK_COLORS } from '../../lib/gamificationLogic'
import RankBadge from './RankBadge'

type XPBarProps = {
  xp: number
  rank: HunterRank
  compact?: boolean
}

export default function XPBar({ xp, rank, compact = false }: XPBarProps) {
  const { current, needed, percentage } = getXPProgress(xp)
  const nextRank = getNextRank(rank)
  const barRef = useRef<HTMLDivElement>(null)

  // Animate fill on mount
  useEffect(() => {
    if (!barRef.current) return
    const el = barRef.current
    el.style.width = '0%'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.width = `${percentage}%`
      })
    })
  }, [percentage])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#1a1a26] rounded-full overflow-hidden">
          <div
            ref={barRef}
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ background: `linear-gradient(90deg, ${RANK_COLORS[rank]}, ${nextRank ? RANK_COLORS[nextRank] : RANK_COLORS[rank]})` }}
          />
        </div>
        <span className="text-[10px] text-[#64748b] whitespace-nowrap tabular-nums">
          {current}/{needed}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
      {/* Rank row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <RankBadge rank={rank} size="sm" glow />
          <div>
            <p className="text-white text-sm font-semibold">Rank {rank}</p>
            <p className="text-[#64748b] text-xs">{xp.toLocaleString('pt-BR')} XP total</p>
          </div>
        </div>
        {nextRank ? (
          <div className="flex items-center gap-2">
            <span className="text-[#64748b] text-xs">próximo</span>
            <RankBadge rank={nextRank} size="xs" />
          </div>
        ) : (
          <span className="text-[#f59e0b] text-xs font-display font-bold">MÁXIMO</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-[#1a1a26] rounded-full overflow-hidden border border-[#2a2a3a]">
          <div
            ref={barRef}
            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${RANK_COLORS[rank]}, ${nextRank ? RANK_COLORS[nextRank] : RANK_COLORS[rank]})`,
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
        </div>
        <span className="text-xs text-[#64748b] tabular-nums whitespace-nowrap">
          {current.toLocaleString('pt-BR')}/{needed.toLocaleString('pt-BR')}
        </span>
      </div>

      {/* Percentage */}
      <p className="text-[10px] text-[#64748b] mt-1.5 text-right">
        {percentage.toFixed(1)}% para Rank {nextRank ?? rank}
      </p>
    </div>
  )
}
