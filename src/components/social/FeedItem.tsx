import type { FeedEvent } from '../../lib/types'

type FeedItemProps = {
  event: FeedEvent
  currentUserId?: string
  onReact?: (eventId: string, emoji: string) => void
}

const EMOJIS = ['🔥', '👊', '⚔️']

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d atrás`
  if (hours > 0) return `${hours}h atrás`
  if (mins > 0) return `${mins}min atrás`
  return 'agora'
}

function formatFeedMessage(event: FeedEvent): { icon: string; text: string } {
  const p = event.payload
  switch (event.type) {
    case 'rank_up':
      return {
        icon: '⚔️',
        text: `subiu de Rank ${String(p.oldRank)} → ${String(p.newRank)}`,
      }
    case 'pr_broken':
      return {
        icon: '💪',
        text: `quebrou o PR no ${String(p.exercise)}: ${String(p.oldPR)}kg → ${String(p.newPR)}kg`,
      }
    case 'streak_milestone':
      return {
        icon: '🔥',
        text: `está em chamas: ${String(p.days)} dias de streak`,
      }
    case 'dungeon_cleared':
      return {
        icon: '🏰',
        text: `completou a dungeon '${String(p.dungeon)}'`,
      }
    case 'title_unlocked':
      return {
        icon: '👑',
        text: `desbloqueou o título '${String(p.title)}'`,
      }
    case 'volume_king':
      return {
        icon: '📊',
        text: 'é o Volume King dessa semana',
      }
    case 'streak_broken':
      return {
        icon: '💀',
        text: `quebrou o streak de ${String(p.days)} dias`,
      }
    default:
      return { icon: '⚡', text: 'realizou uma conquista' }
  }
}

export default function FeedItem({ event, currentUserId, onReact }: FeedItemProps) {
  const { icon, text } = formatFeedMessage(event)

  // Group reactions by emoji
  const reactionGroups = EMOJIS.map((emoji) => ({
    emoji,
    count: event.reactions.filter((r) => r.emoji === emoji).length,
    reacted: event.reactions.some((r) => r.userId === currentUserId && r.emoji === emoji),
  }))

  return (
    <div className="flex gap-3 animate-slide-in-left">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#1a1a26] border border-[#2a2a3a] flex items-center justify-center flex-shrink-0 font-bold text-sm text-[#a855f7]">
        {event.userName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl rounded-tl-none px-3.5 py-3">
          <p className="text-sm text-[#f1f5f9] leading-snug">
            <span className="text-[#a855f7] font-semibold">{event.userName}</span>{' '}
            <span className="mr-1">{icon}</span>
            {text}
          </p>
        </div>

        {/* Reactions + time */}
        <div className="flex items-center gap-2 mt-1.5 px-1">
          {onReact && (
            <div className="flex items-center gap-1">
              {reactionGroups.map(({ emoji, count, reacted }) => (
                <button
                  key={emoji}
                  onClick={() => onReact(event.id, emoji)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all ${
                    reacted
                      ? 'bg-[#7c3aed]/20 border-[#7c3aed]/40 text-[#a855f7]'
                      : 'bg-[#1a1a26] border-[#2a2a3a] text-[#64748b] hover:border-[#64748b]'
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              ))}
            </div>
          )}
          <span className="text-[10px] text-[#64748b] ml-auto">{formatTime(event.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
