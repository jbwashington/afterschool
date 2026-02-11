// Web Audio API sound effects for Math Blaster
// All sounds generated programmatically — no audio files

export class SoundFX {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }

  // Short rising synth blip
  laser() {
    if (this.muted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  // Satisfying sparkle/chime burst
  correct() {
    if (this.muted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.06)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + i * 0.06)
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.06 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.06)
      osc.stop(now + i * 0.06 + 0.3)
    })
  }

  // Low buzz/thud
  wrong() {
    if (this.muted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, now)
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.25)
  }

  // Ascending fanfare sequence
  levelUp() {
    if (this.muted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    const notes = [392, 494, 587, 659, 784] // G4, B4, D5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + i * 0.12)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02)
      gain.gain.setValueAtTime(0.12, now + i * 0.12 + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.35)
    })
  }

  // Descending tone
  gameOver() {
    if (this.muted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    const notes = [440, 370, 311, 262] // A4, F#4, Eb4, C4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + i * 0.25)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + i * 0.25)
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.25 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.25)
      osc.stop(now + i * 0.25 + 0.5)
    })
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}
