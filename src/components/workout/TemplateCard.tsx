import type { WorkoutTemplate } from '../../lib/types'

const LABEL_COLORS: Record<string, string> = {
  A: 'bg-[#7c3aed]/20 text-[#a855f7] border-[#7c3aed]/40',
  B: 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/40',
  C: 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40',
  D: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
}

type TemplateCardProps = {
  template: WorkoutTemplate
  onEdit: () => void
  onDelete: () => void
  onStart: () => void
}

export default function TemplateCard({ template, onEdit, onDelete, onStart }: TemplateCardProps) {
  const labelStyle = LABEL_COLORS[template.label] ?? 'bg-[#1a1a26] text-[#64748b] border-[#2a2a3a]'
  const totalSets = template.exercises.reduce((sum, e) => sum + e.defaultSets, 0)

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4 hover:border-[#7c3aed]/30 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border font-display font-bold text-lg ${labelStyle}`}
          >
            {template.label}
          </span>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">{template.name}</h3>
            <p className="text-[#64748b] text-xs mt-0.5">
              {template.exercises.length} exercícios · {totalSets} séries
            </p>
          </div>
        </div>

        {/* Context actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-[#64748b] hover:text-[#a855f7] hover:bg-[#7c3aed]/10 transition-all"
            aria-label="Editar treino"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
            aria-label="Excluir treino"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Exercise preview list */}
      <div className="flex flex-col gap-1 mb-4">
        {template.exercises.slice(0, 4).map((ex) => (
          <div key={ex.id} className="flex items-center gap-2 text-xs text-[#64748b]">
            <span className="w-1 h-1 rounded-full bg-[#2a2a3a] flex-shrink-0" />
            <span className="truncate">{ex.name}</span>
            <span className="ml-auto flex-shrink-0 text-[#2a2a3a]">
              {ex.defaultSets}×{ex.minReps}–{ex.maxReps}
            </span>
          </div>
        ))}
        {template.exercises.length > 4 && (
          <p className="text-xs text-[#64748b] pl-3">
            +{template.exercises.length - 4} exercício{template.exercises.length - 4 > 1 ? 's' : ''}
          </p>
        )}
        {template.exercises.length === 0 && (
          <p className="text-xs text-[#64748b] italic">Nenhum exercício ainda</p>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 hover:shadow-[0_0_16px_rgba(124,58,237,0.35)] active:scale-95 flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M8 5v14l11-7z" />
        </svg>
        Iniciar Treino
      </button>
    </div>
  )
}
