type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' | 'rank'

type BadgeProps = {
  variant?: BadgeVariant
  children: React.ReactNode
  size?: 'sm' | 'md'
  glow?: boolean
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  primary: 'bg-[#7c3aed]/20 text-[#a855f7] border border-[#7c3aed]/30',
  accent:  'bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30',
  success: 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30',
  warning: 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30',
  danger:  'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30',
  muted:   'bg-[#1a1a26] text-[#64748b] border border-[#2a2a3a]',
  rank:    'border font-display font-bold tracking-widest',
}

export default function Badge({ variant = 'muted', children, size = 'sm', glow, className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span
      className={`
        inline-flex items-center rounded-md font-medium
        ${VARIANTS[variant]}
        ${sizeClass}
        ${glow ? 'shadow-[0_0_8px_currentColor]' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
