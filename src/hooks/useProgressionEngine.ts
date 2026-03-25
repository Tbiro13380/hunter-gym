import { useMemo } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { getProgressionData } from '../lib/progressionLogic'
import type { ProgressionData } from '../lib/types'

export function useProgressionEngine(exerciseId: string): ProgressionData {
  const sessions = useWorkoutStore((s) => s.sessions)

  return useMemo(
    () => getProgressionData(exerciseId, sessions),
    [exerciseId, sessions]
  )
}

// Batch version: returns progression data for multiple exercises at once
export function useProgressionBatch(
  exerciseIds: string[]
): Record<string, ProgressionData> {
  const sessions = useWorkoutStore((s) => s.sessions)

  return useMemo(() => {
    const result: Record<string, ProgressionData> = {}
    for (const id of exerciseIds) {
      result[id] = getProgressionData(id, sessions)
    }
    return result
  }, [exerciseIds, sessions])
}
