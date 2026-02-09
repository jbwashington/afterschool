import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Room } from '../server/rooms/Room.js'
import { RoomManager } from '../server/rooms/RoomManager.js'
import { MESSAGE_TYPES } from '../shared/constants.js'

// Mock WebSocket
const createMockWs = () => ({
  send: vi.fn(),
  readyState: 1,
})

describe('Integration: Multi-Player Room', () => {
  let roomManager
  let ws1, ws2

  beforeEach(() => {
    roomManager = new RoomManager()
    ws1 = createMockWs()
    ws2 = createMockWs()
  })

  it('should sync both players to same room on join', () => {
    const player1 = roomManager.addPlayer('sync-test', ws1)
    const player2 = roomManager.addPlayer('sync-test', ws2)

    const room = roomManager.getRoom('sync-test')

    expect(room.playerCount).toBe(2)
    expect(player1.number).toBe(1)
    expect(player2.number).toBe(2)
  })

  it('should broadcast to all players except sender', () => {
    roomManager.addPlayer('broadcast-test', ws1)
    roomManager.addPlayer('broadcast-test', ws2)

    const room = roomManager.getRoom('broadcast-test')
    room.broadcast({ type: 'test' }, ws1)

    expect(ws1.send).not.toHaveBeenCalled()
    expect(ws2.send).toHaveBeenCalled()
  })

  it('should relay cursor movements to other players', () => {
    roomManager.addPlayer('cursor-test', ws1)
    roomManager.addPlayer('cursor-test', ws2)

    const room = roomManager.getRoom('cursor-test')

    // Simulate cursor move from player 1
    room.broadcast({
      type: MESSAGE_TYPES.CURSOR_MOVE,
      x: 50,
      y: 50,
    }, ws1)

    // Player 2 should receive it
    expect(ws2.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: MESSAGE_TYPES.CURSOR_MOVE,
        x: 50,
        y: 50,
      })
    )
  })
})

describe('Integration: Room Cleanup', () => {
  let roomManager
  let ws1

  beforeEach(() => {
    roomManager = new RoomManager()
    ws1 = createMockWs()
  })

  it('should clean up empty rooms', () => {
    const player1 = roomManager.addPlayer('cleanup-test', ws1)

    expect(roomManager.getRoom('cleanup-test')).toBeDefined()

    roomManager.removePlayer('cleanup-test', player1.id)

    expect(roomManager.getRoom('cleanup-test')).toBeUndefined()
  })

  it('should keep room when one player remains', () => {
    const ws2 = createMockWs()
    const player1 = roomManager.addPlayer('partial-cleanup', ws1)
    roomManager.addPlayer('partial-cleanup', ws2)

    roomManager.removePlayer('partial-cleanup', player1.id)

    expect(roomManager.getRoom('partial-cleanup')).toBeDefined()
    expect(roomManager.getRoom('partial-cleanup').playerCount).toBe(1)
  })
})

describe('Integration: Message Relay', () => {
  let room
  let ws1, ws2

  beforeEach(() => {
    room = new Room('relay-test')
    ws1 = createMockWs()
    ws2 = createMockWs()
    room.addPlayer(ws1)
    room.addPlayer(ws2)
  })

  it('should relay window open events', () => {
    room.broadcast({
      type: MESSAGE_TYPES.WINDOW_OPEN,
      windowId: 'win_123',
      appId: 'notepad',
      x: 100,
      y: 100,
    }, ws1)

    expect(ws2.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: MESSAGE_TYPES.WINDOW_OPEN,
        windowId: 'win_123',
        appId: 'notepad',
        x: 100,
        y: 100,
      })
    )
  })

  it('should relay window close events', () => {
    room.broadcast({
      type: MESSAGE_TYPES.WINDOW_CLOSE,
      windowId: 'win_123',
    }, ws1)

    expect(ws2.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: MESSAGE_TYPES.WINDOW_CLOSE,
        windowId: 'win_123',
      })
    )
  })

  it('should relay file events', () => {
    room.broadcast({
      type: MESSAGE_TYPES.FILE_CREATE,
      path: 'C:/Documents/test.txt',
      content: 'Hello',
    }, ws1)

    expect(ws2.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: MESSAGE_TYPES.FILE_CREATE,
        path: 'C:/Documents/test.txt',
        content: 'Hello',
      })
    )
  })
})
