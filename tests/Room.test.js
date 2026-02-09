import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Room } from '../server/rooms/Room.js'
import { OS } from '../shared/constants.js'

// Mock WebSocket
const createMockWs = () => ({
  send: vi.fn(),
  readyState: 1, // OPEN
})

describe('Room', () => {
  let room

  beforeEach(() => {
    room = new Room('test-room')
  })

  describe('player management', () => {
    it('should add first player', () => {
      const ws = createMockWs()
      const player = room.addPlayer(ws)

      expect(player).not.toBeNull()
      expect(player.number).toBe(1)
      expect(room.playerCount).toBe(1)
    })

    it('should add multiple players up to max', () => {
      const sockets = []
      for (let i = 0; i < OS.MAX_PLAYERS; i++) {
        const ws = createMockWs()
        sockets.push(ws)
        const player = room.addPlayer(ws)
        expect(player).not.toBeNull()
        expect(player.number).toBe(i + 1)
      }
      expect(room.playerCount).toBe(OS.MAX_PLAYERS)
    })

    it('should reject player when room is full', () => {
      // Fill the room
      for (let i = 0; i < OS.MAX_PLAYERS; i++) {
        room.addPlayer(createMockWs())
      }

      // Try to add one more
      const extraPlayer = room.addPlayer(createMockWs())
      expect(extraPlayer).toBeNull()
      expect(room.playerCount).toBe(OS.MAX_PLAYERS)
    })

    it('should remove player correctly', () => {
      const ws = createMockWs()
      const player = room.addPlayer(ws)

      room.removePlayer(player.id)
      expect(room.playerCount).toBe(0)
    })

    it('should get player by id', () => {
      const ws = createMockWs()
      const player = room.addPlayer(ws)

      const found = room.getPlayer(player.id)
      expect(found).toBe(player)
    })

    it('should return undefined for non-existent player', () => {
      const found = room.getPlayer('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('broadcasting', () => {
    it('should send message to all players', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      room.addPlayer(ws1)
      room.addPlayer(ws2)

      room.broadcast({ type: 'test' })

      expect(ws1.send).toHaveBeenCalled()
      expect(ws2.send).toHaveBeenCalled()
    })

    it('should exclude specified websocket', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      room.addPlayer(ws1)
      room.addPlayer(ws2)

      room.broadcast({ type: 'test' }, ws1)

      expect(ws1.send).not.toHaveBeenCalled()
      expect(ws2.send).toHaveBeenCalled()
    })

    it('should serialize message as JSON', () => {
      const ws = createMockWs()
      room.addPlayer(ws)

      const message = { type: 'test', data: 123 }
      room.broadcast(message)

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should skip closed websockets', () => {
      const wsOpen = createMockWs()
      const wsClosed = { send: vi.fn(), readyState: 3 } // CLOSED

      room.addPlayer(wsOpen)
      room.addPlayer(wsClosed)

      room.broadcast({ type: 'test' })

      expect(wsOpen.send).toHaveBeenCalled()
      expect(wsClosed.send).not.toHaveBeenCalled()
    })
  })

  describe('sendTo', () => {
    it('should send message to specific player', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      const player1 = room.addPlayer(ws1)
      room.addPlayer(ws2)

      const message = { type: 'private', data: 'hello' }
      room.sendTo(player1.id, message)

      expect(ws1.send).toHaveBeenCalledWith(JSON.stringify(message))
      expect(ws2.send).not.toHaveBeenCalled()
    })

    it('should not crash for non-existent player', () => {
      expect(() => {
        room.sendTo('non-existent', { type: 'test' })
      }).not.toThrow()
    })
  })
})
