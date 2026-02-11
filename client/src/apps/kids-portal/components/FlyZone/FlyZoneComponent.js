import './fly-zone.css'

export class FlyZoneComponent {
  constructor(container, onBack) {
    this.container = container
    this.onBack = onBack
    this.droneScene = null
    this.elements = {}
  }

  async init() {
    this.createLoadingScreen()

    try {
      // Dynamic import for code splitting
      const THREE = await import('three')
      const { DroneScene } = await import('./DroneScene.js')

      // Build the actual UI
      this.createUI()

      // Create and init scene
      this.droneScene = new DroneScene(
        this.elements.canvasWrapper,
        this.elements.hudLayer,
        THREE
      )
      await this.droneScene.init()

      // Remove loading screen
      if (this.elements.loading) {
        this.elements.loading.remove()
      }
    } catch (err) {
      console.error('FlyZone init error:', err)
      this.showError(err.message)
    }
  }

  createLoadingScreen() {
    this.container.innerHTML = `
      <div class="flyzone-loading">
        <div class="flyzone-loading-spinner">🚁</div>
        <div class="flyzone-loading-text">Loading Fly Zone...</div>
      </div>
    `
    this.elements.loading = this.container.querySelector('.flyzone-loading')
  }

  createUI() {
    this.container.innerHTML = `
      <div class="flyzone-container">
        <div class="flyzone-back-bar">
          <button class="flyzone-back-btn">← Back</button>
          <span class="flyzone-title">FLY ZONE</span>
        </div>
        <div class="flyzone-viewport">
          <div class="flyzone-canvas-wrapper" tabindex="0"></div>
          <div class="flyzone-hud-layer"></div>
        </div>
      </div>
    `

    this.elements = {
      container: this.container.querySelector('.flyzone-container'),
      canvasWrapper: this.container.querySelector('.flyzone-canvas-wrapper'),
      hudLayer: this.container.querySelector('.flyzone-hud-layer'),
      backBtn: this.container.querySelector('.flyzone-back-btn'),
    }

    this.elements.backBtn.addEventListener('click', () => {
      if (this.onBack) this.onBack()
    })
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="flyzone-loading">
        <div class="flyzone-loading-text" style="color: #ff4444;">
          Failed to load Fly Zone: ${message}
        </div>
        <button class="flyzone-back-btn" style="margin-top: 16px;">← Back</button>
      </div>
    `
    this.container.querySelector('.flyzone-back-btn')?.addEventListener('click', () => {
      if (this.onBack) this.onBack()
    })
  }

  destroy() {
    if (this.droneScene) {
      this.droneScene.dispose()
      this.droneScene = null
    }
    this.container.innerHTML = ''
  }
}
