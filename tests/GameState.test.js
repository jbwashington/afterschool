import { describe, it, expect, beforeEach } from 'vitest'
import { GameState } from '../server/rooms/GameState.js'
import { ENTITY_TYPES, GAME } from '../shared/constants.js'

describe('GameState', () => {
  let gameState

  beforeEach(() => {
    gameState = new GameState()
  })

  describe('initialization', () => {
    it('should create default world with ground plane', () => {
      expect(gameState.entityCount).toBe(1)
      const entities = Array.from(gameState.entities.values())
      expect(entities[0].type).toBe(ENTITY_TYPES.GROUND)
    })

    it('should have empty rules initially', () => {
      expect(gameState.activeRules).toHaveLength(0)
    })

    it('should have empty applied features initially', () => {
      expect(gameState.appliedFeatureIds).toHaveLength(0)
    })
  })

  describe('entity management', () => {
    it('should spawn entities up to the limit', () => {
      for (let i = 0; i < GAME.MAX_ENTITIES - 1; i++) {
        const entity = gameState.spawnEntity({
          type: ENTITY_TYPES.DECORATION,
          position: { x: i, y: 0, z: 0 },
        })
        expect(entity).not.toBeNull()
      }
      expect(gameState.entityCount).toBe(GAME.MAX_ENTITIES)
    })

    it('should not spawn beyond entity limit', () => {
      // Fill up to limit
      for (let i = 0; i < GAME.MAX_ENTITIES - 1; i++) {
        gameState.spawnEntity({ type: ENTITY_TYPES.DECORATION })
      }

      // Try to add one more
      const entity = gameState.spawnEntity({ type: ENTITY_TYPES.DECORATION })
      expect(entity).toBeNull()
      expect(gameState.entityCount).toBe(GAME.MAX_ENTITIES)
    })

    it('should remove entities correctly', () => {
      const entity = gameState.spawnEntity({ type: ENTITY_TYPES.TREE })
      expect(gameState.entityCount).toBe(2) // ground + tree

      const removed = gameState.removeEntity(entity.id)
      expect(removed).toBe(true)
      expect(gameState.entityCount).toBe(1)
    })

    it('should update entity properties', () => {
      const entity = gameState.spawnEntity({
        type: ENTITY_TYPES.BUILDING,
        color: 0xff0000,
      })

      gameState.updateEntity(entity.id, { color: 0x00ff00 })
      const updated = gameState.getEntity(entity.id)
      expect(updated.color).toBe(0x00ff00)
    })
  })

  describe('feature application', () => {
    it('should apply feature spawn actions', () => {
      const feature = {
        id: 'test_feature',
        spawn: [
          { type: ENTITY_TYPES.TREE, position: { x: 1, y: 0, z: 1 } },
          { type: ENTITY_TYPES.TREE, position: { x: 2, y: 0, z: 2 } },
        ],
      }

      const results = gameState.applyFeature(feature)
      expect(results).toHaveLength(2)
      expect(gameState.entityCount).toBe(3) // ground + 2 trees
      expect(gameState.appliedFeatureIds).toContain('test_feature')
    })

    it('should apply feature rules', () => {
      const feature = {
        id: 'test_rule_feature',
        rules: [
          { trigger: 'audio', condition: 'clap', effect: { type: 'change_color' } },
        ],
      }

      const results = gameState.applyFeature(feature)
      expect(results).toHaveLength(1)
      expect(gameState.activeRules).toHaveLength(1)
    })
  })

  describe('serialization', () => {
    it('should serialize state correctly', () => {
      gameState.spawnEntity({ type: ENTITY_TYPES.BUILDING, color: 0x123456 })

      const serialized = gameState.serialize()
      expect(serialized.entities).toHaveLength(2)
      expect(serialized.rules).toHaveLength(0)
      expect(serialized.entityCount).toBe(2)
    })
  })
})
