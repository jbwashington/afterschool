import { OS, MESSAGE_TYPES, BEATLAB_CONFIG } from '../../shared/constants.js'

export class Room {
  constructor(roomId) {
    this.id = roomId
    this.players = new Map()

    // BeatLab jam state (null if not a music room)
    this.jamState = null
  }

  // Initialize this room as a BeatLab music room
  initJamState(roomName) {
    this.jamState = {
      roomName: roomName || 'Untitled Room',
      pattern: this.createEmptyPattern(),
      tempo: BEATLAB_CONFIG.DEFAULT_TEMPO,
      isPlaying: false,
      createdAt: Date.now()
    }
    return this.jamState
  }

  createEmptyPattern() {
    return Array(BEATLAB_CONFIG.TRACKS).fill(null).map(() =>
      Array(BEATLAB_CONFIG.STEPS).fill(false)
    )
  }

  isJamRoom() {
    return this.jamState !== null
  }

  get playerCount() {
    return this.players.size
  }

  addPlayer(ws) {
    if (this.players.size >= OS.MAX_PLAYERS) {
      return null
    }

    const playerNumber = this.players.size + 1
    const player = {
      id: `player_${playerNumber}_${Date.now()}`,
      number: playerNumber,
      ws,
    }

    this.players.set(player.id, player)
    return player
  }

  removePlayer(playerId) {
    this.players.delete(playerId)
  }

  getPlayer(playerId) {
    return this.players.get(playerId)
  }

  broadcast(message, excludeWs = null) {
    const data = JSON.stringify(message)
    for (const player of this.players.values()) {
      if (player.ws !== excludeWs && player.ws.readyState === 1) {
        player.ws.send(data)
      }
    }
  }

  sendTo(playerId, message) {
    const player = this.players.get(playerId)
    if (player && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify(message))
    }
  }
}
