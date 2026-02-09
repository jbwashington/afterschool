export class BaseApp {
  constructor(window, windowManager) {
    this.window = window
    this.windowManager = windowManager
    this.isInitialized = false
  }

  init() {
    this.isInitialized = true
  }

  onFocus() {
    // Override in subclass
  }

  onBlur() {
    // Override in subclass
  }

  onResize(width, height) {
    // Override in subclass
  }

  destroy() {
    this.isInitialized = false
  }
}
