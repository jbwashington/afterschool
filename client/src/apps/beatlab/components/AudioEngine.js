/**
 * AudioEngine - Web Audio API sound synthesis for BeatLab
 * Generates 8 drum sounds programmatically (no samples needed)
 */
export class AudioEngine {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.isInitialized = false

    // 8 instrument definitions
    this.instruments = [
      { id: 0, name: 'Kick', color: '#ff6b6b' },
      { id: 1, name: 'Snare', color: '#4ecdc4' },
      { id: 2, name: 'Hi-Hat', color: '#ffe66d' },
      { id: 3, name: 'Open Hat', color: '#f7fff7' },
      { id: 4, name: 'Clap', color: '#ff9f43' },
      { id: 5, name: 'Tom', color: '#a55eea' },
      { id: 6, name: 'Rimshot', color: '#26de81' },
      { id: 7, name: 'Cowbell', color: '#fd79a8' }
    ]
  }

  init() {
    if (this.isInitialized) return

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = 0.7
    this.masterGain.connect(this.audioContext.destination)
    this.isInitialized = true
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  /**
   * Play a drum sound at the specified time
   * @param {number} instrumentId - 0-7 for the 8 instruments
   * @param {number} time - AudioContext time to play at (0 = now)
   */
  playSound(instrumentId, time = 0) {
    if (!this.isInitialized) this.init()
    this.resume()

    const playTime = time || this.audioContext.currentTime

    switch (instrumentId) {
      case 0: this.playKick(playTime); break
      case 1: this.playSnare(playTime); break
      case 2: this.playHiHat(playTime); break
      case 3: this.playOpenHat(playTime); break
      case 4: this.playClap(playTime); break
      case 5: this.playTom(playTime); break
      case 6: this.playRimshot(playTime); break
      case 7: this.playCowbell(playTime); break
    }
  }

  // Kick drum - sine wave with pitch envelope
  playKick(time) {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1)

    gain.gain.setValueAtTime(1, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + 0.3)
  }

  // Snare - noise burst with body
  playSnare(time) {
    // Noise component
    const noiseBuffer = this.createNoiseBuffer(0.2)
    const noise = this.audioContext.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000

    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.setValueAtTime(0.8, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.masterGain)

    // Body component
    const osc = this.audioContext.createOscillator()
    const oscGain = this.audioContext.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, time)
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1)

    oscGain.gain.setValueAtTime(0.5, time)
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)

    osc.connect(oscGain)
    oscGain.connect(this.masterGain)

    noise.start(time)
    osc.start(time)
    osc.stop(time + 0.2)
  }

  // Closed hi-hat - filtered noise, short
  playHiHat(time) {
    const noiseBuffer = this.createNoiseBuffer(0.05)
    const noise = this.audioContext.createBufferSource()
    noise.buffer = noiseBuffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start(time)
  }

  // Open hi-hat - filtered noise, longer
  playOpenHat(time) {
    const noiseBuffer = this.createNoiseBuffer(0.3)
    const noise = this.audioContext.createBufferSource()
    noise.buffer = noiseBuffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 6000

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.35, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start(time)
  }

  // Clap - layered noise bursts
  playClap(time) {
    for (let i = 0; i < 3; i++) {
      const noiseBuffer = this.createNoiseBuffer(0.02)
      const noise = this.audioContext.createBufferSource()
      noise.buffer = noiseBuffer

      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 2500
      filter.Q.value = 1

      const gain = this.audioContext.createGain()
      const startTime = time + i * 0.01
      gain.gain.setValueAtTime(0.6, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)

      noise.start(startTime)
    }
  }

  // Tom - pitched drum
  playTom(time) {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, time)
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.15)

    gain.gain.setValueAtTime(0.8, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + 0.25)
  }

  // Rimshot - short click
  playRimshot(time) {
    const osc1 = this.audioContext.createOscillator()
    const osc2 = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(1800, time)

    osc2.type = 'square'
    osc2.frequency.setValueAtTime(400, time)

    gain.gain.setValueAtTime(0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.03)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(this.masterGain)

    osc1.start(time)
    osc2.start(time)
    osc1.stop(time + 0.03)
    osc2.stop(time + 0.03)
  }

  // Cowbell - two detuned square waves
  playCowbell(time) {
    const osc1 = this.audioContext.createOscillator()
    const osc2 = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc1.type = 'square'
    osc1.frequency.setValueAtTime(800, time)

    osc2.type = 'square'
    osc2.frequency.setValueAtTime(540, time)

    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 3

    gain.gain.setValueAtTime(0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc1.start(time)
    osc2.start(time)
    osc1.stop(time + 0.15)
    osc2.stop(time + 0.15)
  }

  // Helper: create white noise buffer
  createNoiseBuffer(duration) {
    const sampleRate = this.audioContext.sampleRate
    const bufferSize = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    return buffer
  }

  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
      this.masterGain = null
      this.isInitialized = false
    }
  }
}
