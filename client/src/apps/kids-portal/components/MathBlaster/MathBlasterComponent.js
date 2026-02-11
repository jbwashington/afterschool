// Math Blaster zone shell — follows FlyZoneComponent pattern
import './math-blaster.css'

export class MathBlasterComponent {
  constructor(container, onBack) {
    this.container = container
    this.onBack = onBack
    this.game = null
    this.elements = {}
  }

  async init() {
    this.createLoadingScreen()

    try {
      const { MathBlasterGame } = await import('./MathBlasterGame.js')

      this.createUI()

      this.game = new MathBlasterGame(
        this.elements.canvasWrapper,
        this.elements.hudLayer
      )
      this.game.init()

      if (this.elements.loading) {
        this.elements.loading.remove()
      }
    } catch (err) {
      console.error('MathBlaster init error:', err)
      this.showError(err.message)
    }
  }

  createLoadingScreen() {
    this.container.innerHTML = `
      <div class="mathblaster-loading">
        <div class="mathblaster-loading-spinner">\uD83D\uDE80</div>
        <div class="mathblaster-loading-text">Loading Math Blaster...</div>
      </div>
    `
    this.elements.loading = this.container.querySelector('.mathblaster-loading')
  }

  createUI() {
    this.container.innerHTML = `
      <div class="mathblaster-container">
        <div class="mathblaster-back-bar">
          <button class="mathblaster-back-btn">\u2190 Back</button>
          <span class="mathblaster-title">MATH BLASTER</span>
        </div>
        <div class="mathblaster-viewport">
          <div class="mathblaster-canvas-wrapper" tabindex="0"></div>
          <div class="mathblaster-hud-layer"></div>
        </div>
      </div>
    `

    this.elements = {
      container: this.container.querySelector('.mathblaster-container'),
      canvasWrapper: this.container.querySelector('.mathblaster-canvas-wrapper'),
      hudLayer: this.container.querySelector('.mathblaster-hud-layer'),
      backBtn: this.container.querySelector('.mathblaster-back-btn'),
    }

    this.elements.backBtn.addEventListener('click', () => {
      if (this.onBack) this.onBack()
    })
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="mathblaster-loading">
        <div class="mathblaster-loading-text" style="color: #ff4444;">
          Failed to load Math Blaster: ${message}
        </div>
        <button class="mathblaster-back-btn" style="margin-top: 16px;">\u2190 Back</button>
      </div>
    `
    this.container.querySelector('.mathblaster-back-btn')?.addEventListener('click', () => {
      if (this.onBack) this.onBack()
    })
  }

  destroy() {
    if (this.game) {
      this.game.dispose()
      this.game = null
    }
    this.container.innerHTML = ''
  }
}
