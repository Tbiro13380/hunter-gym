import type { Session } from '../../lib/types'
import { getSessionVolume } from '../../lib/progressionLogic'

type WorkoutSummaryModalProps = {
  session: Session
  xpGained: number
  events: { type: string; payload: Record<string, unknown> }[]
  onClose: () => void
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}min`
  if (m > 0) return `${m}min ${s}s`
  return `${s}s`
}

const EVENT_LABELS: Record<string, string> = {
  rank_up: '⚔️ Rank subiu!',
  pr_broken: '🏆 PR quebrado!',
  streak_milestone: '🔥 Marco de streak!',
  title_unlocked: '👑 Título desbloqueado!',
}

export default function WorkoutSummaryModal({ session, xpGained, events, onClose }: WorkoutSummaryModalProps) {
  const totalVolume = getSessionVolume(session)
  const totalSets = session.entries.reduce((sum, e) => sum + e.sets.length, 0)
  const prEvents = events.filter((e) => e.type === 'pr_broken')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#12121a] border border-[#2a2a3a] rounded-2xl overflow-hidden animate-fade-in-up">

        {/* Top banner */}
        <div className="bg-gradient-to-r from-[#7c3aed]/30 to-[#06b6d4]/20 border-b border-[#2a2a3a] px-5 py-5 text-center">
          <div className="text-4xl mb-1">⚔️</div>
          <h2 className="font-display text-xl font-bold text-white tracking-wide">Treino Concluído</h2>
          <p className="text-[#64748b] text-sm mt-1">{session.templateName}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-0 divide-x divide-[#2a2a3a] border-b border-[#2a2a3a]">
          <StatCell label="Duração" value={formatDuration(session.durationSeconds)} />
          <StatCell label="Volume" value={`${Math.round(totalVolume / 1000).toFixed(1)}t`} />
          <StatCell label="Séries" value={String(totalSets)} />
        </div>

        {/* XP gained */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#2a2a3a]">
          <span className="text-[#64748b] text-sm">XP Ganho</span>
          <span className="text-[#a855f7] font-display font-bold text-xl">+{xpGained} XP</span>
        </div>

        {/* PRs */}
        {prEvents.length > 0 && (
          <div className="px-5 py-4 border-b border-[#2a2a3a]">
            <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2 font-medium">Recordes quebrados</p>
            <div className="flex flex-col gap-2">
              {prEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-[#f59e0b]">🏆</span>
                  <span className="text-white">{String(ev.payload.exercise)}</span>
                  <span className="text-[#64748b] ml-auto">
                    {String(ev.payload.oldPR)}kg → <span className="text-[#22c55e] font-bold">{String(ev.payload.newPR)}kg</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other events */}
        {events.filter((e) => e.type !== 'pr_broken').length > 0 && (
          <div className="px-5 py-4 border-b border-[#2a2a3a]">
            <div className="flex flex-col gap-2">
              {events
                .filter((e) => e.type !== 'pr_broken')
                .map((ev, i) => (
                  <p key={i} className="text-sm text-[#a855f7]">
                    {EVENT_LABELS[ev.type] ?? ev.type}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Exercise summary */}
        <div className="px-5 py-4 max-h-40 overflow-y-auto border-b border-[#2a2a3a]">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2 font-medium">Exercícios</p>
          <div className="flex flex-col gap-2">
            {session.entries.map((entry) => {
              const maxW = Math.max(...entry.sets.map((s) => s.weight), 0)
              return (
                <div key={entry.exerciseId} className="flex items-center gap-2 text-sm">
                  <span className="text-white truncate flex-1">{entry.exerciseName}</span>
                  <span className="text-[#64748b] flex-shrink-0">
                    {entry.sets.length}× · max {maxW}kg
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Close button */}
        <div className="px-5 py-4">
          <button
            onClick={onClose}
            className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 font-display tracking-wider hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95"
          >
            CONTINUAR
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center py-4 px-2">
      <span className="text-white font-bold text-xl font-mono-timer">{value}</span>
      <span className="text-[#64748b] text-xs mt-0.5">{label}</span>
    </div>
  )
}
