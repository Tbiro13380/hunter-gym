import { useState, useEffect, useRef, useCallback } from 'react'

type StopwatchReturn = {
  elapsed: number       // segundos totais
  running: boolean
  formatted: string     // MM:SS ou HH:MM:SS
  start: () => void
  pause: () => void
  reset: () => void
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

export function useStopwatch(autoStart = false): StopwatchReturn {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const accumulatedRef = useRef<number>(0)

  const tick = useCallback(() => {
    const now = Date.now()
    const delta = Math.floor((now - startTimeRef.current) / 1000)
    setElapsed(accumulatedRef.current + delta)
  }, [])

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now()
      intervalRef.current = setInterval(tick, 500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, tick])

  const start = useCallback(() => {
    if (!running) {
      startTimeRef.current = Date.now()
      setRunning(true)
    }
  }, [running])

  const pause = useCallback(() => {
    if (running) {
      accumulatedRef.current = elapsed
      setRunning(false)
    }
  }, [running, elapsed])

  const reset = useCallback(() => {
    setRunning(false)
    setElapsed(0)
    accumulatedRef.current = 0
  }, [])

  return {
    elapsed,
    running,
    formatted: formatElapsed(elapsed),
    start,
    pause,
    reset,
  }
}
