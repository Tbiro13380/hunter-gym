import { useEffect, useState, useCallback } from 'react'

type ToastItem = {
  id: string
  icon: string
  title: string
  subtitle?: string
  color: string
}

type ToastProps = {
  items: ToastItem[]
  onDismiss: (id: string) => void
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), 3500)
    return () => clearTimeout(t)
  }, [item.id, onDismiss])

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl animate-fade-in-up pointer-events-auto"
      style={{
        background: `${item.color}18`,
        borderColor: `${item.color}40`,
        boxShadow: `0 4px 24px ${item.color}25`,
      }}
      onClick={() => onDismiss(item.id)}
    >
      <span className="text-2xl flex-shrink-0 animate-bounce-in">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold leading-tight">{item.title}</p>
        {item.subtitle && (
          <p className="text-[10px] mt-0.5" style={{ color: item.color }}>
            {item.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Toast({ items, onDismiss }: ToastProps) {
  if (items.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-2 pointer-events-none">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────

export type ToastData = Omit<ToastItem, 'id'>

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((data: ToastData) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...data, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showXP = useCallback(
    (amount: number) =>
      show({ icon: '⚡', title: `+${amount} XP`, subtitle: 'Experiência ganha!', color: '#a855f7' }),
    [show]
  )

  const showRankUp = useCallback(
    (newRank: string) =>
      show({ icon: '⚔️', title: `Rank ${newRank}!`, subtitle: 'Você subiu de rank!', color: '#f59e0b' }),
    [show]
  )

  const showPR = useCallback(
    (exercise: string, weight: number) =>
      show({ icon: '🏆', title: 'Novo PR!', subtitle: `${exercise}: ${weight}kg`, color: '#f59e0b' }),
    [show]
  )

  const showTitle = useCallback(
    (title: string) =>
      show({ icon: '👑', title: 'Título desbloqueado!', subtitle: title, color: '#f59e0b' }),
    [show]
  )

  const showStreak = useCallback(
    (days: number) =>
      show({ icon: '🔥', title: `${days} dias de streak!`, subtitle: 'Continue assim!', color: '#ef4444' }),
    [show]
  )

  return { toasts, show, dismiss, showXP, showRankUp, showPR, showTitle, showStreak }
}
