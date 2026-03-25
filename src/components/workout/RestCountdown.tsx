import { useEffect } from 'react'
import { useCountdown } from '../../hooks/useCountdown'

type RestCountdownProps = {
  seconds: number
  onFinish: () => void
  onSkip: () => void
}

export default function RestCountdown({ seconds, onFinish, onSkip }: RestCountdownProps) {
  const { remaining, running, finished, formatted, start, pause, addTime, skip, restart } =
    useCountdown(seconds)

  // Auto-start on mount
  useEffect(() => {
    restart(seconds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])

  // Notify parent when finished
  useEffect(() => {
    if (finished) onFinish()
  }, [finished, onFinish])

  // Circle progress
  const RADIUS = 52
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const progress = seconds > 0 ? remaining / seconds : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center pointer-events-none">
      {/* Dim background slightly at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Panel */}
      <div className="relative pointer-events-auto w-full max-w-lg mx-auto px-4 pb-24 animate-fade-in-up">
        <div className="bg-[#12121a]/95 backdrop-blur-xl border border-[#2a2a3a] rounded-2xl p-5">
          <div className="flex items-center gap-5">
            {/* SVG Circle timer */}
            <div className="relative flex-shrink-0 w-28 h-28">
              <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
                {/* Track */}
                <circle
                  cx="60" cy="60" r={RADIUS}
                  fill="none"
                  stroke="#1a1a26"
                  strokeWidth="8"
                />
                {/* Progress */}
                <circle
                  cx="60" cy="60" r={RADIUS}
                  fill="none"
                  stroke={remaining <= 10 ? '#ef4444' : '#7c3aed'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s' }}
                />
              </svg>
              {/* Time in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-mono-timer text-2xl font-bold tabular-nums ${remaining <= 10 ? 'text-[#ef4444]' : 'text-white'}`}>
                  {formatted}
                </span>
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider mt-0.5">descanso</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1">
              <p className="text-white font-medium text-sm mb-3">Recuperando...</p>

              {/* Time adjustment */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => addTime(-15)}
                  className="flex-1 bg-[#1a1a26] hover:bg-[#2a2a3a] text-[#64748b] hover:text-white text-xs font-medium py-2 rounded-lg transition-all border border-[#2a2a3a]"
                >
                  −15s
                </button>
                <button
                  onClick={() => addTime(15)}
                  className="flex-1 bg-[#1a1a26] hover:bg-[#2a2a3a] text-[#64748b] hover:text-white text-xs font-medium py-2 rounded-lg transition-all border border-[#2a2a3a]"
                >
                  +15s
                </button>
                <button
                  onClick={running ? pause : start}
                  className="flex-1 bg-[#1a1a26] hover:bg-[#2a2a3a] text-[#64748b] hover:text-white text-xs font-medium py-2 rounded-lg transition-all border border-[#2a2a3a]"
                >
                  {running ? '⏸' : '▶'}
                </button>
              </div>

              {/* Skip */}
              <button
                onClick={() => { skip(); onSkip() }}
                className="w-full bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30 text-[#a855f7] text-xs font-semibold py-2 rounded-lg transition-all border border-[#7c3aed]/30"
              >
                Pular descanso ⚡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
