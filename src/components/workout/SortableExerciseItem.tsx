import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TemplateExercise } from '../../lib/types'

type SortableExerciseItemProps = {
  exercise: TemplateExercise
  onEdit: () => void
  onDelete: () => void
}

const MUSCLE_COLORS: Record<string, string> = {
  Peito: 'text-[#ef4444]',
  Costas: 'text-[#3b82f6]',
  Ombro: 'text-[#f59e0b]',
  Bíceps: 'text-[#22c55e]',
  Tríceps: 'text-[#06b6d4]',
  Quadríceps: 'text-[#a855f7]',
  Posterior: 'text-[#ec4899]',
  Glúteos: 'text-[#f97316]',
  Panturrilha: 'text-[#84cc16]',
  Abdômen: 'text-[#14b8a6]',
  Trapézio: 'text-[#8b5cf6]',
  Core: 'text-[#64748b]',
}

export default function SortableExerciseItem({
  exercise,
  onEdit,
  onDelete,
}: SortableExerciseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const muscleColor = MUSCLE_COLORS[exercise.muscleGroup] ?? 'text-[#64748b]'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-[#1a1a26] border border-[#2a2a3a] rounded-xl px-3 py-3 group transition-all ${
        isDragging ? 'shadow-[0_0_20px_rgba(124,58,237,0.3)] border-[#7c3aed]/50' : 'hover:border-[#2a2a3a]'
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-[#2a2a3a] hover:text-[#64748b] transition-colors cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        aria-label="Arrastar"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M8 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{exercise.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-xs font-medium ${muscleColor}`}>{exercise.muscleGroup}</span>
          <span className="text-[#2a2a3a]">·</span>
          <span className="text-[#64748b] text-xs">
            {exercise.defaultSets}×{exercise.minReps}–{exercise.maxReps}
          </span>
          <span className="text-[#2a2a3a]">·</span>
          <span className="text-[#64748b] text-xs">{exercise.restSeconds}s descanso</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#a855f7] hover:bg-[#7c3aed]/10 transition-all"
          aria-label="Editar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
          aria-label="Remover"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
