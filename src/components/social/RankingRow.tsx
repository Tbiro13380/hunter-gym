import type { GroupMember } from '../../lib/types'
import { RANK_COLORS } from '../../lib/gamificationLogic'

type RankingRowProps = {
  member: GroupMember
  position: number
  isCurrentUser: boolean
}

const POSITION_STYLE: Record<number, { icon: string; color: string }> = {
  1: { icon: '🥇', color: 'text-[#f59e0b]' },
  2: { icon: '🥈', color: 'text-[#94a3b8]' },
  3: { icon: '🥉', color: 'text-[#cd7f32]' },
}

export default function RankingRow({ member, position, isCurrentUser }: RankingRowProps) {
  const pos = POSITION_STYLE[position]
  const rankColor = RANK_COLORS[member.rank]

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
        isCurrentUser
          ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30'
          : 'bg-[#12121a] border-[#2a2a3a]'
      }`}
    >
      {/* Position */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {pos ? (
          <span className="text-xl">{pos.icon}</span>
        ) : (
          <span className={`font-display font-bold text-sm ${isCurrentUser ? 'text-[#a855f7]' : 'text-[#64748b]'}`}>
            {position}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 border"
        style={{
          background: `${rankColor}15`,
          borderColor: `${rankColor}40`,
          color: rankColor,
        }}
      >
        {member.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-semibold ${isCurrentUser ? 'text-[#a855f7]' : 'text-white'}`}>
            {member.name}
          </span>
          {isCurrentUser && (
            <span className="text-[9px] bg-[#7c3aed]/20 text-[#a855f7] px-1.5 py-0.5 rounded-full border border-[#7c3aed]/30">
              você
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="font-display font-bold text-[10px] px-1.5 py-0.5 rounded-md border"
            style={{ color: rankColor, borderColor: `${rankColor}40`, background: `${rankColor}15` }}
          >
            {member.rank}
          </span>
          {member.activeTitle && (
            <span className="text-[10px] text-[#f59e0b] truncate max-w-[80px]">{member.activeTitle}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#64748b]">dias</span>
          <span className="text-white font-bold text-sm font-mono-timer">{member.weeklyDays}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#64748b]">vol</span>
          <span className="text-[#06b6d4] text-xs font-mono-timer">
            {(member.weeklyVolume / 1000).toFixed(1)}t
          </span>
        </div>
        {member.streakDays > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px]">🔥</span>
            <span className="text-[#f59e0b] text-xs font-mono-timer">{member.streakDays}d</span>
          </div>
        )}
      </div>
    </div>
  )
}
