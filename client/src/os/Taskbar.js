export class Taskbar {
  constructor(windowManager, onStartClick) {
    this.windowManager = windowManager
    this.onStartClick = onStartClick
    this.element = null
    this.taskButtonsContainer = null
    this.clockElement = null
    this.systemTray = null
    this.taskButtons = new Map()
    this.clockInterval = null
    this.onClippyClick = null
  }

  init() {
    this.createElement()
    this.startClock()
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.className = 'xp-taskbar'

    // Start button
    const startButton = document.createElement('button')
    startButton.className = 'xp-start-button'
    startButton.innerHTML = `
      <span class="xp-start-logo">\uD83C\uDF1F</span>
      <span>start</span>
    `
    startButton.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.onStartClick) {
        this.onStartClick()
      }
    })

    // Task buttons area
    this.taskButtonsContainer = document.createElement('div')
    this.taskButtonsContainer.className = 'xp-task-buttons'

    // System tray
    this.systemTray = document.createElement('div')
    this.systemTray.className = 'xp-system-tray'

    // Clippy icon in system tray
    const clippyIcon = document.createElement('div')
    clippyIcon.className = 'clippy-taskbar-icon'
    clippyIcon.innerHTML = `
      <span class="icon">📎</span>
      <span class="tooltip">Clippy - OS Helper</span>
    `
    clippyIcon.addEventListener('click', () => {
      if (this.onClippyClick) {
        this.onClippyClick()
      }
    })
    this.systemTray.appendChild(clippyIcon)

    this.clockElement = document.createElement('span')
    this.clockElement.className = 'xp-clock'
    this.systemTray.appendChild(this.clockElement)

    this.element.appendChild(startButton)
    this.element.appendChild(this.taskButtonsContainer)
    this.element.appendChild(this.systemTray)

    document.body.appendChild(this.element)
  }

  startClock() {
    this.updateClock()
    this.clockInterval = setInterval(() => this.updateClock(), 1000)
  }

  updateClock() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    this.clockElement.textContent = `${displayHours}:${minutes} ${ampm}`
  }

  addTaskButton(windowId, title, icon) {
    const button = document.createElement('button')
    button.className = 'xp-task-button'
    button.dataset.windowId = windowId
    button.innerHTML = `
      <span class="xp-task-button-icon">${icon || '\uD83D\uDCBB'}</span>
      <span>${title}</span>
    `

    button.addEventListener('click', () => {
      if (this.windowManager) {
        this.windowManager.focusWindow(windowId)
      }
    })

    this.taskButtonsContainer.appendChild(button)
    this.taskButtons.set(windowId, button)
  }

  removeTaskButton(windowId) {
    const button = this.taskButtons.get(windowId)
    if (button) {
      button.remove()
      this.taskButtons.delete(windowId)
    }
  }

  setActiveTask(windowId) {
    // Remove active from all
    this.taskButtons.forEach(button => {
      button.classList.remove('active')
    })

    // Set active on current
    const button = this.taskButtons.get(windowId)
    if (button) {
      button.classList.add('active')
    }
  }

  updateTaskButton(windowId, title) {
    const button = this.taskButtons.get(windowId)
    if (button) {
      const textSpan = button.querySelector('span:last-child')
      if (textSpan) {
        textSpan.textContent = title
      }
    }
  }

  destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval)
    }
    if (this.element) {
      this.element.remove()
    }
  }
}
