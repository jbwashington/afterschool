import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Room } from '../server/rooms/Room.js'
import { RoomManager } from '../server/rooms/RoomManager.js'
import { GAME, MESSAGE_TYPES } from '../shared/constants.js'

// Mock WebSocket
const createMockWs = () => ({
  send: vi.fn(),
  readyState: 1,
})

describe('Integration: Two-Player Synchronization', () => {
  let roomManager
  let ws1, ws2
  let player1, player2

  beforeEach(() => {
    roomManager = new RoomManager()
    ws1 = createMockWs()
    ws2 = createMockWs()
  })

  it('should sync both players to same game state on join', () => {
    player1 = roomManager.addPlayer('sync-test', ws1)
    player2 = roomManager.addPlayer('sync-test', ws2)

    const room = roomManager.getRoom('sync-test')
    const state = room.getState()

    // Both players should see same world state
    expect(state.playerCount).toBe(2)
    expect(state.turn).toBe(1)
    expect(state.phase).toBe('plan')
  })

  it('should broadcast turn start to both players', () => {
    player1 = roomManager.addPlayer('sync-test', ws1)
    player2 = roomManager.addPlayer('sync-test', ws2)

    // Both should have received turn_start message
    const calls1 = ws1.send.mock.calls
    const calls2 = ws2.send.mock.calls

    const hasTurnStart1 = calls1.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.TURN_START
    })
    const hasTurnStart2 = calls2.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.TURN_START
    })

    expect(hasTurnStart1).toBe(true)
    expect(hasTurnStart2).toBe(true)
  })

  it('should notify both players when one selects a card', () => {
    player1 = roomManager.addPlayer('sync-test', ws1)
    player2 = roomManager.addPlayer('sync-test', ws2)

    const room = roomManager.getRoom('sync-test')
    const cardId = room.availableCards[0].id

    // Clear previous calls
    ws1.send.mockClear()
    ws2.send.mockClear()

    // Player 1 selects card
    room.selectCard(player1.id, cardId)

    // Both should receive card_selected notification
    const p1Received = ws1.send.mock.calls.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.CARD_SELECTED
    })
    const p2Received = ws2.send.mock.calls.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.CARD_SELECTED
    })

    expect(p1Received).toBe(true)
    expect(p2Received).toBe(true)
  })
})

describe('Integration: Card Selection and Application', () => {
  let room
  let ws1, ws2
  let player1, player2

  beforeEach(() => {
    room = new Room('card-test')
    ws1 = createMockWs()
    ws2 = createMockWs()
    player1 = room.addPlayer(ws1)
    player2 = room.addPlayer(ws2)
  })

  it('should apply features when both players select cards', async () => {
    const initialEntityCount = room.gameState.entityCount

    // Both players select different cards
    const card1 = room.availableCards[0]
    const card2 = room.availableCards[1]

    room.selectCard(player1.id, card1.id)
    room.selectCard(player2.id, card2.id)

    // Phase should change to resolve
    expect(room.currentPhase).toBe('resolve')

    // Wait for resolve phase to process
    await new Promise(resolve => setTimeout(resolve, 100))

    // Entity count should have increased if cards had spawns
    const newEntityCount = room.gameState.entityCount
    expect(newEntityCount).toBeGreaterThanOrEqual(initialEntityCount)
  })

  it('should include feature results in world update broadcast', async () => {
    ws1.send.mockClear()
    ws2.send.mockClear()

    const card1 = room.availableCards[0]
    const card2 = room.availableCards[1]

    room.selectCard(player1.id, card1.id)
    room.selectCard(player2.id, card2.id)

    // Check that world_update was sent with features
    const worldUpdateSent = ws1.send.mock.calls.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.WORLD_UPDATE && msg.features
    })

    expect(worldUpdateSent).toBe(true)
  })
})

describe('Integration: Audio Signal Handling', () => {
  let room
  let ws1, ws2
  let player1, player2

  beforeEach(() => {
    room = new Room('audio-test')
    ws1 = createMockWs()
    ws2 = createMockWs()
    player1 = room.addPlayer(ws1)
    player2 = room.addPlayer(ws2)
  })

  it('should process audio signals from players', () => {
    const signal = { volume: 0.8, peak: 0.9, rhythm: 0.5 }

    // This should not throw
    expect(() => {
      room.handleAudioSignal(player1.id, signal)
    }).not.toThrow()
  })

  it('should apply rules that respond to audio', () => {
    // Spawn an entity first (world starts empty)
    const entity = room.gameState.spawnEntity({ type: 'ground', color: 0x00ff00 })

    // Add a clap rule targeting that entity
    room.gameState.addRule({
      id: 'test-clap-rule',
      trigger: 'audio',
      condition: 'clap',
      effect: { type: 'change_color', targetId: entity.id, color: 0xff0000 }
    })

    // Send a clap signal (high peak)
    const clapSignal = { volume: 0.5, peak: 0.9, rhythm: 0.3 }
    const result = room.gameState.processAudioSignal(player1.id, clapSignal)

    // Result should contain the effect
    expect(result).not.toBeNull()
  })

  it('should broadcast audio-triggered world updates', () => {
    ws1.send.mockClear()
    ws2.send.mockClear()

    // Spawn an entity first (world starts empty)
    const testEntity = room.gameState.spawnEntity({ type: 'ground', color: 0x00ff00 })
    room.gameState.addRule({
      id: 'test-rule',
      trigger: 'audio',
      condition: 'clap',
      effect: { type: 'change_color', targetId: testEntity.id, color: 0xff0000 }
    })

    // Send clap signal
    room.handleAudioSignal(player1.id, { volume: 0.5, peak: 0.9, rhythm: 0.3 })

    // Check if world update was sent
    const updateSent = ws1.send.mock.calls.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.WORLD_UPDATE
    })

    expect(updateSent).toBe(true)
  })
})

describe('Integration: Graceful Disconnect Handling', () => {
  let roomManager
  let ws1, ws2

  beforeEach(() => {
    roomManager = new RoomManager()
    ws1 = createMockWs()
    ws2 = createMockWs()
  })

  it('should notify remaining player when one disconnects', () => {
    const player1 = roomManager.addPlayer('disconnect-test', ws1)
    const player2 = roomManager.addPlayer('disconnect-test', ws2)

    ws2.send.mockClear()

    // Player 1 disconnects
    roomManager.removePlayer('disconnect-test', player1.id)

    // Player 2 should receive game_state notification (game paused)
    const stateNotification = ws2.send.mock.calls.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.GAME_STATE
    })

    expect(stateNotification).toBe(true)
  })

  it('should pause game when player disconnects', () => {
    const player1 = roomManager.addPlayer('disconnect-test', ws1)
    roomManager.addPlayer('disconnect-test', ws2)

    const room = roomManager.getRoom('disconnect-test')
    expect(room.currentPhase).toBe('plan')

    roomManager.removePlayer('disconnect-test', player1.id)
    expect(room.currentPhase).toBe('waiting')
  })

  it('should clean up empty rooms', () => {
    const player1 = roomManager.addPlayer('cleanup-test', ws1)

    expect(roomManager.getRoom('cleanup-test')).toBeDefined()

    roomManager.removePlayer('cleanup-test', player1.id)

    expect(roomManager.getRoom('cleanup-test')).toBeUndefined()
  })
})
