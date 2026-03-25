import { ALL_TITLES } from '../../lib/gamificationLogic'

type TitleBadgeProps = {
  titleId: string
  unlocked?: boolean
  active?: boolean
  onSelect?: (id: string) => void
  size?: 'sm' | 'md'
}

export default function TitleBadge({
  titleId,
  unlocked = false,
  active = false,
  onSelect,
  size = 'md',
}: TitleBadgeProps) {
  const titleData = ALL_TITLES.find((t) => t.id === titleId)
  const label = titleData?.label ?? titleId
  const description = titleData?.description ?? ''

  const isSmall = size === 'sm'

  return (
    <button
      onClick={() => unlocked && onSelect?.(titleId)}
      disabled={!unlocked || !onSelect}
      className={`
        flex flex-col items-center gap-1.5 rounded-xl border transition-all duration-200
        ${isSmall ? 'px-2 py-2' : 'px-3 py-3'}
        ${
          !unlocked
            ? 'border-[#1a1a26] bg-[#0a0a0f] opacity-40 cursor-default'
            : active
            ? 'border-[#f59e0b]/60 bg-[#f59e0b]/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            : 'border-[#2a2a3a] bg-[#12121a] hover:border-[#7c3aed]/50 cursor-pointer'
        }
      `}
      title={description}
    >
      {/* Icon */}
      <span className={isSmall ? 'text-lg' : 'text-2xl'}>
        {unlocked ? (active ? '👑' : '🏅') : '🔒'}
      </span>

      {/* Label */}
      <span
        className={`font-display font-semibold text-center leading-tight
          ${isSmall ? 'text-[9px]' : 'text-[11px]'}
          ${!unlocked ? 'text-[#2a2a3a]' : active ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'}
        `}
      >
        {label}
      </span>

      {active && (
        <span className="text-[8px] font-medium bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded-full border border-[#f59e0b]/30">
          ativo
        </span>
      )}
    </button>
  )
}
