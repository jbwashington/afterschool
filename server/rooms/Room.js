import { OS, MESSAGE_TYPES } from '../../shared/constants.js'

export class Room {
  constructor(roomId) {
    this.id = roomId
    this.players = new Map()
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
