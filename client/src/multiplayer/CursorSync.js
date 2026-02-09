import { MESSAGE_TYPES, OS } from '../../../shared/constants.js'

export class CursorSync {
  constructor(networkClient, playerId) {
    this.networkClient = networkClient
    this.playerId = playerId
    this.lastX = 0
    this.lastY = 0
    this.isMouseDown = false
    this.throttleMs = 1000 / OS.CURSOR_UPDATE_HZ // 20Hz = 50ms
    this.lastSendTime = 0
    this.boundMouseMove = this.handleMouseMove.bind(this)
    this.boundMouseDown = this.handleMouseDown.bind(this)
    this.boundMouseUp = this.handleMouseUp.bind(this)
  }

  start() {
    document.addEventListener('mousemove', this.boundMouseMove)
    document.addEventListener('mousedown', this.boundMouseDown)
    document.addEventListener('mouseup', this.boundMouseUp)
  }

  stop() {
    document.removeEventListener('mousemove', this.boundMouseMove)
    document.removeEventListener('mousedown', this.boundMouseDown)
    document.removeEventListener('mouseup', this.boundMouseUp)
  }

  handleMouseMove(e) {
    const now = Date.now()
    if (now - this.lastSendTime < this.throttleMs) {
      return
    }

    // Convert to percentage for cross-resolution sync
    const x = (e.clientX / window.innerWidth) * 100
    const y = (e.clientY / window.innerHeight) * 100

    // Only send if moved significantly
    const dx = Math.abs(x - this.lastX)
    const dy = Math.abs(y - this.lastY)
    if (dx < 0.5 && dy < 0.5) {
      return
    }

    this.lastX = x
    this.lastY = y
    this.lastSendTime = now

    this.networkClient.send({
      type: MESSAGE_TYPES.CURSOR_MOVE,
      playerId: this.playerId,
      x,
      y,
    })
  }

  handleMouseDown(e) {
    this.isMouseDown = true
    this.networkClient.send({
      type: MESSAGE_TYPES.CURSOR_DOWN,
      playerId: this.playerId,
      button: e.button,
    })
  }

  handleMouseUp(e) {
    this.isMouseDown = false
    this.networkClient.send({
      type: MESSAGE_TYPES.CURSOR_UP,
      playerId: this.playerId,
      button: e.button,
    })
  }
}
