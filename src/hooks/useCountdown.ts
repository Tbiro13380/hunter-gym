import { useState, useEffect, useRef, useCallback } from 'react'
import { playRestEndBeep } from '../lib/audioUtils'

type CountdownReturn = {
  remaining: number     // segundos restantes
  running: boolean
  finished: boolean
  formatted: string     // MM:SS
  start: () => void
  pause: () => void
  reset: () => void
  addTime: (seconds: number) => void
  skip: () => void
  restart: (seconds?: number) => void
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useCountdown(initialSeconds: number): CountdownReturn {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number>(0)
  const remainingRef = useRef<number>(initialSeconds)

  // Keep ref in sync
  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const now = Date.now()
    const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
    setRemaining(secondsLeft)

    if (secondsLeft <= 0) {
      clearTimer()
      setRunning(false)
      setFinished(true)
      playRestEndBeep().catch(() => {})
    }
  }, [clearTimer])

  useEffect(() => {
    if (running) {
      endTimeRef.current = Date.now() + remainingRef.current * 1000
      intervalRef.current = setInterval(tick, 250)
    } else {
      clearTimer()
    }
    return clearTimer
  }, [running, tick, clearTimer])

  const start = useCallback(() => {
    if (remainingRef.current <= 0) return
    setFinished(false)
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    setRunning(false)
    setFinished(false)
    setRemaining(initialSeconds)
    remainingRef.current = initialSeconds
  }, [initialSeconds, clearTimer])

  const addTime = useCallback((seconds: number) => {
    setRemaining((prev) => {
      const next = Math.max(0, prev + seconds)
      remainingRef.current = next
      if (running) {
        endTimeRef.current = Date.now() + next * 1000
      }
      if (next > 0 && finished) {
        setFinished(false)
      }
      return next
    })
  }, [running, finished])

  const skip = useCallback(() => {
    clearTimer()
    setRunning(false)
    setRemaining(0)
    remainingRef.current = 0
    setFinished(true)
  }, [clearTimer])

  const restart = useCallback((seconds?: number) => {
    const target = seconds ?? initialSeconds
    clearTimer()
    setFinished(false)
    setRemaining(target)
    remainingRef.current = target
    // Start immediately
    endTimeRef.current = Date.now() + target * 1000
    intervalRef.current = setInterval(tick, 250)
    setRunning(true)
  }, [initialSeconds, clearTimer, tick])

  return {
    remaining,
    running,
    finished,
    formatted: formatRemaining(remaining),
    start,
    pause,
    reset,
    addTime,
    skip,
    restart,
  }
}
