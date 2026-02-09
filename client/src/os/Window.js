import { WINDOW_STATE } from '../../../shared/constants.js'

export class Window {
  constructor(options) {
    this.id = options.id
    this.title = options.title || 'Untitled'
    this.icon = options.icon || '\uD83D\uDCBB'
    this.width = options.width || 400
    this.height = options.height || 300
    this.x = options.x ?? 100
    this.y = options.y ?? 100
    this.minWidth = options.minWidth || 200
    this.minHeight = options.minHeight || 100
    this.state = WINDOW_STATE.NORMAL
    this.zIndex = options.zIndex || 100
    this.menuItems = options.menuItems || []

    this.element = null
    this.contentElement = null
    this.isDragging = false
    this.isResizing = false
    this.dragOffset = { x: 0, y: 0 }
    this.resizeStart = { x: 0, y: 0, width: 0, height: 0 }
    this.savedPosition = null

    // Callbacks
    this.onClose = options.onClose || null
    this.onFocus = options.onFocus || null
    this.onMinimize = options.onMinimize || null
    this.onMaximize = options.onMaximize || null
    this.onMove = options.onMove || null
    this.onResize = options.onResize || null
  }

  init() {
    this.createElement()
    this.bindEvents()
    return this
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.className = 'xp-window'
    this.element.id = `window-${this.id}`
    this.element.style.cssText = `
      left: ${this.x}px;
      top: ${this.y}px;
      width: ${this.width}px;
      height: ${this.height}px;
      z-index: ${this.zIndex};
    `

    // Build menu bar if items provided
    const menuBarHtml = this.menuItems.length > 0 ? `
      <div class="xp-menubar">
        ${this.menuItems.map(item => `
          <span class="xp-menu-item" data-menu="${item.id}">${item.label}</span>
        `).join('')}
      </div>
    ` : ''

    this.element.innerHTML = `
      <div class="xp-titlebar">
        <span class="xp-titlebar-icon">${this.icon}</span>
        <span class="xp-titlebar-text">${this.title}</span>
        <div class="xp-titlebar-buttons">
          <button class="xp-btn-minimize"></button>
          <button class="xp-btn-maximize"></button>
          <button class="xp-btn-close"></button>
        </div>
      </div>
      ${menuBarHtml}
      <div class="xp-window-content"></div>
      <div class="xp-resize-handle se"></div>
      <div class="xp-resize-handle e"></div>
      <div class="xp-resize-handle s"></div>
    `

    this.contentElement = this.element.querySelector('.xp-window-content')
  }

  bindEvents() {
    const titlebar = this.element.querySelector('.xp-titlebar')
    const btnClose = this.element.querySelector('.xp-btn-close')
    const btnMinimize = this.element.querySelector('.xp-btn-minimize')
    const btnMaximize = this.element.querySelector('.xp-btn-maximize')
    const resizeHandleSE = this.element.querySelector('.xp-resize-handle.se')
    const resizeHandleE = this.element.querySelector('.xp-resize-handle.e')
    const resizeHandleS = this.element.querySelector('.xp-resize-handle.s')

    // Focus on click
    this.element.addEventListener('mousedown', () => {
      if (this.onFocus) this.onFocus(this.id)
    })

    // Drag by titlebar
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.xp-titlebar-buttons')) return
      if (this.state === WINDOW_STATE.MAXIMIZED) return
      this.startDrag(e)
    })

    // Window buttons
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation()
      this.close()
    })

    btnMinimize.addEventListener('click', (e) => {
      e.stopPropagation()
      this.minimize()
    })

    btnMaximize.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleMaximize()
    })

    // Double-click titlebar to maximize
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.xp-titlebar-buttons')) return
      this.toggleMaximize()
    })

    // Resize handles
    resizeHandleSE.addEventListener('mousedown', (e) => this.startResize(e, 'se'))
    resizeHandleE.addEventListener('mousedown', (e) => this.startResize(e, 'e'))
    resizeHandleS.addEventListener('mousedown', (e) => this.startResize(e, 's'))

    // Global mouse events for drag/resize
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    document.addEventListener('mouseup', () => this.handleMouseUp())
  }

  startDrag(e) {
    this.isDragging = true
    this.dragOffset = {
      x: e.clientX - this.x,
      y: e.clientY - this.y
    }
    this.element.style.cursor = 'move'
  }

  startResize(e, direction) {
    e.stopPropagation()
    this.isResizing = direction
    this.resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: this.width,
      height: this.height
    }
  }

  handleMouseMove(e) {
    if (this.isDragging) {
      this.x = e.clientX - this.dragOffset.x
      this.y = e.clientY - this.dragOffset.y

      // Keep within bounds
      this.x = Math.max(0, Math.min(this.x, window.innerWidth - 100))
      this.y = Math.max(0, Math.min(this.y, window.innerHeight - 60))

      this.element.style.left = `${this.x}px`
      this.element.style.top = `${this.y}px`
    }

    if (this.isResizing) {
      const dx = e.clientX - this.resizeStart.x
      const dy = e.clientY - this.resizeStart.y

      if (this.isResizing === 'se' || this.isResizing === 'e') {
        this.width = Math.max(this.minWidth, this.resizeStart.width + dx)
        this.element.style.width = `${this.width}px`
      }

      if (this.isResizing === 'se' || this.isResizing === 's') {
        this.height = Math.max(this.minHeight, this.resizeStart.height + dy)
        this.element.style.height = `${this.height}px`
      }
    }
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false
      this.element.style.cursor = ''
      if (this.onMove) this.onMove(this.id, this.x, this.y)
    }

    if (this.isResizing) {
      this.isResizing = false
      if (this.onResize) this.onResize(this.id, this.width, this.height)
    }
  }

  close() {
    if (this.onClose) this.onClose(this.id)
  }

  minimize() {
    this.state = WINDOW_STATE.MINIMIZED
    this.element.style.display = 'none'
    if (this.onMinimize) this.onMinimize(this.id)
  }

  restore() {
    this.state = WINDOW_STATE.NORMAL
    this.element.style.display = 'flex'

    if (this.savedPosition) {
      this.x = this.savedPosition.x
      this.y = this.savedPosition.y
      this.width = this.savedPosition.width
      this.height = this.savedPosition.height
      this.element.style.left = `${this.x}px`
      this.element.style.top = `${this.y}px`
      this.element.style.width = `${this.width}px`
      this.element.style.height = `${this.height}px`
      this.savedPosition = null
    }
  }

  maximize() {
    this.savedPosition = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }

    this.state = WINDOW_STATE.MAXIMIZED
    this.element.style.left = '0'
    this.element.style.top = '0'
    this.element.style.width = '100vw'
    this.element.style.height = 'calc(100vh - 30px)'
    this.element.style.borderRadius = '0'

    if (this.onMaximize) this.onMaximize(this.id)
  }

  toggleMaximize() {
    if (this.state === WINDOW_STATE.MAXIMIZED) {
      this.restore()
    } else {
      this.maximize()
    }
  }

  focus() {
    this.element.classList.remove('inactive')
  }

  blur() {
    this.element.classList.add('inactive')
  }

  setZIndex(z) {
    this.zIndex = z
    this.element.style.zIndex = z
  }

  setTitle(title) {
    this.title = title
    const titleElement = this.element.querySelector('.xp-titlebar-text')
    if (titleElement) {
      titleElement.textContent = title
    }
  }

  setContent(content) {
    if (typeof content === 'string') {
      this.contentElement.innerHTML = content
    } else if (content instanceof HTMLElement) {
      this.contentElement.innerHTML = ''
      this.contentElement.appendChild(content)
    }
  }

  getContentElement() {
    return this.contentElement
  }

  getElement() {
    return this.element
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
}
