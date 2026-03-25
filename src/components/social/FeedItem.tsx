import type { FeedEvent } from '../../lib/types'
import { RANK_COLORS } from '../../lib/gamificationLogic'

type FeedItemProps = {
  event: FeedEvent
  currentUserId?: string
  onReact?: (eventId: string, emoji: string) => void
}

const REACTIONS = ['🔥', '👊', '⚔️']

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}D AGO`
  if (hours > 0) return `${hours}H AGO`
  if (mins > 0) return `${mins}M AGO`
  return 'NOW'
}

function formatFeedMessage(event: FeedEvent): { icon: string; text: string; accentKey?: string; accentVal?: string } {
  const p = event.payload
  switch (event.type) {
    case 'rank_up':
      return { icon: '⚔️', text: `ranked up`, accentKey: 'RANK', accentVal: `${String(p.oldRank)} → ${String(p.newRank)}` }
    case 'pr_broken':
      return { icon: '💪', text: `new PR on ${String(p.exercise)}`, accentKey: 'WEIGHT', accentVal: `${String(p.oldPR)}kg → ${String(p.newPR)}kg` }
    case 'streak_milestone':
      return { icon: '🔥', text: `is on fire`, accentKey: 'STREAK', accentVal: `${String(p.days)} DAYS` }
    case 'dungeon_cleared':
      return { icon: '🏰', text: `cleared dungeon`, accentKey: 'TARGET', accentVal: String(p.dungeon) }
    case 'title_unlocked':
      return { icon: '👑', text: `unlocked title`, accentKey: 'TITLE', accentVal: String(p.title) }
    case 'volume_king':
      return { icon: '📊', text: `is VOLUME KING this week`, accentKey: undefined, accentVal: undefined }
    case 'streak_broken':
      return { icon: '💀', text: `broke their streak`, accentKey: 'DAYS LOST', accentVal: String(p.days) }
    default:
      return { icon: '⚡', text: 'achieved something', accentKey: undefined, accentVal: undefined }
  }
}

export default function FeedItem({ event, currentUserId, onReact }: FeedItemProps) {
  const { icon, text, accentKey, accentVal } = formatFeedMessage(event)

  const reactionGroups = REACTIONS.map((emoji) => ({
    emoji,
    count: event.reactions.filter((r) => r.emoji === emoji).length,
    reacted: event.reactions.some((r) => r.userId === currentUserId && r.emoji === emoji),
  }))

  // Avatar rank color
  const rankColor = '#7c3aed'

  return (
    <div
      className="card-tactical animate-slide-in-left hover:bg-[#2a292f] transition-colors group"
      style={{ borderLeft: '3px solid #4a4455' }}
    >
      <div className="flex gap-4 p-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 flex items-center justify-center font-bold text-sm font-display"
            style={{
              background: `${rankColor}20`,
              border: `2px solid ${rankColor}60`,
              color: rankColor,
            }}
          >
            {event.userName.charAt(0).toUpperCase()}
          </div>
          <div
            className="absolute -bottom-1 -right-1 px-1 font-mono-timer font-bold"
            style={{ fontSize: '8px', background: RANK_COLORS['E'], color: '#131318' }}
          >
            E
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5">
            <span className="font-mono-timer text-sm font-bold" style={{ color: '#4cd7f6' }}>
              {event.userName}
            </span>
            <span className="sys-label text-[#958da1] flex-shrink-0 ml-2">{formatTime(event.createdAt)}</span>
          </div>

          <p className="text-[#e4e1e9] text-sm leading-relaxed">
            <span className="mr-1">{icon}</span>
            {text}
            {accentKey && accentVal && (
              <>
                {' — '}
                <span className="sys-label text-[#efc200]">{accentKey}:</span>
                {' '}
                <span className="font-mono-timer text-xs font-bold text-[#e4e1e9]">{accentVal}</span>
              </>
            )}
          </p>

          {/* Reactions */}
          {onReact && (
            <div className="flex items-center gap-2 mt-2.5">
              {reactionGroups.map(({ emoji, count, reacted }) => (
                <button
                  key={emoji}
                  onClick={() => onReact(event.id, emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 transition-all"
                  style={{
                    background: reacted ? '#7c3aed20' : 'transparent',
                    border: `1px solid ${reacted ? '#7c3aed60' : '#4a4455'}`,
                    color: reacted ? '#a855f7' : '#958da1',
                  }}
                >
                  <span className="text-xs">{emoji}</span>
                  {count > 0 && <span className="sys-label">{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
