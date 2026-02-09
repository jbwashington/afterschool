import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Room } from '../server/rooms/Room.js'
import { RoomManager } from '../server/rooms/RoomManager.js'
import { MESSAGE_TYPES, OS } from '../shared/constants.js'

// Mock WebSocket
const createMockWs = () => ({
  send: vi.fn(),
  readyState: 1,
})

describe('E2E: Complete OS Session', () => {
  let roomManager
  let ws1, ws2
  let player1, player2

  beforeEach(() => {
    roomManager = new RoomManager()
    ws1 = createMockWs()
    ws2 = createMockWs()
  })

  it('should complete full join → cursor sync → window open cycle', () => {
    // === JOIN PHASE ===
    player1 = roomManager.addPlayer('e2e-test', ws1)
    expect(player1).not.toBeNull()
    expect(player1.number).toBe(1)

    player2 = roomManager.addPlayer('e2e-test', ws2)
    expect(player2).not.toBeNull()
    expect(player2.number).toBe(2)

    const room = roomManager.getRoom('e2e-test')
    expect(room.playerCount).toBe(2)

    // === CURSOR SYNC ===
    // Simulate cursor move from player 1
    room.broadcast({
      type: MESSAGE_TYPES.CURSOR_MOVE,
      playerId: player1.id,
      x: 50,
      y: 50,
    }, ws1)

    // Player 2 should receive cursor update
    expect(ws2.send).toHaveBeenCalledWith(
      expect.stringContaining('cursor_move')
    )

    // === WINDOW OPEN ===
    ws1.send.mockClear()
    ws2.send.mockClear()

    // Player 1 opens a window
    room.broadcast({
      type: MESSAGE_TYPES.WINDOW_OPEN,
      playerId: player1.id,
      windowId: 'win_1',
      appId: 'notepad',
      x: 100,
      y: 100,
    }, ws1)

    // Player 2 should see the window open
    expect(ws2.send).toHaveBeenCalledWith(
      expect.stringContaining('window_open')
    )
  })

  it('should handle player disconnect gracefully', () => {
    player1 = roomManager.addPlayer('disconnect-test', ws1)
    player2 = roomManager.addPlayer('disconnect-test', ws2)

    // Clear initial join messages
    ws2.send.mockClear()

    // Player 1 disconnects
    roomManager.removePlayer('disconnect-test', player1.id)

    // Room should still exist with one player
    const room = roomManager.getRoom('disconnect-test')
    expect(room).toBeDefined()
    expect(room.playerCount).toBe(1)

    // Room should be cleaned up when last player leaves
    roomManager.removePlayer('disconnect-test', player2.id)
    expect(roomManager.getRoom('disconnect-test')).toBeUndefined()
  })

  it('should support max players per room', () => {
    const sockets = []
    const players = []

    // Fill room to capacity
    for (let i = 0; i < OS.MAX_PLAYERS; i++) {
      const ws = createMockWs()
      sockets.push(ws)
      const player = roomManager.addPlayer('max-test', ws)
      expect(player).not.toBeNull()
      players.push(player)
    }

    // Try to add one more - should fail
    const extraWs = createMockWs()
    const extraPlayer = roomManager.addPlayer('max-test', extraWs)
    expect(extraPlayer).toBeNull()
  })
})

describe('E2E: Message Types Validation', () => {
  let room
  let ws1, ws2

  beforeEach(() => {
    room = new Room('msg-test')
    ws1 = createMockWs()
    ws2 = createMockWs()
    room.addPlayer(ws1)
    room.addPlayer(ws2)
  })

  it('should handle all cursor message types', () => {
    const cursorTypes = [
      MESSAGE_TYPES.CURSOR_MOVE,
      MESSAGE_TYPES.CURSOR_DOWN,
      MESSAGE_TYPES.CURSOR_UP,
    ]

    for (const type of cursorTypes) {
      ws2.send.mockClear()
      room.broadcast({ type }, ws1)
      expect(ws2.send).toHaveBeenCalled()
    }
  })

  it('should handle all window message types', () => {
    const windowTypes = [
      MESSAGE_TYPES.WINDOW_OPEN,
      MESSAGE_TYPES.WINDOW_CLOSE,
      MESSAGE_TYPES.WINDOW_MOVE,
      MESSAGE_TYPES.WINDOW_RESIZE,
      MESSAGE_TYPES.WINDOW_FOCUS,
      MESSAGE_TYPES.WINDOW_MINIMIZE,
      MESSAGE_TYPES.WINDOW_MAXIMIZE,
    ]

    for (const type of windowTypes) {
      ws2.send.mockClear()
      room.broadcast({ type, windowId: 'test' }, ws1)
      expect(ws2.send).toHaveBeenCalled()
    }
  })

  it('should handle all file system message types', () => {
    const fileTypes = [
      MESSAGE_TYPES.FILE_CREATE,
      MESSAGE_TYPES.FILE_UPDATE,
      MESSAGE_TYPES.FILE_DELETE,
      MESSAGE_TYPES.FILE_MOVE,
    ]

    for (const type of fileTypes) {
      ws2.send.mockClear()
      room.broadcast({ type, path: 'C:/test.txt' }, ws1)
      expect(ws2.send).toHaveBeenCalled()
    }
  })
})

describe('E2E: Multi-Room Isolation', () => {
  let roomManager

  beforeEach(() => {
    roomManager = new RoomManager()
  })

  it('should isolate messages between rooms', () => {
    const ws1 = createMockWs()
    const ws2 = createMockWs()
    const ws3 = createMockWs()

    roomManager.addPlayer('room-a', ws1)
    roomManager.addPlayer('room-a', ws2)
    roomManager.addPlayer('room-b', ws3)

    // Clear initial join messages
    ws1.send.mockClear()
    ws2.send.mockClear()
    ws3.send.mockClear()

    // Broadcast to room-a
    roomManager.broadcast('room-a', { type: 'test-message' }, ws1)

    // ws2 should receive (same room)
    expect(ws2.send).toHaveBeenCalled()

    // ws3 should NOT receive (different room)
    expect(ws3.send).not.toHaveBeenCalled()
  })

  it('should manage multiple rooms independently', () => {
    const ws1 = createMockWs()
    const ws2 = createMockWs()

    const player1 = roomManager.addPlayer('room-x', ws1)
    const player2 = roomManager.addPlayer('room-y', ws2)

    expect(roomManager.getRoom('room-x').playerCount).toBe(1)
    expect(roomManager.getRoom('room-y').playerCount).toBe(1)

    // Removing player from one room shouldn't affect other
    roomManager.removePlayer('room-x', player1.id)

    expect(roomManager.getRoom('room-x')).toBeUndefined()
    expect(roomManager.getRoom('room-y')).toBeDefined()
    expect(roomManager.getRoom('room-y').playerCount).toBe(1)
  })
})
