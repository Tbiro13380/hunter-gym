import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkoutTemplate, Session, TemplateExercise } from '../lib/types'

type ActiveSetEntry = {
  exerciseId: string
  exerciseName: string
  sets: { reps: number; weight: number; completedAt: string }[]
}

type WorkoutStore = {
  templates: WorkoutTemplate[]
  sessions: Session[]
  activeSession: {
    templateId: string
    templateName: string
    startedAt: string
    entries: ActiveSetEntry[]
  } | null

  // Templates
  addTemplate: (template: WorkoutTemplate) => void
  updateTemplate: (id: string, template: WorkoutTemplate) => void
  deleteTemplate: (id: string) => void
  reorderExercises: (templateId: string, exercises: TemplateExercise[]) => void

  // Active session
  startSession: (template: WorkoutTemplate) => void
  logSet: (exerciseId: string, reps: number, weight: number) => void
  removeLastSet: (exerciseId: string) => void
  finishSession: (durationSeconds: number) => Session | null
  cancelSession: () => void

  // Sessions
  addSession: (session: Session) => void
  deleteSession: (id: string) => void
}

const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'template-a',
    label: 'A',
    name: 'Push',
    exercises: [
      { id: 'ex-bench', name: 'Supino Reto', muscleGroup: 'Peito', minReps: 8, maxReps: 12, restSeconds: 90, defaultSets: 4 },
      { id: 'ex-inc-bench', name: 'Supino Inclinado', muscleGroup: 'Peito', minReps: 10, maxReps: 15, restSeconds: 90, defaultSets: 3 },
      { id: 'ex-ohp', name: 'Desenvolvimento', muscleGroup: 'Ombro', minReps: 8, maxReps: 12, restSeconds: 90, defaultSets: 4 },
      { id: 'ex-lateral', name: 'Elevação Lateral', muscleGroup: 'Ombro', minReps: 12, maxReps: 15, restSeconds: 60, defaultSets: 3 },
      { id: 'ex-tricep-push', name: 'Tríceps Pulley', muscleGroup: 'Tríceps', minReps: 10, maxReps: 15, restSeconds: 60, defaultSets: 3 },
    ],
  },
  {
    id: 'template-b',
    label: 'B',
    name: 'Pull',
    exercises: [
      { id: 'ex-pullup', name: 'Barra Fixa', muscleGroup: 'Costas', minReps: 6, maxReps: 12, restSeconds: 120, defaultSets: 4 },
      { id: 'ex-row', name: 'Remada Curvada', muscleGroup: 'Costas', minReps: 8, maxReps: 12, restSeconds: 90, defaultSets: 4 },
      { id: 'ex-cable-row', name: 'Remada Cabos', muscleGroup: 'Costas', minReps: 10, maxReps: 15, restSeconds: 60, defaultSets: 3 },
      { id: 'ex-bicep-curl', name: 'Rosca Direta', muscleGroup: 'Bíceps', minReps: 10, maxReps: 15, restSeconds: 60, defaultSets: 3 },
      { id: 'ex-hammer', name: 'Rosca Martelo', muscleGroup: 'Bíceps', minReps: 10, maxReps: 15, restSeconds: 60, defaultSets: 3 },
    ],
  },
  {
    id: 'template-c',
    label: 'C',
    name: 'Legs',
    exercises: [
      { id: 'ex-squat', name: 'Agachamento', muscleGroup: 'Quadríceps', minReps: 8, maxReps: 12, restSeconds: 120, defaultSets: 4 },
      { id: 'ex-leg-press', name: 'Leg Press', muscleGroup: 'Quadríceps', minReps: 10, maxReps: 15, restSeconds: 90, defaultSets: 4 },
      { id: 'ex-rdl', name: 'Levantamento Terra Romeno', muscleGroup: 'Posterior', minReps: 8, maxReps: 12, restSeconds: 120, defaultSets: 4 },
      { id: 'ex-leg-curl', name: 'Mesa Flexora', muscleGroup: 'Posterior', minReps: 10, maxReps: 15, restSeconds: 60, defaultSets: 3 },
      { id: 'ex-calf', name: 'Panturrilha', muscleGroup: 'Panturrilha', minReps: 15, maxReps: 20, restSeconds: 45, defaultSets: 4 },
    ],
  },
]

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      sessions: [],
      activeSession: null,

      addTemplate: (template) =>
        set((state) => ({ templates: [...state.templates, template] })),

      updateTemplate: (id, template) =>
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? template : t)),
        })),

      deleteTemplate: (id) =>
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) })),

      reorderExercises: (templateId, exercises) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, exercises } : t
          ),
        })),

      startSession: (template) => {
        const entries: ActiveSetEntry[] = template.exercises.map((ex) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: [],
        }))
        set({
          activeSession: {
            templateId: template.id,
            templateName: `${template.label} — ${template.name}`,
            startedAt: new Date().toISOString(),
            entries,
          },
        })
      },

      logSet: (exerciseId, reps, weight) => {
        const { activeSession } = get()
        if (!activeSession) return
        set({
          activeSession: {
            ...activeSession,
            entries: activeSession.entries.map((e) =>
              e.exerciseId === exerciseId
                ? {
                    ...e,
                    sets: [...e.sets, { reps, weight, completedAt: new Date().toISOString() }],
                  }
                : e
            ),
          },
        })
      },

      removeLastSet: (exerciseId) => {
        const { activeSession } = get()
        if (!activeSession) return
        set({
          activeSession: {
            ...activeSession,
            entries: activeSession.entries.map((e) =>
              e.exerciseId === exerciseId
                ? { ...e, sets: e.sets.slice(0, -1) }
                : e
            ),
          },
        })
      },

      finishSession: (durationSeconds) => {
        const { activeSession } = get()
        if (!activeSession) return null

        const filledEntries = activeSession.entries.filter((e) => e.sets.length > 0)
        if (filledEntries.length === 0) {
          set({ activeSession: null })
          return null
        }

        const session: Session = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          templateId: activeSession.templateId,
          templateName: activeSession.templateName,
          durationSeconds,
          entries: filledEntries,
        }

        set((state) => ({
          sessions: [...state.sessions, session],
          activeSession: null,
        }))

        return session
      },

      cancelSession: () => set({ activeSession: null }),

      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),

      deleteSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
    }),
    { name: 'hunter-gym-workout' }
  )
)
