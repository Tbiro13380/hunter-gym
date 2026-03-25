import { useState, useRef, useEffect } from 'react'
import type { TemplateExercise, ProgressionData } from '../../lib/types'

type SetEntry = { reps: number; weight: number; completedAt: string }

type ExerciseCardProps = {
  exercise: TemplateExercise
  sets: SetEntry[]
  progression: ProgressionData
  isActive: boolean
  justPR: boolean
  onLogSet: (reps: number, weight: number) => void
  onRemoveLastSet: () => void
}

const STATUS_CONFIG = {
  new:               { label: 'NEW',       color: '#958da1' },
  progressing:       { label: 'ON TRACK',  color: '#22c55e' },
  ready_to_progress: { label: '+2.5KG ↑',  color: '#4cd7f6' },
  stalled:           { label: 'STALLED',   color: '#efc200' },
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

  useEffect(() => {
    if (sets.length === 0) setWeight(String(progression.suggestedWeight || 0))
  }, [progression.suggestedWeight, sets.length])

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
    setWeight(String(w))
  }

  const status = STATUS_CONFIG[progression.progressionStatus]
  const completedSets = sets.length
  const targetSets = exercise.defaultSets

  const borderColor = isActive ? '#7c3aed' : justPR || flash ? '#efc200' : '#4a4455'
  const leftBorderColor = isActive ? '#7c3aed' : justPR || flash ? '#efc200' : '#4cd7f6'

  return (
    <div
      ref={cardRef}
      className={`card-tactical transition-all duration-300 ${flash ? 'animate-pr-flash' : ''}`}
      style={{
        borderColor,
        borderLeft: `3px solid ${leftBorderColor}`,
        background: isActive ? '#1f1f2e' : '#1f1f25',
        boxShadow: isActive ? '0 0 20px rgba(124,58,237,0.12)' : justPR ? '0 0 20px rgba(239,194,0,0.12)' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm font-bold text-[#e4e1e9] tracking-wide">{exercise.name}</h3>
            {justPR && (
              <span className="sys-label px-2 py-0.5 animate-bounce-in" style={{ color: '#efc200', background: '#efc20018', border: '1px solid #efc20040' }}>
                NEW PR ⚔
              </span>
            )}
          </div>
          <p className="sys-label text-[#958da1] mt-0.5">{exercise.muscleGroup}</p>
        </div>
        <span
          className="sys-label px-2 py-0.5 flex-shrink-0 ml-2"
          style={{ color: status.color, background: `${status.color}15`, border: `1px solid ${status.color}30` }}
        >
          {status.label}
        </span>
      </div>

      {/* Suggestion */}
      {progression.lastWeight > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 flex items-center gap-2" style={{ background: '#1b1b20', border: '1px solid #4a4455' }}>
          <span className="sys-label text-[#958da1]">LAST:</span>
          <span className="font-mono-timer text-sm text-[#e4e1e9] font-bold">{progression.lastWeight}kg</span>
          {progression.progressionStatus === 'ready_to_progress' && (
            <>
              <span className="text-[#4a4455] mx-1">→</span>
              <span className="sys-label" style={{ color: '#4cd7f6' }}>TRY {progression.suggestedWeight}kg</span>
            </>
          )}
          {progression.stalledFor > 0 && (
            <span className="sys-label ml-auto" style={{ color: '#efc200' }}>STALLED ×{progression.stalledFor}</span>
          )}
        </div>
      )}

      {/* Sets table */}
      {sets.length > 0 && (
        <div className="mx-4 mb-3" style={{ border: '1px solid #4a4455' }}>
          <div className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-1 px-2 py-1.5" style={{ background: '#35343a' }}>
            <span className="sys-label text-[#958da1]">#</span>
            <span className="sys-label text-[#958da1]">REPS</span>
            <span className="sys-label text-[#958da1]">KG</span>
            <span />
          </div>
          {sets.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-1 items-center px-2 py-1.5"
              style={{ borderTop: '1px solid #4a445530', background: i % 2 === 0 ? '#1f1f25' : '#1b1b20' }}
            >
              <span className="font-mono-timer text-[10px] text-[#958da1]">{i + 1}</span>
              <span className="font-mono-timer text-sm font-bold text-[#e4e1e9]">{s.reps}</span>
              <span className="font-mono-timer text-sm font-bold text-[#e4e1e9]">{s.weight}kg</span>
              {i === sets.length - 1 ? (
                <button onClick={onRemoveLastSet} className="text-[#958da1] hover:text-[#ef4444] transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <span className="text-[#22c55e] text-xs">✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Series progress dots */}
      <div className="flex gap-1 mx-4 mb-3">
        {Array.from({ length: targetSets }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 transition-all duration-300"
            style={{
              background: i < completedSets ? '#7c3aed' : '#35343a',
              boxShadow: i < completedSets ? '0 0 4px #7c3aed60' : 'none',
            }}
          />
        ))}
      </div>

      {/* Input row */}
      {completedSets < targetSets + 2 && (
        <div className="flex items-center gap-2 p-4 pt-0">
          {/* Reps */}
          <div className="flex-1">
            <div className="sys-label text-[#958da1] mb-1">REPS</div>
            <div className="flex items-center" style={{ background: '#1b1b20', border: '1px solid #4a4455' }}>
              <button onClick={() => setReps((v) => String(Math.max(1, parseInt(v) - 1)))} className="px-3 py-2.5 text-[#958da1] hover:text-[#e4e1e9] hover:bg-[#2a292f] transition-colors font-bold">−</button>
              <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="flex-1 bg-transparent text-center font-mono-timer text-sm font-bold text-[#e4e1e9] py-2.5 focus:outline-none w-10 min-w-0" min={1} max={100} />
              <button onClick={() => setReps((v) => String(parseInt(v) + 1))} className="px-3 py-2.5 text-[#958da1] hover:text-[#e4e1e9] hover:bg-[#2a292f] transition-colors font-bold">+</button>
            </div>
          </div>

          {/* Weight */}
          <div className="flex-1">
            <div className="sys-label text-[#958da1] mb-1">KG</div>
            <div className="flex items-center" style={{ background: '#1b1b20', border: '1px solid #4a4455' }}>
              <button onClick={() => setWeight((v) => String(Math.max(0, parseFloat(v) - 2.5)))} className="px-3 py-2.5 text-[#958da1] hover:text-[#e4e1e9] hover:bg-[#2a292f] transition-colors font-bold">−</button>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} step={2.5} className="flex-1 bg-transparent text-center font-mono-timer text-sm font-bold text-[#e4e1e9] py-2.5 focus:outline-none w-10 min-w-0" min={0} />
              <button onClick={() => setWeight((v) => String(parseFloat(v) + 2.5))} className="px-3 py-2.5 text-[#958da1] hover:text-[#e4e1e9] hover:bg-[#2a292f] transition-colors font-bold">+</button>
            </div>
          </div>

          {/* Confirm */}
          <div className="flex-shrink-0 self-end">
            <div className="sys-label text-transparent mb-1">OK</div>
            <button
              onClick={handleLog}
              className="w-12 h-[42px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white transition-all flex items-center justify-center animate-pulse-cta active:scale-95"
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
