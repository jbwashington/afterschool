import { Room } from './Room.js'

export class RoomManager {
  constructor() {
    this.rooms = new Map()
  }

  getRoom(roomId) {
    return this.rooms.get(roomId)
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      console.log(`[room] Creating room: ${roomId}`)
      this.rooms.set(roomId, new Room(roomId))
    }
    return this.rooms.get(roomId)
  }

  addPlayer(roomId, ws) {
    const room = this.getOrCreateRoom(roomId)
    return room.addPlayer(ws)
  }

  removePlayer(roomId, playerId) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.removePlayer(playerId)

    // Clean up empty rooms
    if (room.playerCount === 0) {
      console.log(`[room] Removing empty room: ${roomId}`)
      this.rooms.delete(roomId)
    }
  }

  broadcast(roomId, message, excludeWs = null) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.broadcast(message, excludeWs)
  }
}
