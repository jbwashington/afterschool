import { BaseApp } from '../BaseApp.js'

export class Winamp extends BaseApp {
  constructor(window, windowManager) {
    super(window, windowManager)
    this.audio = null
    this.isPlaying = false
    this.currentTrackIndex = 0
    this.volume = 0.75
    this.seekUpdateInterval = null
    this.vizInterval = null

    // Sample playlist with public domain / royalty-free audio
    this.playlist = [
      {
        title: 'Winamp Demo Track - It Really Whips The Llamas Ass',
        // Using a simple tone generator URL or silent audio for demo
        url: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
        duration: 180
      },
      {
        title: 'Classic Vibes - Retro Computing Mix',
        url: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
        duration: 240
      },
      {
        title: 'Nostalgia Wave - Windows XP Era',
        url: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
        duration: 195
      }
    ]

    // DOM elements
    this.elements = {}
  }

  init() {
    super.init()

    // Add winamp-window class to the window element
    this.window.element.classList.add('winamp-window')

    this.createUI()
    this.createAudio()
    this.bindEvents()
    this.updateDisplay()
    this.startVisualizer()
  }

  createUI() {
    const container = document.createElement('div')
    container.className = 'winamp-container'
    container.innerHTML = `
      <div class="winamp-titlebar">
        <span class="winamp-title">WINAMP</span>
        <div class="winamp-title-buttons">
          <button class="winamp-title-btn winamp-minimize">_</button>
          <button class="winamp-title-btn winamp-shade">▬</button>
          <button class="winamp-title-btn winamp-close">×</button>
        </div>
      </div>

      <div class="winamp-display">
        <div class="winamp-display-left">
          <span class="winamp-time">0:00</span>
        </div>
        <div class="winamp-display-right">
          <div class="winamp-scroll-container">
            <span class="winamp-track-title paused">Loading...</span>
          </div>
          <span class="winamp-bitrate">128kbps stereo</span>
        </div>
        <div class="winamp-visualizer">
          ${Array(18).fill(0).map(() => '<div class="winamp-viz-bar" style="height: 2px;"></div>').join('')}
        </div>
      </div>

      <div class="winamp-seek">
        <div class="winamp-seek-track">
          <div class="winamp-seek-progress"></div>
          <div class="winamp-seek-thumb"></div>
        </div>
      </div>

      <div class="winamp-controls">
        <div class="winamp-transport">
          <button class="winamp-btn winamp-prev" title="Previous">⏮</button>
          <button class="winamp-btn winamp-play" title="Play">▶</button>
          <button class="winamp-btn winamp-pause" title="Pause">⏸</button>
          <button class="winamp-btn winamp-stop" title="Stop">⏹</button>
          <button class="winamp-btn winamp-next" title="Next">⏭</button>
        </div>

        <div class="winamp-volume-section">
          <span class="winamp-volume-icon">🔊</span>
          <div class="winamp-volume">
            <div class="winamp-volume-track">
              <div class="winamp-volume-fill">
                <div class="winamp-volume-thumb"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="winamp-status">
        <span class="winamp-status-left">Stopped</span>
        <span class="winamp-status-right">Track 1/3</span>
      </div>
    `

    this.window.setContent(container)

    // Store references to elements
    this.elements = {
      container,
      time: container.querySelector('.winamp-time'),
      trackTitle: container.querySelector('.winamp-track-title'),
      bitrate: container.querySelector('.winamp-bitrate'),
      seekProgress: container.querySelector('.winamp-seek-progress'),
      seekThumb: container.querySelector('.winamp-seek-thumb'),
      seekTrack: container.querySelector('.winamp-seek-track'),
      volumeFill: container.querySelector('.winamp-volume-fill'),
      volumeTrack: container.querySelector('.winamp-volume-track'),
      volumeIcon: container.querySelector('.winamp-volume-icon'),
      statusLeft: container.querySelector('.winamp-status-left'),
      statusRight: container.querySelector('.winamp-status-right'),
      playBtn: container.querySelector('.winamp-play'),
      pauseBtn: container.querySelector('.winamp-pause'),
      stopBtn: container.querySelector('.winamp-stop'),
      prevBtn: container.querySelector('.winamp-prev'),
      nextBtn: container.querySelector('.winamp-next'),
      closeBtn: container.querySelector('.winamp-close'),
      vizBars: container.querySelectorAll('.winamp-viz-bar')
    }
  }

  createAudio() {
    this.audio = new Audio()
    this.audio.volume = this.volume
    this.audio.preload = 'metadata'

    // Set up audio event listeners
    this.audio.addEventListener('timeupdate', () => this.updateSeekBar())
    this.audio.addEventListener('ended', () => this.nextTrack())
    this.audio.addEventListener('loadedmetadata', () => this.updateDisplay())
    this.audio.addEventListener('error', () => {
      console.log('Audio error - using simulated playback')
      this.simulatePlayback()
    })

    // Load first track
    this.loadTrack(this.currentTrackIndex)
  }

  bindEvents() {
    // Transport controls
    this.elements.playBtn.addEventListener('click', () => this.play())
    this.elements.pauseBtn.addEventListener('click', () => this.pause())
    this.elements.stopBtn.addEventListener('click', () => this.stop())
    this.elements.prevBtn.addEventListener('click', () => this.prevTrack())
    this.elements.nextBtn.addEventListener('click', () => this.nextTrack())

    // Close button
    this.elements.closeBtn.addEventListener('click', () => {
      this.windowManager.closeWindow(this.window.id)
    })

    // Seek bar click
    this.elements.seekTrack.addEventListener('click', (e) => this.handleSeek(e))

    // Volume control
    this.elements.volumeTrack.addEventListener('click', (e) => this.handleVolume(e))

    // Keyboard shortcuts
    this.keyHandler = (e) => {
      if (!this.window.element.classList.contains('inactive')) {
        if (e.code === 'Space') {
          e.preventDefault()
          if (this.isPlaying) {
            this.pause()
          } else {
            this.play()
          }
        }
      }
    }
    document.addEventListener('keydown', this.keyHandler)
  }

  loadTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentTrackIndex = index
      const track = this.playlist[index]
      this.audio.src = track.url
      this.updateDisplay()
      this.updateStatus()
    }
  }

  play() {
    this.isPlaying = true
    this.elements.playBtn.classList.add('playing')
    this.elements.trackTitle.classList.remove('paused')

    // Try to play audio, fall back to simulation
    this.audio.play().catch(() => {
      this.simulatePlayback()
    })

    this.updateStatus()
  }

  pause() {
    this.isPlaying = false
    this.elements.playBtn.classList.remove('playing')
    this.elements.trackTitle.classList.add('paused')
    this.audio.pause()
    this.clearSimulation()
    this.updateStatus()
  }

  stop() {
    this.isPlaying = false
    this.elements.playBtn.classList.remove('playing')
    this.elements.trackTitle.classList.add('paused')
    this.audio.pause()
    this.audio.currentTime = 0
    this.simulatedTime = 0
    this.clearSimulation()
    this.updateSeekBar()
    this.updateStatus()
  }

  prevTrack() {
    const wasPlaying = this.isPlaying
    this.stop()
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length
    this.loadTrack(this.currentTrackIndex)
    if (wasPlaying) {
      this.play()
    }
  }

  nextTrack() {
    const wasPlaying = this.isPlaying
    this.stop()
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length
    this.loadTrack(this.currentTrackIndex)
    if (wasPlaying) {
      this.play()
    }
  }

  handleSeek(e) {
    const rect = this.elements.seekTrack.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const track = this.playlist[this.currentTrackIndex]
    const duration = this.audio.duration || track.duration

    if (this.audio.duration) {
      this.audio.currentTime = percent * duration
    } else {
      this.simulatedTime = percent * duration
    }
    this.updateSeekBar()
  }

  handleVolume(e) {
    const rect = this.elements.volumeTrack.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    this.volume = percent
    this.audio.volume = percent
    this.updateVolumeDisplay()
  }

  updateDisplay() {
    const track = this.playlist[this.currentTrackIndex]
    this.elements.trackTitle.textContent = track.title
    this.elements.statusRight.textContent = `Track ${this.currentTrackIndex + 1}/${this.playlist.length}`
  }

  updateSeekBar() {
    const track = this.playlist[this.currentTrackIndex]
    const duration = this.audio.duration || track.duration
    const currentTime = this.audio.currentTime || this.simulatedTime || 0

    const percent = duration > 0 ? (currentTime / duration) * 100 : 0
    this.elements.seekProgress.style.width = `${percent}%`
    this.elements.seekThumb.style.left = `${percent}%`

    // Update time display
    const minutes = Math.floor(currentTime / 60)
    const seconds = Math.floor(currentTime % 60)
    this.elements.time.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  updateVolumeDisplay() {
    const percent = this.volume * 100
    this.elements.volumeFill.style.width = `${percent}%`

    // Update icon based on volume
    if (this.volume === 0) {
      this.elements.volumeIcon.textContent = '🔇'
    } else if (this.volume < 0.33) {
      this.elements.volumeIcon.textContent = '🔈'
    } else if (this.volume < 0.66) {
      this.elements.volumeIcon.textContent = '🔉'
    } else {
      this.elements.volumeIcon.textContent = '🔊'
    }
  }

  updateStatus() {
    if (this.isPlaying) {
      this.elements.statusLeft.textContent = 'Playing'
    } else if (this.audio.currentTime > 0 || this.simulatedTime > 0) {
      this.elements.statusLeft.textContent = 'Paused'
    } else {
      this.elements.statusLeft.textContent = 'Stopped'
    }
  }

  // Simulated playback for demo (since we don't have real audio files)
  simulatedTime = 0
  simulationInterval = null

  simulatePlayback() {
    this.clearSimulation()
    this.simulationInterval = setInterval(() => {
      if (this.isPlaying) {
        this.simulatedTime += 0.1
        const track = this.playlist[this.currentTrackIndex]
        if (this.simulatedTime >= track.duration) {
          this.nextTrack()
        } else {
          this.updateSeekBar()
        }
      }
    }, 100)
  }

  clearSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval)
      this.simulationInterval = null
    }
  }

  startVisualizer() {
    this.vizInterval = setInterval(() => {
      if (this.isPlaying) {
        this.elements.vizBars.forEach(bar => {
          const height = Math.random() * 28 + 2
          bar.style.height = `${height}px`
        })
      } else {
        this.elements.vizBars.forEach(bar => {
          bar.style.height = '2px'
        })
      }
    }, 100)
  }

  onFocus() {
    // Player doesn't need special focus handling
  }

  destroy() {
    // Stop playback and clean up
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }

    // Clear intervals
    this.clearSimulation()
    if (this.vizInterval) {
      clearInterval(this.vizInterval)
    }

    // Remove keyboard handler
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler)
    }

    super.destroy()
  }
}

// App definition for registry
export const WinampApp = {
  id: 'winamp',
  title: 'Winamp',
  icon: '🎵',
  defaultWidth: 275,
  defaultHeight: 116,
  resizable: false,
  menuItems: [], // No menu bar for Winamp
  create: (window, windowManager) => {
    const app = new Winamp(window, windowManager)
    app.init()
    return app
  }
}
