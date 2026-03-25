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
  const rankColor = RANK_COLORS[rank]

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
        <div className="flex-1 h-1 relative" style={{ background: '#35343a' }}>
          <div
            ref={barRef}
            className="absolute top-0 left-0 h-full stripe-bar transition-all duration-1000 ease-out"
            style={{
              background: rankColor,
              boxShadow: `0 0 6px ${rankColor}60`,
            }}
          />
        </div>
        <span className="sys-label text-[#958da1] whitespace-nowrap tabular-nums">
          {current}/{needed}
        </span>
      </div>
    )
  }

  return (
    <div className="card-tactical card-tactical-primary p-4">
      {/* Rank row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <RankBadge rank={rank} size="sm" glow />
          <div>
            <p className="font-display text-sm font-semibold text-[#e4e1e9] tracking-widest">RANK {rank}</p>
            <p className="sys-label text-[#958da1]">{xp.toLocaleString('pt-BR')} XP TOTAL</p>
          </div>
        </div>
        {nextRank ? (
          <div className="flex items-center gap-2">
            <span className="sys-label text-[#958da1]">NEXT</span>
            <RankBadge rank={nextRank} size="xs" />
          </div>
        ) : (
          <span className="sys-label" style={{ color: '#efc200' }}>MAX RANK</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 relative" style={{ background: '#35343a' }}>
          <div
            ref={barRef}
            className="absolute top-0 left-0 h-full stripe-bar transition-all duration-1000 ease-out"
            style={{
              background: nextRank
                ? `linear-gradient(90deg, ${rankColor}, ${RANK_COLORS[nextRank]})`
                : rankColor,
              boxShadow: `0 0 10px ${rankColor}50`,
            }}
          />
        </div>
        <span className="sys-label text-[#958da1] tabular-nums whitespace-nowrap">
          {current.toLocaleString('pt-BR')}/{needed.toLocaleString('pt-BR')}
        </span>
      </div>

      <p className="sys-label text-[#958da1] mt-2 text-right">
        {percentage.toFixed(1)}% → RANK {nextRank ?? rank}
      </p>
    </div>
  )
}
