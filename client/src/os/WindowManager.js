import { Window } from './Window.js'
import { WINDOW_STATE } from '../../../shared/constants.js'

export class WindowManager {
  constructor(desktop, taskbar, appRegistry) {
    this.desktop = desktop
    this.taskbar = taskbar
    this.appRegistry = appRegistry
    this.windows = new Map()
    this.focusedWindowId = null
    this.baseZIndex = 100
    this.zIndexCounter = 100
    this.windowIdCounter = 0
    this.windowOffset = { x: 30, y: 30 }
    this.lastWindowPosition = { x: 50, y: 50 }

    // Callbacks for multiplayer sync
    this.onWindowOpen = null
    this.onWindowClose = null
    this.onWindowMove = null
    this.onWindowResize = null
    this.onWindowFocus = null
  }

  generateWindowId() {
    return `win_${Date.now()}_${++this.windowIdCounter}`
  }

  getNextPosition() {
    const x = this.lastWindowPosition.x
    const y = this.lastWindowPosition.y

    this.lastWindowPosition.x += this.windowOffset.x
    this.lastWindowPosition.y += this.windowOffset.y

    // Reset if too far
    if (this.lastWindowPosition.x > window.innerWidth - 300) {
      this.lastWindowPosition.x = 50
    }
    if (this.lastWindowPosition.y > window.innerHeight - 200) {
      this.lastWindowPosition.y = 50
    }

    return { x, y }
  }

  openApp(appId, options = {}) {
    const appDef = this.appRegistry?.get(appId)
    if (!appDef) {
      console.warn(`App not found: ${appId}`)
      return null
    }

    const windowId = options.windowId || this.generateWindowId()
    const position = this.getNextPosition()

    const windowOptions = {
      id: windowId,
      title: appDef.title,
      icon: appDef.icon,
      width: appDef.defaultWidth || 400,
      height: appDef.defaultHeight || 300,
      minWidth: appDef.minWidth || 200,
      minHeight: appDef.minHeight || 100,
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      menuItems: appDef.menuItems || [],
      zIndex: ++this.zIndexCounter,
      onClose: (id) => this.closeWindow(id),
      onFocus: (id) => this.focusWindow(id),
      onMinimize: (id) => this.handleMinimize(id),
      onMaximize: (id) => this.handleMaximize(id),
      onMove: (id, x, y) => this.handleMove(id, x, y),
      onResize: (id, w, h) => this.handleResize(id, w, h),
    }

    const win = new Window(windowOptions)
    win.init()

    // Mount to desktop
    this.desktop.getElement().appendChild(win.getElement())
    this.windows.set(windowId, win)

    // Initialize app content
    if (appDef.create) {
      const appInstance = appDef.create(win, this)
      win.appInstance = appInstance
    }

    // Add taskbar button
    this.taskbar.addTaskButton(windowId, appDef.title, appDef.icon)

    // Focus the new window
    this.focusWindow(windowId)

    // Notify for multiplayer sync
    if (this.onWindowOpen) {
      this.onWindowOpen(windowId, appId, windowOptions.x, windowOptions.y)
    }

    return win
  }

  createWindow(options) {
    const windowId = options.id || this.generateWindowId()
    const position = this.getNextPosition()

    const windowOptions = {
      ...options,
      id: windowId,
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      zIndex: ++this.zIndexCounter,
      onClose: (id) => this.closeWindow(id),
      onFocus: (id) => this.focusWindow(id),
      onMinimize: (id) => this.handleMinimize(id),
      onMaximize: (id) => this.handleMaximize(id),
      onMove: (id, x, y) => this.handleMove(id, x, y),
      onResize: (id, w, h) => this.handleResize(id, w, h),
    }

    const win = new Window(windowOptions)
    win.init()

    this.desktop.getElement().appendChild(win.getElement())
    this.windows.set(windowId, win)
    this.taskbar.addTaskButton(windowId, options.title, options.icon)
    this.focusWindow(windowId)

    return win
  }

  closeWindow(windowId) {
    const win = this.windows.get(windowId)
    if (!win) return

    // Call app cleanup if exists
    if (win.appInstance?.destroy) {
      win.appInstance.destroy()
    }

    win.destroy()
    this.windows.delete(windowId)
    this.taskbar.removeTaskButton(windowId)

    // Focus another window
    if (this.focusedWindowId === windowId) {
      this.focusedWindowId = null
      const remainingWindows = Array.from(this.windows.values())
      if (remainingWindows.length > 0) {
        // Focus the one with highest z-index
        const topWindow = remainingWindows.reduce((a, b) =>
          a.zIndex > b.zIndex ? a : b
        )
        this.focusWindow(topWindow.id)
      }
    }

    if (this.onWindowClose) {
      this.onWindowClose(windowId)
    }
  }

  focusWindow(windowId) {
    const win = this.windows.get(windowId)
    if (!win) return

    // If minimized, restore it
    if (win.state === WINDOW_STATE.MINIMIZED) {
      win.restore()
    }

    // Blur previous
    if (this.focusedWindowId && this.focusedWindowId !== windowId) {
      const prevWin = this.windows.get(this.focusedWindowId)
      if (prevWin) {
        prevWin.blur()
      }
    }

    // Bring to front
    win.setZIndex(++this.zIndexCounter)
    win.focus()
    this.focusedWindowId = windowId

    // Update taskbar
    this.taskbar.setActiveTask(windowId)

    if (this.onWindowFocus) {
      this.onWindowFocus(windowId)
    }
  }

  handleMinimize(windowId) {
    if (this.focusedWindowId === windowId) {
      // Focus another window
      const remainingVisible = Array.from(this.windows.values())
        .filter(w => w.id !== windowId && w.state !== WINDOW_STATE.MINIMIZED)

      if (remainingVisible.length > 0) {
        const topWindow = remainingVisible.reduce((a, b) =>
          a.zIndex > b.zIndex ? a : b
        )
        this.focusWindow(topWindow.id)
      } else {
        this.focusedWindowId = null
        this.taskbar.setActiveTask(null)
      }
    }
  }

  handleMaximize(windowId) {
    // Just for notification purposes
  }

  handleMove(windowId, x, y) {
    if (this.onWindowMove) {
      this.onWindowMove(windowId, x, y)
    }
  }

  handleResize(windowId, width, height) {
    if (this.onWindowResize) {
      this.onWindowResize(windowId, width, height)
    }
  }

  getWindow(windowId) {
    return this.windows.get(windowId)
  }

  getAllWindows() {
    return Array.from(this.windows.values())
  }
}
