import type { Dungeon } from '../../lib/types'

type DungeonCardProps = {
  dungeon: Dungeon
  currentUserId?: string
  onJoin?: (dungeonId: string) => void
  onComplete?: (dungeonId: string) => void
  compact?: boolean
}

const DIFFICULTY_CONFIG = {
  1: { stars: '★☆☆☆☆', color: '#22c55e', label: 'Fácil' },
  2: { stars: '★★☆☆☆', color: '#06b6d4', label: 'Normal' },
  3: { stars: '★★★☆☆', color: '#f59e0b', label: 'Difícil' },
  4: { stars: '★★★★☆', color: '#ef4444', label: 'Épico' },
  5: { stars: '★★★★★', color: '#a855f7', label: 'Lendário' },
}

function formatDeadline(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Expirada'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h restantes`
  return `${hours}h restantes`
}

export default function DungeonCard({
  dungeon,
  currentUserId,
  onJoin,
  onComplete,
  compact = false,
}: DungeonCardProps) {
  const diff = DIFFICULTY_CONFIG[dungeon.difficulty]
  const totalParticipants = dungeon.participants.length
  const completedCount = dungeon.participants.filter((p) => p.completed).length
  const progressPct = totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0
  const isParticipant = dungeon.participants.some((p) => p.userId === currentUserId)
  const hasCompleted = dungeon.participants.find((p) => p.userId === currentUserId)?.completed

  const isExpired = new Date(dungeon.deadlineAt).getTime() < Date.now()

  if (compact) {
    return (
      <div className="bg-[#1a1a26] border border-[#2a2a3a] rounded-xl p-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🏰</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{dungeon.name}</p>
            <p className="text-[#64748b] text-xs mt-0.5 truncate">{dungeon.objective}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: diff.color }}
                />
              </div>
              <span className="text-xs text-[#64748b] flex-shrink-0">
                {completedCount}/{totalParticipants}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: diff.color }}>
            ★{dungeon.difficulty}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-[#12121a] border rounded-2xl p-4 transition-all ${
      isExpired ? 'border-[#2a2a3a] opacity-60' : 'border-[#2a2a3a] hover:border-[#7c3aed]/30'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#1a1a26] border border-[#2a2a3a] flex items-center justify-center flex-shrink-0 text-xl">
          🏰
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-sm leading-tight">{dungeon.name}</h3>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
              style={{ color: diff.color, background: `${diff.color}15`, border: `1px solid ${diff.color}30` }}
            >
              {diff.label}
            </span>
          </div>
          <p className="text-[#64748b] text-xs mt-1 line-clamp-2">{dungeon.description}</p>
        </div>
      </div>

      {/* Objective */}
      <div className="bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-3 py-2.5 mb-4">
        <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-1">Objetivo</p>
        <p className="text-white text-xs">{dungeon.objective}</p>
      </div>

      {/* Difficulty stars */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-sm" style={{ color: diff.color }}>{diff.stars}</span>
        <span className="text-xs text-[#64748b]">Dificuldade {dungeon.difficulty}</span>
      </div>

      {/* Collective progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#64748b] uppercase tracking-wider">Progresso coletivo</span>
          <span className="text-xs font-medium" style={{ color: diff.color }}>
            {completedCount}/{totalParticipants} completaram
          </span>
        </div>
        <div className="h-2.5 bg-[#1a1a26] rounded-full overflow-hidden border border-[#2a2a3a]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%`, background: diff.color }}
          />
        </div>

        {/* Participant avatars */}
        {dungeon.participants.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {dungeon.participants.slice(0, 6).map((p) => (
              <div
                key={p.userId}
                className="relative group"
                title={p.userName}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    p.completed
                      ? 'bg-[#22c55e]/20 border-[#22c55e]/50 text-[#22c55e]'
                      : 'bg-[#1a1a26] border-[#2a2a3a] text-[#64748b]'
                  }`}
                >
                  {p.userName.charAt(0).toUpperCase()}
                </div>
              </div>
            ))}
            {dungeon.participants.length > 6 && (
              <span className="text-[10px] text-[#64748b]">+{dungeon.participants.length - 6}</span>
            )}
          </div>
        )}
      </div>

      {/* Rewards + deadline */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[#a855f7] text-xs">⚡</span>
            <span className="text-xs text-white font-medium">+{dungeon.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#f59e0b] text-xs">👑</span>
            <span className="text-xs text-[#f59e0b] font-medium truncate max-w-[80px]">{dungeon.titleReward}</span>
          </div>
        </div>
        <span className={`text-[10px] ${isExpired ? 'text-[#ef4444]' : 'text-[#64748b]'}`}>
          {isExpired ? 'Expirada' : formatDeadline(dungeon.deadlineAt)}
        </span>
      </div>

      {/* Action button */}
      {!isExpired && (
        <div>
          {!isParticipant && onJoin && (
            <button
              onClick={() => onJoin(dungeon.id)}
              className="w-full bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30 text-[#a855f7] border border-[#7c3aed]/30 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            >
              Entrar na Dungeon
            </button>
          )}
          {isParticipant && !hasCompleted && onComplete && (
            <button
              onClick={() => onComplete(dungeon.id)}
              className="w-full bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            >
              Marcar como Concluída ✓
            </button>
          )}
          {hasCompleted && (
            <div className="w-full bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 text-sm font-semibold py-2.5 rounded-xl text-center">
              Dungeon Concluída ✓
            </div>
          )}
        </div>
      )}
    </div>
  )
}
