export class AudioProcessor {
  constructor() {
    this.audioContext = null
    this.analyser = null
    this.microphone = null
    this.dataArray = null
    this.isListening = false

    // Callbacks
    this.onSignal = null

    // Throttle signal emissions
    this.lastSignalTime = 0
    this.signalInterval = 100 // ms
  }

  async startListening() {
    if (this.isListening) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8

      this.microphone = this.audioContext.createMediaStreamSource(stream)
      this.microphone.connect(this.analyser)

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
      this.isListening = true

      console.log('[audio] Listening started')
      this.processAudio()
    } catch (err) {
      console.error('[audio] Failed to start:', err)
      // Don't block game if mic fails - just log it
    }
  }

  stopListening() {
    if (!this.isListening) return

    this.isListening = false

    if (this.microphone) {
      this.microphone.disconnect()
    }
    if (this.audioContext) {
      this.audioContext.close()
    }

    console.log('[audio] Listening stopped')
  }

  processAudio() {
    if (!this.isListening) return

    this.analyser.getByteFrequencyData(this.dataArray)

    // Calculate audio features
    const signal = this.calculateSignal()

    // Emit signal if significant and throttled
    const now = Date.now()
    if (now - this.lastSignalTime >= this.signalInterval) {
      if (signal.peak > 0.1 || signal.volume > 0.05) {
        this.lastSignalTime = now
        if (this.onSignal) {
          this.onSignal(signal)
        }
      }
    }

    requestAnimationFrame(() => this.processAudio())
  }

  calculateSignal() {
    const bufferLength = this.dataArray.length

    // Volume (RMS)
    let sum = 0
    let max = 0
    for (let i = 0; i < bufferLength; i++) {
      const value = this.dataArray[i] / 255
      sum += value * value
      if (value > max) max = value
    }
    const volume = Math.sqrt(sum / bufferLength)

    // Peak detection (sudden loud sounds like claps)
    const peak = max

    // Simple rhythm detection (frequency of peaks)
    // This is simplified - a real implementation would track over time
    const rhythm = this.detectRhythm(peak)

    return {
      volume: Math.round(volume * 100) / 100,
      peak: Math.round(peak * 100) / 100,
      rhythm: Math.round(rhythm * 100) / 100,
    }
  }

  detectRhythm(currentPeak) {
    // Simplified rhythm detection
    // Returns a value indicating rhythmic activity
    if (!this.peakHistory) {
      this.peakHistory = []
    }

    this.peakHistory.push(currentPeak)
    if (this.peakHistory.length > 20) {
      this.peakHistory.shift()
    }

    // Count significant peaks
    const threshold = 0.5
    const peakCount = this.peakHistory.filter(p => p > threshold).length
    return peakCount / this.peakHistory.length
  }
}
