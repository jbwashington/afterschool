export class DroneControls {
  constructor(container, physics) {
    this.container = container
    this.physics = physics
    this.keys = {}
    this.focused = false
    this.cameraMode = 'third' // 'third' or 'fpv'
    this.onCameraToggle = null
    this.onReset = null

    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onBlur = this._onBlur.bind(this)
    this._onFocus = this._onFocus.bind(this)
  }

  init() {
    this.container.setAttribute('tabindex', '0')
    this.container.style.outline = 'none'

    this.container.addEventListener('keydown', this._onKeyDown)
    this.container.addEventListener('keyup', this._onKeyUp)
    this.container.addEventListener('blur', this._onBlur)
    this.container.addEventListener('focus', this._onFocus)
  }

  _onKeyDown(e) {
    const key = e.key.toLowerCase()
    const gameKeys = ['w', 'a', 's', 'd', 'q', 'e', 'r', 'c', ' ', 'shift',
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright']

    if (gameKeys.includes(key)) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (key === 'c' && !this.keys[key]) {
      this.cameraMode = this.cameraMode === 'third' ? 'fpv' : 'third'
      if (this.onCameraToggle) this.onCameraToggle(this.cameraMode)
    }

    if (key === 'r' && !this.keys[key]) {
      if (this.onReset) this.onReset()
    }

    this.keys[key] = true
  }

  _onKeyUp(e) {
    const key = e.key.toLowerCase()
    this.keys[key] = false
  }

  _onBlur() {
    this.focused = false
    this.keys = {}
  }

  _onFocus() {
    this.focused = true
  }

  focus() {
    this.container.focus()
  }

  update() {
    if (!this.focused) {
      this.physics.input.forward = 0
      this.physics.input.strafe = 0
      this.physics.input.thrust = 0
      this.physics.input.turn = 0
      return
    }

    // Forward/backward
    let forward = 0
    if (this.keys['w'] || this.keys['arrowup']) forward += 1
    if (this.keys['s'] || this.keys['arrowdown']) forward -= 1
    this.physics.input.forward = forward

    // Strafe
    let strafe = 0
    if (this.keys['d'] || this.keys['arrowright']) strafe += 1
    if (this.keys['a'] || this.keys['arrowleft']) strafe -= 1
    this.physics.input.strafe = strafe

    // Thrust (up/down)
    let thrust = 0
    if (this.keys[' ']) thrust += 1
    if (this.keys['shift']) thrust -= 1
    this.physics.input.thrust = thrust

    // Turn
    let turn = 0
    if (this.keys['q']) turn += 1
    if (this.keys['e']) turn -= 1
    this.physics.input.turn = turn
  }

  destroy() {
    this.container.removeEventListener('keydown', this._onKeyDown)
    this.container.removeEventListener('keyup', this._onKeyUp)
    this.container.removeEventListener('blur', this._onBlur)
    this.container.removeEventListener('focus', this._onFocus)
  }
}
