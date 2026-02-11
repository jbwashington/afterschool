// Web Audio API sound synthesizer for all Mischief Zone features
// Generates sounds programmatically — no audio files needed

export class SoundSynth {
  constructor() {
    this.ctx = null
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

  playSound(name) {
    const method = this['_' + name]
    if (method) {
      method.call(this)
    }
  }

  // --- Farts ---

  _fartClassic() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.5

    const noise = this._createNoise(ctx, duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(300, now)
    filter.frequency.exponentialRampToValueAtTime(80, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + duration)
  }

  _fartSqueaky() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.25

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration)
  }

  _fartLong() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 1.5

    const noise = this._createNoise(ctx, duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(250, now)
    filter.frequency.linearRampToValueAtTime(100, now + duration * 0.7)
    filter.frequency.linearRampToValueAtTime(200, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.setValueAtTime(0.5, now + duration * 0.3)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + duration)
  }

  // --- Body sounds ---

  _burp() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.4

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.setValueAtTime(120, now + 0.05)
    osc.frequency.exponentialRampToValueAtTime(60, now + duration)

    const modulator = ctx.createOscillator()
    modulator.frequency.setValueAtTime(30, now)
    const modGain = ctx.createGain()
    modGain.gain.setValueAtTime(40, now)
    modulator.connect(modGain)
    modGain.connect(osc.frequency)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    modulator.start(now)
    osc.stop(now + duration)
    modulator.stop(now + duration)
  }

  _whoopeeCushion() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.8

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(60, now + duration)

    const noise = this._createNoise(ctx, duration)
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.setValueAtTime(400, now)
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + duration)

    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.3, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.4, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(oscGain)
    oscGain.connect(ctx.destination)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    osc.start(now)
    noise.start(now)
    osc.stop(now + duration)
    noise.stop(now + duration)
  }

  // --- Comedy sounds ---

  _airHorn() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 1.0
    const freqs = [480, 600, 720]

    freqs.forEach(freq => {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05)
      gain.gain.setValueAtTime(0.15, now + duration - 0.1)
      gain.gain.linearRampToValueAtTime(0, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + duration)
    })
  }

  _boing() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.6

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)

    // Spring oscillation via LFO
    const lfo = ctx.createOscillator()
    lfo.frequency.setValueAtTime(20, now)
    lfo.frequency.exponentialRampToValueAtTime(5, now + duration)
    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(200, now)
    lfoGain.gain.exponentialRampToValueAtTime(10, now + duration)
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    lfo.start(now)
    osc.stop(now + duration)
    lfo.stop(now + duration)
  }

  _recordScratch() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.3

    const noise = this._createNoise(ctx, duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.setValueAtTime(5, now)
    filter.frequency.setValueAtTime(3000, now)
    filter.frequency.exponentialRampToValueAtTime(200, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + duration)
  }

  _sadTrombone() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const notes = [
      { freq: 370, start: 0, dur: 0.35 },
      { freq: 349, start: 0.35, dur: 0.35 },
      { freq: 330, start: 0.70, dur: 0.35 },
      { freq: 311, start: 1.05, dur: 0.6 },
    ]

    notes.forEach(note => {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(note.freq, now + note.start)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1200, now + note.start)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + note.start)
      gain.gain.linearRampToValueAtTime(0.2, now + note.start + 0.03)
      gain.gain.setValueAtTime(0.2, now + note.start + note.dur - 0.05)
      gain.gain.linearRampToValueAtTime(0, now + note.start + note.dur)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + note.start)
      osc.stop(now + note.start + note.dur)
    })
  }

  _rimShot() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Noise burst (snare)
    const noise = this._createNoise(ctx, 0.1)
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.setValueAtTime(1000, now)
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.5, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.1)

    // Sine ping (cymbal hit)
    const ping = ctx.createOscillator()
    ping.type = 'sine'
    ping.frequency.setValueAtTime(800, now)
    const pingGain = ctx.createGain()
    pingGain.gain.setValueAtTime(0.3, now)
    pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    ping.connect(pingGain)
    pingGain.connect(ctx.destination)
    ping.start(now)
    ping.stop(now + 0.3)
  }

  _evilLaugh() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 1.2

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, now)

    // Modulation for "ha ha ha" effect
    const lfo = ctx.createOscillator()
    lfo.frequency.setValueAtTime(6, now)
    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(50, now)
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, now)

    // Echo via delay
    const delay = ctx.createDelay()
    delay.delayTime.setValueAtTime(0.15, now)
    const delayGain = ctx.createGain()
    delayGain.gain.setValueAtTime(0.3, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    gain.connect(delay)
    delay.connect(delayGain)
    delayGain.connect(ctx.destination)

    osc.start(now)
    lfo.start(now)
    osc.stop(now + duration)
    lfo.stop(now + duration)
  }

  _rubberDuck() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.15

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration)
  }

  _slideWhistleUp() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.7

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(2000, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.setValueAtTime(0.3, now + duration - 0.05)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration)
  }

  _slideWhistleDown() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.7

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(2000, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + duration)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.setValueAtTime(0.3, now + duration - 0.05)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration)
  }

  _cartoonSlip() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Quick descending tone
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2)

    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.3, now)
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.connect(oscGain)
    oscGain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.25)

    // Noise burst (thud)
    const noise = this._createNoise(ctx, 0.15)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, now + 0.15)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0, now)
    noiseGain.gain.setValueAtTime(0.5, now + 0.15)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now + 0.15)
    noise.stop(now + 0.35)
  }

  _buzzer() {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const duration = 0.5

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(150, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02)
    gain.gain.setValueAtTime(0.25, now + duration - 0.02)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration)
  }

  // --- Utility ---

  playStaticNoise(duration = 0.5) {
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    const noise = this._createNoise(ctx, duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.Q.setValueAtTime(0.5, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + duration)
  }

  _createNoise(ctx, duration) {
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    return source
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}
