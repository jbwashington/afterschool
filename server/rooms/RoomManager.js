import { Room } from './Room.js'
import { BEATLAB_CONFIG } from '../../shared/constants.js'

export class RoomManager {
  constructor() {
    this.rooms = new Map()
    // Separate tracking for BeatLab music rooms
    this.beatLabRooms = new Map()
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

  // BeatLab-specific methods
  createBeatLabRoom(roomName) {
    const roomId = `beatlab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const room = new Room(roomId)
    room.initJamState(roomName)
    this.rooms.set(roomId, room)
    this.beatLabRooms.set(roomId, room)
    console.log(`[beatlab] Created music room: ${roomId} - "${roomName}"`)
    return room
  }

  getBeatLabRoom(roomId) {
    return this.beatLabRooms.get(roomId)
  }

  getBeatLabRoomList() {
    const rooms = []
    for (const [roomId, room] of this.beatLabRooms) {
      if (room.jamState && room.playerCount < BEATLAB_CONFIG.MAX_PLAYERS_PER_ROOM) {
        rooms.push({
          id: roomId,
          name: room.jamState.roomName,
          tempo: room.jamState.tempo,
          isPlaying: room.jamState.isPlaying,
          playerCount: room.playerCount
        })
      }
    }
    return rooms
  }

  cleanupBeatLabRoom(roomId) {
    const room = this.beatLabRooms.get(roomId)
    if (room && room.playerCount === 0) {
      console.log(`[beatlab] Removing empty music room: ${roomId}`)
      this.beatLabRooms.delete(roomId)
      this.rooms.delete(roomId)
    }
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
