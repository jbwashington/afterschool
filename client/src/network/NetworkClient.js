import { MESSAGE_TYPES } from '../../../shared/constants.js'

export class NetworkClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5

    // Connection callbacks
    this.onConnected = null
    this.onPlayerJoined = null
    this.onPlayerLeft = null
    this.onError = null
    this.onDisconnected = null

    // Cursor callbacks
    this.onCursorMove = null
    this.onCursorDown = null
    this.onCursorUp = null

    // Window callbacks
    this.onWindowOpen = null
    this.onWindowClose = null
    this.onWindowMove = null
    this.onWindowResize = null
    this.onWindowFocus = null

    // File system callbacks
    this.onFileCreate = null
    this.onFileUpdate = null
    this.onFileDelete = null
  }

  connect() {
    console.log('[network] Connecting to:', this.url)

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('[network] Connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (err) {
        console.error('[network] Parse error:', err)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[network] Error:', error)
    }

    this.ws.onclose = () => {
      console.log('[network] Disconnected')
      if (this.onDisconnected) {
        this.onDisconnected()
      }
      this.attemptReconnect()
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[network] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)

    console.log(`[network] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  handleMessage(message) {
    // console.log('[network] Received:', message.type)

    switch (message.type) {
      // Connection messages
      case MESSAGE_TYPES.ROOM_JOINED:
        if (this.onConnected) this.onConnected(message)
        break

      case MESSAGE_TYPES.PLAYER_JOINED:
        if (this.onPlayerJoined) this.onPlayerJoined(message)
        break

      case MESSAGE_TYPES.PLAYER_LEFT:
        if (this.onPlayerLeft) this.onPlayerLeft(message)
        break

      // Cursor messages
      case MESSAGE_TYPES.CURSOR_MOVE:
        if (this.onCursorMove) this.onCursorMove(message)
        break

      case MESSAGE_TYPES.CURSOR_DOWN:
        if (this.onCursorDown) this.onCursorDown(message)
        break

      case MESSAGE_TYPES.CURSOR_UP:
        if (this.onCursorUp) this.onCursorUp(message)
        break

      // Window messages
      case MESSAGE_TYPES.WINDOW_OPEN:
        if (this.onWindowOpen) this.onWindowOpen(message)
        break

      case MESSAGE_TYPES.WINDOW_CLOSE:
        if (this.onWindowClose) this.onWindowClose(message)
        break

      case MESSAGE_TYPES.WINDOW_MOVE:
        if (this.onWindowMove) this.onWindowMove(message)
        break

      case MESSAGE_TYPES.WINDOW_RESIZE:
        if (this.onWindowResize) this.onWindowResize(message)
        break

      case MESSAGE_TYPES.WINDOW_FOCUS:
        if (this.onWindowFocus) this.onWindowFocus(message)
        break

      // File system messages
      case MESSAGE_TYPES.FILE_CREATE:
        if (this.onFileCreate) this.onFileCreate(message)
        break

      case MESSAGE_TYPES.FILE_UPDATE:
        if (this.onFileUpdate) this.onFileUpdate(message)
        break

      case MESSAGE_TYPES.FILE_DELETE:
        if (this.onFileDelete) this.onFileDelete(message)
        break

      case MESSAGE_TYPES.ERROR:
        if (this.onError) this.onError(message)
        break

      default:
        console.log('[network] Unknown message type:', message.type)
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('[network] Cannot send - not connected')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
