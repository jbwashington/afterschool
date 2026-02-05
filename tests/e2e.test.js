import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Room } from '../server/rooms/Room.js'
import { MESSAGE_TYPES, GAME } from '../shared/constants.js'

// Mock WebSocket
const createMockWs = () => ({
  send: vi.fn(),
  readyState: 1,
})

describe('E2E: Complete Game Session', () => {
  let room
  let ws1, ws2
  let player1, player2

  beforeEach(() => {
    room = new Room('e2e-test')
    ws1 = createMockWs()
    ws2 = createMockWs()
  })

  it('should complete full join → play → resolve → repeat cycle', async () => {
    // === JOIN PHASE ===
    player1 = room.addPlayer(ws1)
    expect(player1).not.toBeNull()
    expect(room.currentPhase).toBe('waiting')

    player2 = room.addPlayer(ws2)
    expect(player2).not.toBeNull()
    expect(room.currentPhase).toBe('plan')
    expect(room.currentTurn).toBe(1)

    // === PLAN PHASE ===
    expect(room.availableCards.length).toBeGreaterThanOrEqual(2)

    // Both players select cards
    const card1 = room.availableCards[0]
    const card2 = room.availableCards[1] || room.availableCards[0]

    room.selectCard(player1.id, card1.id)
    expect(room.cardSelections.size).toBe(1)

    room.selectCard(player2.id, card2.id)
    expect(room.cardSelections.size).toBe(2)

    // === RESOLVE PHASE ===
    expect(room.currentPhase).toBe('resolve')

    // Wait for resolve to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Features should have been applied
    expect(room.gameState.appliedFeatureIds.length).toBeGreaterThanOrEqual(1)

    // World update should have been broadcast
    const hasWorldUpdate = ws1.send.mock.calls.some(call => {
      const msg = JSON.parse(call[0])
      return msg.type === MESSAGE_TYPES.WORLD_UPDATE && msg.features
    })
    expect(hasWorldUpdate).toBe(true)
  })

  it('should enforce role alternation across turns', async () => {
    player1 = room.addPlayer(ws1)
    player2 = room.addPlayer(ws2)

    // Get roles for turn 1
    const turn1Roles = room.getRoles()

    // Complete turn 1
    const card1 = room.availableCards[0]
    const card2 = room.availableCards[1] || room.availableCards[0]
    room.selectCard(player1.id, card1.id)
    room.selectCard(player2.id, card2.id)

    // Wait for turn to complete (resolve + reflect)
    await new Promise(resolve => setTimeout(resolve, 6000))

    // Should be on turn 2
    expect(room.currentTurn).toBe(2)

    // Get roles for turn 2
    const turn2Roles = room.getRoles()

    // Roles should have swapped
    expect(turn1Roles[player1.id]).not.toBe(turn2Roles[player1.id])
  }, 10000)

  it('should maintain entity count within limits', async () => {
    player1 = room.addPlayer(ws1)
    player2 = room.addPlayer(ws2)

    // Play multiple turns
    for (let i = 0; i < 5; i++) {
      if (room.currentPhase !== 'plan') {
        await new Promise(resolve => setTimeout(resolve, 100))
        continue
      }

      if (room.availableCards.length < 2) break

      const card1 = room.availableCards[0]
      const card2 = room.availableCards[Math.min(1, room.availableCards.length - 1)]

      room.selectCard(player1.id, card1.id)
      room.selectCard(player2.id, card2.id)

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Entity count should never exceed limit
    expect(room.gameState.entityCount).toBeLessThanOrEqual(GAME.MAX_ENTITIES)
  })

  it('should handle graceful reconnection scenario', async () => {
    player1 = room.addPlayer(ws1)
    player2 = room.addPlayer(ws2)

    // Play one turn
    const card1 = room.availableCards[0]
    room.selectCard(player1.id, card1.id)
    room.selectCard(player2.id, card1.id)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Simulate player 1 disconnect
    room.removePlayer(player1.id)
    expect(room.currentPhase).toBe('waiting')

    // State should be serializable for reconnection
    const state = room.getState()
    expect(state.world).toBeDefined()
    expect(state.world.entities).toBeDefined()
    expect(state.world.appliedFeatureIds.length).toBeGreaterThanOrEqual(1)

    // New player reconnects
    const ws3 = createMockWs()
    const player3 = room.addPlayer(ws3)
    expect(player3).not.toBeNull()

    // Game should still be waiting since only 1 player now
    // But when second player joins again, world state is preserved
    expect(room.gameState.appliedFeatureIds.length).toBeGreaterThanOrEqual(1)
  })
})

describe('E2E: Agent Module Validation', () => {
  let room
  let ws1, ws2

  beforeEach(() => {
    room = new Room('agent-test')
    ws1 = createMockWs()
    ws2 = createMockWs()
    room.addPlayer(ws1)
    room.addPlayer(ws2)
  })

  it('should validate all feature modules before execution', () => {
    const registry = room.featureRegistry

    // All features should be valid
    for (const [id, feature] of registry.features) {
      expect(feature.id).toBeDefined()
      expect(feature.name).toBeDefined()
      expect(feature.category).toBeDefined()

      // If has spawn, should have valid structure
      if (feature.spawn) {
        expect(Array.isArray(feature.spawn)).toBe(true)
        for (const spawn of feature.spawn) {
          expect(spawn.type).toBeDefined()
        }
      }

      // If has rules, should have valid structure
      if (feature.rules) {
        expect(Array.isArray(feature.rules)).toBe(true)
        for (const rule of feature.rules) {
          expect(rule.trigger).toBeDefined()
          expect(rule.effect).toBeDefined()
        }
      }

      // Should have constraints
      if (feature.constraints) {
        expect(typeof feature.constraints).toBe('object')
      }
    }
  })

  it('should reject malformed feature application', () => {
    // Try to apply a non-existent feature
    const fakeCard = { id: 'malformed_feature_xyz' }
    const result = room.featureRegistry.applyCard(fakeCard, room.gameState)

    expect(result).toBeNull()
    // Game should not crash
    expect(room.currentPhase).toBe('plan')
  })

  it('should enforce feature constraints', () => {
    // Find a feature with maxCount: 1
    let singleUseFeature = null
    for (const [id, feature] of room.featureRegistry.features) {
      if (feature.constraints?.maxCount === 1) {
        singleUseFeature = feature
        break
      }
    }

    if (singleUseFeature) {
      // Apply it once - should succeed
      const result1 = room.featureRegistry.applyCard(
        { id: singleUseFeature.id },
        room.gameState
      )
      expect(result1).not.toBeNull()

      // Apply it again - should fail
      const result2 = room.featureRegistry.applyCard(
        { id: singleUseFeature.id },
        room.gameState
      )
      expect(result2).toBeNull()
    }
  })
})

describe('E2E: Deterministic Turn Resolution', () => {
  it('should produce same results given same inputs', async () => {
    // Create two identical rooms
    const room1 = new Room('determ-1')
    const room2 = new Room('determ-2')

    const ws1a = createMockWs()
    const ws1b = createMockWs()
    const ws2a = createMockWs()
    const ws2b = createMockWs()

    room1.addPlayer(ws1a)
    room1.addPlayer(ws1b)
    room2.addPlayer(ws2a)
    room2.addPlayer(ws2b)

    // Both rooms should start with same state
    expect(room1.currentTurn).toBe(room2.currentTurn)
    expect(room1.currentPhase).toBe(room2.currentPhase)

    // Note: Card generation has randomness, but the game state processing is deterministic
    // If we apply the same features, we should get the same results
    const testFeature = room1.featureRegistry.getFeature('playground')

    if (testFeature) {
      const results1 = room1.gameState.applyFeature(testFeature)
      const results2 = room2.gameState.applyFeature(testFeature)

      // Same feature should produce same number of results
      expect(results1.length).toBe(results2.length)

      // Entity counts should match
      expect(room1.gameState.entityCount).toBe(room2.gameState.entityCount)
    }
  })
})
