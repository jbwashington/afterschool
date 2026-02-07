export class NetworkClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5

    // Callbacks
    this.onConnected = null
    this.onPlayerJoined = null
    this.onPlayerLeft = null
    this.onTurnStart = null
    this.onTurnEnd = null
    this.onCardSelected = null
    this.onWorldUpdate = null
    this.onEntitySpawn = null
    this.onSkyChange = null
    this.onGroundChange = null
    this.onClearAll = null
    this.onError = null
    this.onDisconnected = null
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
    console.log('[network] Received:', message.type)

    switch (message.type) {
      case 'room_joined':
        if (this.onConnected) this.onConnected(message)
        break

      case 'player_joined':
        if (this.onPlayerJoined) this.onPlayerJoined(message)
        break

      case 'player_left':
        if (this.onPlayerLeft) this.onPlayerLeft(message)
        break

      case 'turn_start':
        if (this.onTurnStart) this.onTurnStart(message)
        break

      case 'turn_end':
        if (this.onTurnEnd) this.onTurnEnd(message)
        break

      case 'card_selected':
        if (this.onCardSelected) this.onCardSelected(message)
        break

      case 'world_update':
        if (this.onWorldUpdate) this.onWorldUpdate(message)
        break

      case 'game_state':
        // Handle reconnection state sync
        if (this.onConnected) {
          this.onConnected({ gameState: message.state })
        }
        break

      case 'entity_spawn':
        if (this.onEntitySpawn) this.onEntitySpawn(message)
        break

      case 'sky_change':
        if (this.onSkyChange) this.onSkyChange(message)
        break

      case 'ground_change':
        if (this.onGroundChange) this.onGroundChange(message)
        break

      case 'clear_all':
        if (this.onClearAll) this.onClearAll()
        break

      case 'error':
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
