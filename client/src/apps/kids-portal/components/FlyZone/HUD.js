export class HUD {
  constructor(container) {
    this.container = container
    this.elements = {}
    this.hintsVisible = false
    this.hintsTimer = null
    this.flashTimer = null
  }

  create() {
    const overlay = document.createElement('div')
    overlay.className = 'flyzone-hud'
    overlay.innerHTML = `
      <div class="flyzone-hud-top">
        <button class="flyzone-hud-btn flyzone-help-btn">?</button>
        <span class="flyzone-hud-cam">3RD</span>
      </div>
      <div class="flyzone-hud-bottom">
        <div class="flyzone-hud-stat">
          <span class="flyzone-hud-label">ALT</span>
          <span class="flyzone-hud-value flyzone-alt">0.0m</span>
        </div>
        <div class="flyzone-hud-stat">
          <span class="flyzone-hud-label">SPD</span>
          <span class="flyzone-hud-value flyzone-spd">0.0</span>
        </div>
        <div class="flyzone-hud-stat flyzone-battery-stat">
          <span class="flyzone-hud-label">BAT</span>
          <div class="flyzone-battery-bar">
            <div class="flyzone-battery-fill"></div>
          </div>
          <span class="flyzone-hud-value flyzone-bat">100%</span>
        </div>
        <div class="flyzone-hud-stat">
          <span class="flyzone-hud-label">HDG</span>
          <div class="flyzone-compass">
            <div class="flyzone-compass-arrow">N</div>
          </div>
        </div>
        <div class="flyzone-hud-stat">
          <span class="flyzone-hud-label">RINGS</span>
          <span class="flyzone-hud-value flyzone-rings">0/6</span>
        </div>
        <div class="flyzone-hud-stat">
          <span class="flyzone-hud-label">SCORE</span>
          <span class="flyzone-hud-value flyzone-score">0</span>
        </div>
      </div>
      <div class="flyzone-flash"></div>
      <div class="flyzone-hints">
        <div class="flyzone-hints-content">
          <div class="flyzone-hints-title">CONTROLS</div>
          <div class="flyzone-hints-grid">
            <div><kbd>W</kbd><kbd>S</kbd> Forward / Back</div>
            <div><kbd>A</kbd><kbd>D</kbd> Strafe Left / Right</div>
            <div><kbd>SPACE</kbd> Go Up</div>
            <div><kbd>SHIFT</kbd> Go Down</div>
            <div><kbd>Q</kbd><kbd>E</kbd> Turn Left / Right</div>
            <div><kbd>R</kbd> Reset Drone</div>
            <div><kbd>C</kbd> Toggle Camera</div>
          </div>
          <div class="flyzone-hints-tip">Fly through the golden rings!</div>
        </div>
      </div>
      <div class="flyzone-focus-overlay">
        <div class="flyzone-focus-text">Click to fly!</div>
      </div>
    `

    this.container.appendChild(overlay)

    this.elements = {
      overlay,
      alt: overlay.querySelector('.flyzone-alt'),
      spd: overlay.querySelector('.flyzone-spd'),
      bat: overlay.querySelector('.flyzone-bat'),
      batteryFill: overlay.querySelector('.flyzone-battery-fill'),
      batteryStat: overlay.querySelector('.flyzone-battery-stat'),
      compass: overlay.querySelector('.flyzone-compass-arrow'),
      rings: overlay.querySelector('.flyzone-rings'),
      score: overlay.querySelector('.flyzone-score'),
      flash: overlay.querySelector('.flyzone-flash'),
      hints: overlay.querySelector('.flyzone-hints'),
      helpBtn: overlay.querySelector('.flyzone-help-btn'),
      camLabel: overlay.querySelector('.flyzone-hud-cam'),
      focusOverlay: overlay.querySelector('.flyzone-focus-overlay'),
    }

    // Show hints initially for 5 seconds
    this.showHints()
    this.hintsTimer = setTimeout(() => this.hideHints(), 5000)

    // Help button
    this.elements.helpBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.hintsVisible) {
        this.hideHints()
      } else {
        this.showHints()
      }
    })
  }

  update(physics, ringSystem) {
    this.elements.alt.textContent = `${physics.getAltitude().toFixed(1)}m`
    this.elements.spd.textContent = `${physics.getSpeed().toFixed(1)}`

    // Battery
    const bat = Math.round(physics.battery)
    this.elements.bat.textContent = `${bat}%`
    this.elements.batteryFill.style.width = `${bat}%`

    if (bat > 50) {
      this.elements.batteryFill.style.backgroundColor = '#00cc44'
    } else if (bat > 15) {
      this.elements.batteryFill.style.backgroundColor = '#cccc00'
    } else {
      this.elements.batteryFill.style.backgroundColor = '#cc2200'
      this.elements.batteryStat.classList.toggle('flyzone-battery-low', bat < 15)
    }

    // Compass
    const heading = physics.getHeading()
    this.elements.compass.style.transform = `rotate(${-heading}deg)`

    // Rings
    if (ringSystem) {
      this.elements.rings.textContent = `${ringSystem.getPassedCount()}/${ringSystem.totalRings}`
      this.elements.score.textContent = String(ringSystem.score)
    }
  }

  setFocused(focused) {
    this.elements.focusOverlay.style.display = focused ? 'none' : 'flex'
  }

  setCameraMode(mode) {
    this.elements.camLabel.textContent = mode === 'fpv' ? 'FPV' : '3RD'
  }

  showFlash(text) {
    this.elements.flash.textContent = text
    this.elements.flash.classList.remove('flyzone-flash-anim')
    // Force reflow
    void this.elements.flash.offsetWidth
    this.elements.flash.classList.add('flyzone-flash-anim')

    if (this.flashTimer) clearTimeout(this.flashTimer)
    this.flashTimer = setTimeout(() => {
      this.elements.flash.classList.remove('flyzone-flash-anim')
    }, 1500)
  }

  showHints() {
    this.hintsVisible = true
    this.elements.hints.style.display = 'flex'
  }

  hideHints() {
    this.hintsVisible = false
    this.elements.hints.style.display = 'none'
    if (this.hintsTimer) {
      clearTimeout(this.hintsTimer)
      this.hintsTimer = null
    }
  }

  destroy() {
    if (this.hintsTimer) clearTimeout(this.hintsTimer)
    if (this.flashTimer) clearTimeout(this.flashTimer)
    if (this.elements.overlay && this.elements.overlay.parentNode) {
      this.elements.overlay.parentNode.removeChild(this.elements.overlay)
    }
  }
}
