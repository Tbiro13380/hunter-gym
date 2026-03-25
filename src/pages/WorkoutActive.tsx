import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useWorkoutStore } from '../store/workoutStore'
import { useUserStore } from '../store/userStore'
import { useStopwatch } from '../hooks/useStopwatch'
import { useProgressionBatch } from '../hooks/useProgressionEngine'
import { useGamification } from '../hooks/useGamification'
import { XP_VALUES } from '../lib/gamificationLogic'
import type { Session, GamificationEvent } from '../lib/types'

import ExerciseCard from '../components/workout/ExerciseCard'
import RestCountdown from '../components/workout/RestCountdown'
import WorkoutSummaryModal from '../components/workout/WorkoutSummaryModal'
import Modal from '../components/ui/Modal'

export default function WorkoutActive() {
  const navigate = useNavigate()
  const { activeSession, templates, sessions, logSet, removeLastSet, finishSession, cancelSession } =
    useWorkoutStore()
  const profile = useUserStore((s) => s.profile)
  const { processCompletedSession } = useGamification()

  const stopwatch = useStopwatch(true)

  // Active rest countdown state
  const [restState, setRestState] = useState<{ exerciseId: string; seconds: number } | null>(null)

  // Summary modal state
  const [summary, setSummary] = useState<{
    session: Session
    xpGained: number
    events: GamificationEvent[]
  } | null>(null)

  // Cancel confirmation
  const [cancelConfirm, setCancelConfirm] = useState(false)

  // PR tracking within current session
  const [sessionPRs, setSessionPRs] = useState<Set<string>>(new Set())

  // Redirect if no active session
  useEffect(() => {
    if (!activeSession) navigate('/treino', { replace: true })
  }, [activeSession, navigate])

  // Get the template for this session
  const template = templates.find((t) => t.id === activeSession?.templateId)

  // Batch progression data for all exercises
  const exerciseIds = template?.exercises.map((e) => e.id) ?? []
  const progressions = useProgressionBatch(exerciseIds)

  if (!activeSession || !template) return null

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleLogSet(exerciseId: string, reps: number, weight: number) {
    logSet(exerciseId, reps, weight)

    // Check if this is a PR
    const prevMax = sessions
      .flatMap((s) => s.entries)
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => e.sets)
      .reduce((max, set) => Math.max(max, set.weight), 0)

    if (weight > prevMax && prevMax > 0) {
      setSessionPRs((prev) => new Set(prev).add(exerciseId))
    }

    // Find rest time for this exercise
    const ex = template?.exercises.find((e) => e.id === exerciseId)
    if (ex) {
      setRestState({ exerciseId, seconds: ex.restSeconds })
    }
  }

  function handleRemoveLastSet(exerciseId: string) {
    removeLastSet(exerciseId)
    if (restState?.exerciseId === exerciseId) {
      setRestState(null)
    }
  }

  const handleRestFinish = useCallback(() => {
    setRestState(null)
  }, [])

  const handleRestSkip = useCallback(() => {
    setRestState(null)
  }, [])

  function handleFinish() {
    stopwatch.pause()
    const session = finishSession(stopwatch.elapsed)
    if (!session) {
      navigate('/treino', { replace: true })
      return
    }

    // Calculate XP gained
    let xp = XP_VALUES.WORKOUT_COMPLETE
    for (const entry of session.entries) {
      const prevMax = sessions
        .flatMap((s) => s.entries)
        .filter((e) => e.exerciseId === entry.exerciseId)
        .flatMap((e) => e.sets)
        .reduce((max, set) => Math.max(max, set.weight), 0)
      const newMax = Math.max(...entry.sets.map((s) => s.weight), 0)
      if (newMax > prevMax && prevMax > 0) xp += XP_VALUES.LOAD_PROGRESSION
    }

    // Process gamification (store updates happen here)
    processCompletedSession(session)

    // Collect PR events from the session for summary display
    const prEvents: GamificationEvent[] = []
    for (const entry of session.entries) {
      const prevMax = sessions
        .flatMap((s) => s.entries)
        .filter((e) => e.exerciseId === entry.exerciseId)
        .flatMap((e) => e.sets)
        .reduce((max, set) => Math.max(max, set.weight), 0)
      const newMax = Math.max(...entry.sets.map((s) => s.weight), 0)
      if (newMax > prevMax && prevMax > 0) {
        prEvents.push({
          type: 'pr_broken',
          payload: { exercise: entry.exerciseName, oldPR: prevMax, newPR: newMax },
          xpGained: XP_VALUES.LOAD_PROGRESSION,
        })
      }
    }

    setSummary({ session, xpGained: xp, events: prEvents })
  }

  function handleCancel() {
    cancelSession()
    navigate('/treino', { replace: true })
  }

  function handleSummaryClose() {
    setSummary(null)
    navigate('/', { replace: true })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-[#2a2a3a] px-4 py-3 flex items-center gap-3">
        {/* Cancel */}
        <button
          onClick={() => setCancelConfirm(true)}
          className="p-2 rounded-xl bg-[#1a1a26] text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex-shrink-0"
          aria-label="Cancelar treino"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Workout info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{activeSession.templateName}</p>
          <p className="text-[#64748b] text-xs">{profile?.name ?? 'Caçador'}</p>
        </div>

        {/* Stopwatch */}
        <div className="flex items-center gap-2 bg-[#1a1a26] rounded-xl px-3 py-2 border border-[#2a2a3a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse flex-shrink-0" />
          <span className="font-mono-timer text-white text-sm font-bold tabular-nums">
            {stopwatch.formatted}
          </span>
        </div>

        {/* Finish */}
        <button
          onClick={handleFinish}
          className="bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 flex-shrink-0"
        >
          Encerrar
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex-1 px-4 pt-4 pb-32 flex flex-col gap-4">
        {template.exercises.map((exercise) => {
          const entryData = activeSession.entries.find((e) => e.exerciseId === exercise.id)
          const sets = entryData?.sets ?? []
          const prog = progressions[exercise.id] ?? {
            lastWeight: 0,
            suggestedWeight: 0,
            progressionStatus: 'new' as const,
            stalledFor: 0,
            weeklyProgress: [],
          }

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={sets}
              progression={prog}
              isActive={restState?.exerciseId === exercise.id}
              justPR={sessionPRs.has(exercise.id)}
              onLogSet={(reps, weight) => handleLogSet(exercise.id, reps, weight)}
              onRemoveLastSet={() => handleRemoveLastSet(exercise.id)}
            />
          )
        })}

        {/* Progress indicator */}
        <div className="mt-2 px-1">
          <div className="flex items-center justify-between text-xs text-[#64748b] mb-2">
            <span>Progresso do treino</span>
            <span>
              {activeSession.entries.filter((e) => e.sets.length > 0).length}/{template.exercises.length} exercícios
            </span>
          </div>
          <div className="h-1.5 bg-[#1a1a26] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7c3aed] rounded-full transition-all duration-500"
              style={{
                width: `${
                  template.exercises.length > 0
                    ? (activeSession.entries.filter((e) => e.sets.length > 0).length /
                        template.exercises.length) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Rest countdown overlay */}
      {restState && (
        <RestCountdown
          key={`${restState.exerciseId}-${restState.seconds}`}
          seconds={restState.seconds}
          onFinish={handleRestFinish}
          onSkip={handleRestSkip}
        />
      )}

      {/* Cancel confirmation modal */}
      <Modal open={cancelConfirm} onClose={() => setCancelConfirm(false)} title="Cancelar Treino" size="sm">
        <p className="text-[#64748b] text-sm mb-5">
          Tem certeza? Todo o progresso deste treino será perdido.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setCancelConfirm(false)}
            className="flex-1 bg-[#1a1a26] hover:bg-[#2a2a3a] text-white border border-[#2a2a3a] text-sm font-medium py-2.5 rounded-xl transition-all"
          >
            Continuar
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 text-sm font-medium py-2.5 rounded-xl transition-all"
          >
            Cancelar Treino
          </button>
        </div>
      </Modal>

      {/* Summary modal */}
      {summary && (
        <WorkoutSummaryModal
          session={summary.session}
          xpGained={summary.xpGained}
          events={summary.events}
          onClose={handleSummaryClose}
        />
      )}
    </div>
  )
}
