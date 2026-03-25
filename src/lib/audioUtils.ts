let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function playTone(frequency: number, durationMs: number, gainValue = 0.3): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(gainValue, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + durationMs / 1000)

    oscillator.onended = () => resolve()
  })
}

export async function playRestEndBeep(): Promise<void> {
  await playTone(880, 200, 0.4)
  await playTone(440, 100, 0.3)
}

export async function playWorkoutEndSound(): Promise<void> {
  await playTone(440, 150, 0.4)
  await new Promise<void>((r) => setTimeout(r, 80))
  await playTone(554, 150, 0.4)
  await new Promise<void>((r) => setTimeout(r, 80))
  await playTone(659, 300, 0.5)
}

export async function playSetCompleteBeep(): Promise<void> {
  await playTone(660, 80, 0.2)
}

export async function playPRFlashSound(): Promise<void> {
  await playTone(880, 100, 0.3)
  await new Promise<void>((r) => setTimeout(r, 50))
  await playTone(1100, 200, 0.4)
}
