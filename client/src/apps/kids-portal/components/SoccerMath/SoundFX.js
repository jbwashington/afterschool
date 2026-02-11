/**
 * SoundFX.js - Web Audio API soccer sounds (no audio files needed)
 */

export class SoundFX {
  constructor() {
    this.ctx = null
  }

  getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    return this.ctx
  }

  play(name) {
    try {
      const fn = this[name]
      if (fn) fn.call(this)
    } catch {
      // Audio may fail silently
    }
  }

  /** Short punchy kick sound */
  kick() {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  /** Goal celebration - rising tone */
  goal() {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)

    // Second tone
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'square'
    osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.15)
    osc2.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.45)
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.5)
  }

  /** Goalie save - thud */
  save() {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  }

  /** Wrong answer buzz */
  wrong() {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, ctx.currentTime)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  /** Whistle - game start */
  whistle() {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(2400, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(2800, ctx.currentTime + 0.1)
    osc.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.15)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  }

  /** Level up chime */
  levelUp() {
    const ctx = this.getCtx()
    const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3)
      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.3)
    })
  }

  /** Game over descending tone */
  gameOver() {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.6)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.7)
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}
