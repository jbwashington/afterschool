/**
 * Sequencer - 16-step x 8-instrument grid for BeatLab
 */
export class Sequencer {
  constructor(audioEngine, options = {}) {
    this.audioEngine = audioEngine
    this.onPatternChange = options.onPatternChange || (() => {})
    this.onTempoChange = options.onTempoChange || (() => {})
    this.onPlayStateChange = options.onPlayStateChange || (() => {})
    this.onLeave = options.onLeave || (() => {})

    // Sequencer state
    this.steps = 16
    this.tracks = 8
    this.pattern = this.createEmptyPattern()
    this.tempo = 120
    this.isPlaying = false
    this.currentStep = 0

    // Scheduling
    this.scheduleInterval = null
    this.lookahead = 25 // ms
    this.scheduleAheadTime = 0.1 // seconds

    // DOM
    this.element = null
    this.gridCells = []
    this.playheadIndicators = []

    // Instrument names from AudioEngine
    this.instrumentNames = audioEngine.instruments.map(i => i.name)
    this.instrumentColors = audioEngine.instruments.map(i => i.color)

    // Multiplayer
    this.roomName = options.roomName || 'Local Session'
    this.players = options.players || []
    this.isMultiplayer = options.isMultiplayer || false
  }

  createEmptyPattern() {
    return Array(this.tracks).fill(null).map(() => Array(this.steps).fill(false))
  }

  render() {
    this.element = document.createElement('div')
    this.element.className = 'beatlab-sequencer'

    this.element.innerHTML = `
      <div class="beatlab-header">
        <div class="beatlab-title">
          <span class="beatlab-logo">🎹</span>
          <span class="beatlab-name">${this.isMultiplayer ? this.roomName : 'BeatLab'}</span>
        </div>
        <div class="beatlab-controls">
          <div class="beatlab-tempo">
            <label>BPM</label>
            <input type="range" class="beatlab-tempo-slider" min="60" max="200" value="${this.tempo}">
            <span class="beatlab-tempo-value">${this.tempo}</span>
          </div>
          <div class="beatlab-transport">
            <button class="beatlab-btn beatlab-play" title="Play">▶</button>
            <button class="beatlab-btn beatlab-stop" title="Stop">⏹</button>
          </div>
          ${this.isMultiplayer ? '<button class="beatlab-btn beatlab-leave" title="Leave Room">🚪</button>' : ''}
        </div>
      </div>
      <div class="beatlab-grid-container">
        <div class="beatlab-labels"></div>
        <div class="beatlab-grid"></div>
      </div>
      ${this.isMultiplayer ? '<div class="beatlab-players"></div>' : ''}
    `

    this.buildGrid()
    this.bindEvents()
    this.updatePlayersDisplay()

    return this.element
  }

  buildGrid() {
    const labelsContainer = this.element.querySelector('.beatlab-labels')
    const gridContainer = this.element.querySelector('.beatlab-grid')

    // Build instrument labels
    for (let track = 0; track < this.tracks; track++) {
      const label = document.createElement('div')
      label.className = 'beatlab-label'
      label.style.setProperty('--track-color', this.instrumentColors[track])
      label.innerHTML = `
        <span class="beatlab-label-dot" style="background: ${this.instrumentColors[track]}"></span>
        <span class="beatlab-label-text">${this.instrumentNames[track]}</span>
      `
      labelsContainer.appendChild(label)
    }

    // Build step grid
    this.gridCells = []
    for (let track = 0; track < this.tracks; track++) {
      const row = document.createElement('div')
      row.className = 'beatlab-row'
      this.gridCells[track] = []

      for (let step = 0; step < this.steps; step++) {
        const cell = document.createElement('div')
        cell.className = 'beatlab-cell'
        cell.dataset.track = track
        cell.dataset.step = step
        cell.style.setProperty('--track-color', this.instrumentColors[track])

        // Beat markers (every 4 steps)
        if (step % 4 === 0) {
          cell.classList.add('beatlab-cell-beat')
        }

        row.appendChild(cell)
        this.gridCells[track][step] = cell
      }

      gridContainer.appendChild(row)
    }

    // Build playhead indicators
    const playheadRow = document.createElement('div')
    playheadRow.className = 'beatlab-playhead-row'
    this.playheadIndicators = []

    for (let step = 0; step < this.steps; step++) {
      const indicator = document.createElement('div')
      indicator.className = 'beatlab-playhead-indicator'
      if (step % 4 === 0) {
        indicator.classList.add('beatlab-playhead-beat')
      }
      playheadRow.appendChild(indicator)
      this.playheadIndicators[step] = indicator
    }
    gridContainer.insertBefore(playheadRow, gridContainer.firstChild)

    // Apply current pattern
    this.refreshGrid()
  }

  bindEvents() {
    // Grid cell clicks
    const grid = this.element.querySelector('.beatlab-grid')
    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.beatlab-cell')
      if (cell) {
        const track = parseInt(cell.dataset.track)
        const step = parseInt(cell.dataset.step)
        this.toggleCell(track, step)
      }
    })

    // Transport controls
    this.element.querySelector('.beatlab-play').addEventListener('click', () => this.play())
    this.element.querySelector('.beatlab-stop').addEventListener('click', () => this.stop())

    // Tempo slider
    const tempoSlider = this.element.querySelector('.beatlab-tempo-slider')
    const tempoValue = this.element.querySelector('.beatlab-tempo-value')
    tempoSlider.addEventListener('input', (e) => {
      this.setTempo(parseInt(e.target.value))
      tempoValue.textContent = this.tempo
    })

    // Leave button (multiplayer only)
    const leaveBtn = this.element.querySelector('.beatlab-leave')
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => this.onLeave())
    }
  }

  toggleCell(track, step, broadcast = true) {
    this.pattern[track][step] = !this.pattern[track][step]
    this.updateCell(track, step)

    // Play sound preview when toggling on
    if (this.pattern[track][step]) {
      this.audioEngine.playSound(track)
    }

    if (broadcast) {
      this.onPatternChange(track, step, this.pattern[track][step])
    }
  }

  setCell(track, step, value) {
    this.pattern[track][step] = value
    this.updateCell(track, step)
  }

  updateCell(track, step) {
    const cell = this.gridCells[track]?.[step]
    if (cell) {
      cell.classList.toggle('active', this.pattern[track][step])
    }
  }

  refreshGrid() {
    for (let track = 0; track < this.tracks; track++) {
      for (let step = 0; step < this.steps; step++) {
        this.updateCell(track, step)
      }
    }
  }

  setTempo(value, broadcast = true) {
    this.tempo = Math.max(60, Math.min(200, value))
    const slider = this.element?.querySelector('.beatlab-tempo-slider')
    const display = this.element?.querySelector('.beatlab-tempo-value')
    if (slider) slider.value = this.tempo
    if (display) display.textContent = this.tempo

    if (broadcast) {
      this.onTempoChange(this.tempo)
    }
  }

  play(broadcast = true) {
    if (this.isPlaying) return

    this.audioEngine.init()
    this.audioEngine.resume()
    this.isPlaying = true
    this.currentStep = 0
    this.nextStepTime = this.audioEngine.getCurrentTime()

    this.element?.querySelector('.beatlab-play')?.classList.add('active')

    // Start scheduler
    this.scheduleInterval = setInterval(() => this.scheduler(), this.lookahead)

    if (broadcast) {
      this.onPlayStateChange(true)
    }
  }

  stop(broadcast = true) {
    this.isPlaying = false
    this.currentStep = 0

    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval)
      this.scheduleInterval = null
    }

    // Clear playhead
    this.playheadIndicators.forEach(ind => ind.classList.remove('active'))
    this.element?.querySelector('.beatlab-play')?.classList.remove('active')

    if (broadcast) {
      this.onPlayStateChange(false)
    }
  }

  scheduler() {
    const currentTime = this.audioEngine.getCurrentTime()

    while (this.nextStepTime < currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime)
      this.advanceStep()
    }
  }

  scheduleStep(step, time) {
    // Play all active sounds for this step
    for (let track = 0; track < this.tracks; track++) {
      if (this.pattern[track][step]) {
        this.audioEngine.playSound(track, time)
      }
    }

    // Visual update (with setTimeout for precise timing)
    const visualTime = (time - this.audioEngine.getCurrentTime()) * 1000
    setTimeout(() => this.updatePlayhead(step), Math.max(0, visualTime))
  }

  advanceStep() {
    const secondsPerBeat = 60.0 / this.tempo
    const secondsPerStep = secondsPerBeat / 4 // 16th notes

    this.nextStepTime += secondsPerStep
    this.currentStep = (this.currentStep + 1) % this.steps
  }

  updatePlayhead(step) {
    this.playheadIndicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === step)
    })
  }

  // Multiplayer methods
  setPattern(pattern) {
    this.pattern = pattern
    this.refreshGrid()
  }

  getPattern() {
    return this.pattern
  }

  setPlayers(players) {
    this.players = players
    this.updatePlayersDisplay()
  }

  updatePlayersDisplay() {
    const container = this.element?.querySelector('.beatlab-players')
    if (!container || !this.isMultiplayer) return

    container.innerHTML = this.players.map((player, i) => `
      <div class="beatlab-player" style="--player-color: ${this.getPlayerColor(i)}">
        <span class="beatlab-player-avatar">👤</span>
        <span class="beatlab-player-name">${player.name || `Player ${i + 1}`}</span>
      </div>
    `).join('')
  }

  getPlayerColor(index) {
    const colors = ['#00ff88', '#ff6b6b', '#4ecdc4', '#ffe66d']
    return colors[index % colors.length]
  }

  setRoomName(name) {
    this.roomName = name
    const titleEl = this.element?.querySelector('.beatlab-name')
    if (titleEl) titleEl.textContent = name
  }

  destroy() {
    this.stop(false)
  }
}
