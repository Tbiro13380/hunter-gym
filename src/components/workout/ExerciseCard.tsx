import { useState, useRef, useEffect } from 'react'
import type { TemplateExercise } from '../../lib/types'
import type { ProgressionData } from '../../lib/types'

type SetEntry = { reps: number; weight: number; completedAt: string }

type ExerciseCardProps = {
  exercise: TemplateExercise
  sets: SetEntry[]
  progression: ProgressionData
  isActive: boolean           // currently resting after this exercise
  justPR: boolean             // PR was broken in this session
  onLogSet: (reps: number, weight: number) => void
  onRemoveLastSet: () => void
}

const STATUS_STYLES = {
  new:               { label: 'Novo',       bg: 'bg-[#64748b]/20',  text: 'text-[#64748b]',  border: 'border-[#64748b]/30' },
  progressing:       { label: 'Progredindo',bg: 'bg-[#22c55e]/20',  text: 'text-[#22c55e]',  border: 'border-[#22c55e]/30' },
  ready_to_progress: { label: '+2.5kg ↑',   bg: 'bg-[#06b6d4]/20',  text: 'text-[#06b6d4]',  border: 'border-[#06b6d4]/30' },
  stalled:           { label: 'Travado',    bg: 'bg-[#f59e0b]/20',  text: 'text-[#f59e0b]',  border: 'border-[#f59e0b]/30' },
}

export default function ExerciseCard({
  exercise,
  sets,
  progression,
  isActive,
  justPR,
  onLogSet,
  onRemoveLastSet,
}: ExerciseCardProps) {
  const [reps, setReps] = useState(String(exercise.minReps))
  const [weight, setWeight] = useState(String(progression.suggestedWeight || 0))
  const [flash, setFlash] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Update weight suggestion when progression changes
  useEffect(() => {
    if (sets.length === 0) {
      setWeight(String(progression.suggestedWeight || 0))
    }
  }, [progression.suggestedWeight, sets.length])

  // PR flash
  useEffect(() => {
    if (justPR) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 1200)
      return () => clearTimeout(t)
    }
  }, [justPR])

  function handleLog() {
    const r = parseInt(reps)
    const w = parseFloat(weight)
    if (isNaN(r) || r < 1 || isNaN(w) || w < 0) return
    onLogSet(r, w)
    // After logging, auto-suggest next set with same weight
    setWeight(String(w))
  }

  const status = STATUS_STYLES[progression.progressionStatus]
  const completedSets = sets.length
  const targetSets = exercise.defaultSets

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border p-4 transition-all duration-300 ${
        flash
          ? 'animate-pr-flash border-[#f59e0b]/50 bg-[#12121a]'
          : isActive
          ? 'border-[#7c3aed]/50 bg-[#12121a] shadow-[0_0_20px_rgba(124,58,237,0.15)]'
          : 'border-[#2a2a3a] bg-[#12121a]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base leading-tight">{exercise.name}</h3>
            {justPR && (
              <span className="text-[10px] font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 px-2 py-0.5 rounded-full animate-pulse">
                🏆 PR!
              </span>
            )}
          </div>
          <p className="text-[#64748b] text-xs mt-0.5">{exercise.muscleGroup}</p>
        </div>

        {/* Status badge */}
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border flex-shrink-0 ml-2 ${status.bg} ${status.text} ${status.border}`}>
          {status.label}
        </span>
      </div>

      {/* Suggestion bar */}
      {progression.lastWeight > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#1a1a26] rounded-xl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-[#64748b] flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs text-[#64748b]">
            Última: <span className="text-white font-medium">{progression.lastWeight}kg</span>
            {progression.progressionStatus === 'ready_to_progress' && (
              <span className="text-[#06b6d4] ml-2 font-medium">→ Tente {progression.suggestedWeight}kg</span>
            )}
            {progression.stalledFor > 0 && (
              <span className="text-[#f59e0b] ml-2">· Travado {progression.stalledFor}×</span>
            )}
          </span>
        </div>
      )}

      {/* Sets table */}
      {sets.length > 0 && (
        <div className="mb-3">
          <div className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-1 text-[10px] text-[#64748b] uppercase tracking-wider font-medium mb-1 px-1">
            <span>#</span>
            <span>Reps</span>
            <span>Kg</span>
            <span />
          </div>
          <div className="flex flex-col gap-1">
            {sets.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-1 items-center px-1 py-1.5 rounded-lg bg-[#1a1a26]"
              >
                <span className="text-[#64748b] text-xs font-mono">{i + 1}</span>
                <span className="text-white text-sm font-medium">{s.reps}</span>
                <span className="text-white text-sm font-medium">{s.weight}kg</span>
                {i === sets.length - 1 ? (
                  <button
                    onClick={onRemoveLastSet}
                    className="text-[#64748b] hover:text-[#ef4444] transition-colors"
                    aria-label="Remover série"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <span className="text-[#22c55e]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Series counter */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: targetSets }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i < completedSets ? 'bg-[#7c3aed]' : 'bg-[#2a2a3a]'
            }`}
          />
        ))}
      </div>

      {/* Input row */}
      {completedSets < targetSets + 2 && (
        <div className="flex items-center gap-2">
          {/* Rep input with stepper */}
          <div className="flex-1">
            <label className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1 block">Reps</label>
            <div className="flex items-center bg-[#1a1a26] border border-[#2a2a3a] rounded-xl overflow-hidden">
              <button
                onClick={() => setReps((v) => String(Math.max(1, parseInt(v) - 1)))}
                className="px-3 py-2.5 text-[#64748b] hover:text-white hover:bg-[#2a2a3a] transition-colors font-bold text-base"
              >−</button>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="flex-1 bg-transparent text-white text-center text-sm font-medium py-2.5 focus:outline-none w-10 min-w-0"
                min={1}
                max={100}
              />
              <button
                onClick={() => setReps((v) => String(parseInt(v) + 1))}
                className="px-3 py-2.5 text-[#64748b] hover:text-white hover:bg-[#2a2a3a] transition-colors font-bold text-base"
              >+</button>
            </div>
          </div>

          {/* Weight input with stepper */}
          <div className="flex-1">
            <label className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1 block">Kg</label>
            <div className="flex items-center bg-[#1a1a26] border border-[#2a2a3a] rounded-xl overflow-hidden">
              <button
                onClick={() => setWeight((v) => String(Math.max(0, parseFloat(v) - 2.5)))}
                className="px-3 py-2.5 text-[#64748b] hover:text-white hover:bg-[#2a2a3a] transition-colors font-bold text-base"
              >−</button>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                step={2.5}
                className="flex-1 bg-transparent text-white text-center text-sm font-medium py-2.5 focus:outline-none w-10 min-w-0"
                min={0}
              />
              <button
                onClick={() => setWeight((v) => String(parseFloat(v) + 2.5))}
                className="px-3 py-2.5 text-[#64748b] hover:text-white hover:bg-[#2a2a3a] transition-colors font-bold text-base"
              >+</button>
            </div>
          </div>

          {/* Confirm button */}
          <div className="flex-shrink-0 self-end">
            <label className="text-[10px] text-transparent uppercase tracking-wider mb-1 block">Ok</label>
            <button
              onClick={handleLog}
              className="w-12 h-[42px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl transition-all duration-200 hover:shadow-[0_0_12px_rgba(124,58,237,0.4)] active:scale-95 flex items-center justify-center"
              aria-label="Confirmar série"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
