export class CameraControls {
  constructor(game) {
    this.game = game
    this.container = null
    this.build()
  }

  build() {
    this.container = document.createElement('div')
    this.container.id = 'camera-controls'
    this.container.className = 'fixed right-4 bottom-4 flex flex-col gap-2 pointer-events-auto'

    const buttons = [
      { id: 'fit-all', icon: '⬜', label: 'Fit All', action: () => this.game.fitAll() },
      { id: 'reset-view', icon: '🏠', label: 'Reset', action: () => this.game.resetView() },
      { id: 'zoom-in', icon: '➕', label: 'Zoom In', action: () => this.game.zoomIn() },
      { id: 'zoom-out', icon: '➖', label: 'Zoom Out', action: () => this.game.zoomOut() },
    ]

    for (const btn of buttons) {
      const button = document.createElement('button')
      button.id = btn.id
      button.className = 'bg-black/70 hover:bg-black/90 rounded-lg p-3 text-xl transition-all hover:scale-110 active:scale-95'
      button.title = btn.label
      button.innerHTML = btn.icon
      button.addEventListener('click', btn.action)
      this.container.appendChild(button)
    }

    // Add help text
    const helpText = document.createElement('div')
    helpText.className = 'text-xs text-gray-400 text-center mt-2 bg-black/50 rounded px-2 py-1'
    helpText.innerHTML = 'Drag to rotate<br>Scroll to zoom'
    this.container.appendChild(helpText)
  }

  mount(parent) {
    parent.appendChild(this.container)
  }

  unmount() {
    this.container?.remove()
  }

  show() {
    this.container.classList.remove('hidden')
  }

  hide() {
    this.container.classList.add('hidden')
  }
}
